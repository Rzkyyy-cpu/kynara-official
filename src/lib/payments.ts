import "server-only";

import type { AddressSnapshot } from "@/lib/checkout";
import {
  KomercePaymentError,
  cancelPayment,
  createPayment,
  getPaymentMethods,
  getPaymentStatus,
} from "@/lib/komerce-payment/client";
import {
  MIN_AMOUNT,
  type PaymentChoice,
  QRIS_MAX_AMOUNT,
  parseKomerceTime,
  vaExpirySeconds,
} from "@/lib/komerce-payment/status";
import { createAdminClient } from "@/lib/supabase/admin";

// Logika pembayaran di server (Komerce Payment: VA & QRIS).
// Semua perubahan status lewat fungsi database apply_payment_status, baik dari callback maupun
// dari tombol "Cek status", supaya aturannya hanya ada di satu tempat.

export type ApplyResult = "paid" | "closed" | "ignored" | "late_payment" | "duplicate_payment";

// Kesalahan yang tidak akan beres walau dicoba ulang (pembayaran tidak dikenal, jumlah tidak cocok)
export class PaymentMismatchError extends Error {}

type StartResult = { ok: true } | { ok: false; error: string };

const GANGGUAN = "Layanan pembayaran sedang gangguan. Coba lagi beberapa saat lagi.";

// Buat VA / QR untuk pesanan milik user. Kalau sudah ada VA/QR aktif dengan metode yang sama, dipakai ulang.
// Kalau pembeli ganti metode, VA lama dinonaktifkan supaya tidak terbayar dua kali.
export async function startPayment(
  user: { id: string; email?: string },
  orderNumber: string,
  choice: PaymentChoice,
  origin: string,
): Promise<StartResult> {
  const db = createAdminClient();
  // Kunci admin melewati RLS, jadi kepemilikan dicek manual lewat user_id
  const { data: order, error } = await db
    .from("orders")
    .select(
      "id, order_number, status, total, shipping_cost, courier_service, expires_at, shipping_address, items:order_items (product_name, variant_label, price, quantity), payments (provider_payment_id, method, channel_code, status, expires_at)",
    )
    .eq("order_number", orderNumber)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Gagal memuat pesanan: ${error.message}`);
  if (!order) return { ok: false, error: "Pesanan tidak ditemukan." };
  if (order.status !== "menunggu_pembayaran") return { ok: false, error: "Pesanan ini tidak sedang menunggu pembayaran." };
  if (!order.expires_at || new Date(order.expires_at).getTime() - Date.now() < 60_000) {
    return { ok: false, error: "Batas waktu pembayaran pesanan ini sudah habis." };
  }
  if (!user.email) return { ok: false, error: "Akunmu belum punya email. Lengkapi profil dulu, ya." };
  if (order.total < MIN_AMOUNT) return { ok: false, error: "Pembayaran online minimal Rp10.000." };
  if (choice.type === "qris" && order.total > QRIS_MAX_AMOUNT) {
    return { ok: false, error: "QRIS maksimal Rp10.000.000. Pilih virtual account, ya." };
  }

  // Metode harus ada di daftar yang aktif di akun Komerce
  const methods = await getPaymentMethods();
  const code = choice.type === "va" ? choice.bank : "QRIS";
  if (!methods.some((m) => m.type === choice.type && m.code === code)) {
    return { ok: false, error: "Metode pembayaran ini sedang tidak tersedia. Pilih yang lain, ya." };
  }

  const expirySeconds = choice.type === "va" ? vaExpirySeconds(order.expires_at) : undefined;
  if (expirySeconds === null) {
    return { ok: false, error: "Sisa waktu bayar kurang dari 1 jam, jadi virtual account tidak bisa dibuat. Pakai QRIS, ya." };
  }

  const now = Date.now();
  const pending = order.payments.filter((p) => p.status === "PENDING" && new Date(p.expires_at).getTime() > now);
  const same = pending.find((p) => p.method === choice.type && (choice.type === "qris" || p.channel_code === choice.bank));
  // QR yang tinggal < 1 menit dibuat baru saja
  if (same && new Date(same.expires_at).getTime() - now > 60_000) return { ok: true };

  // Ganti metode: nonaktifkan VA lama (QR lama kedaluwarsa sendiri dalam 5 menit)
  for (const p of pending.filter((p) => p.method === "va")) {
    try {
      await cancelPayment(p.provider_payment_id, "Pembeli mengganti metode pembayaran");
      await db.from("payments").update({ status: "CANCELED" }).eq("provider_payment_id", p.provider_payment_id).eq("status", "PENDING");
    } catch (e) {
      // Gagal dibatalkan: tetap PENDING. Kalau terlanjur dibayar, dicatat sebagai pembayaran (ganda) oleh apply_payment_status.
      console.error("cancel VA lama:", e instanceof Error ? e.message : e);
    }
  }

  const address = order.shipping_address as AddressSnapshot;

  // Rincian barang + ongkir sebagai satu baris, supaya jumlahnya sama dengan total
  const items = order.items.map((it) => ({ name: `${it.product_name} (${it.variant_label})`.slice(0, 100), quantity: it.quantity, price: it.price }));
  if (order.shipping_cost > 0) {
    items.push({ name: `Ongkos kirim ${order.courier_service ?? ""}`.trim(), quantity: 1, price: order.shipping_cost });
  }

  try {
    const created = await createPayment({
      // Nomor unik per percobaan: KYN-261001-0016-1, -2, ...
      reference: `${order.order_number}-${order.payments.length + 1}`,
      choice,
      amount: order.total,
      customer: { name: address.recipient_name, email: user.email, phone: address.phone },
      items,
      expirySeconds,
      callbackUrl: `${origin}/api/pembayaran/notifikasi`,
    });
    if (created.amount !== order.total) throw new PaymentMismatchError(`amount ${created.amount} != total ${order.total}`);

    const { error: insertError } = await db.from("payments").insert({
      order_id: order.id,
      provider_payment_id: created.payment_id,
      method: choice.type,
      channel_code: choice.type === "va" ? choice.bank : null,
      va_number: created.va_number ?? null,
      qr_string: created.qr_string ?? null,
      payment_url: created.payment_url ?? null,
      amount: created.amount,
      status: created.status,
      expires_at: parseKomerceTime(created.expired_at) ?? new Date(now + (expirySeconds ?? 300) * 1000).toISOString(),
    });
    if (insertError) throw new Error(`simpan payments: ${insertError.message}`);
    return { ok: true };
  } catch (e) {
    console.error("startPayment:", e instanceof Error ? e.message : e);
    return { ok: false, error: GANGGUAN };
  }
}

// Tanya status satu pembayaran ke Komerce, lalu terapkan ke database.
export async function applyKomerceStatus(paymentId: string): Promise<ApplyResult> {
  const status = await getPaymentStatus(paymentId);
  if (!status) throw new PaymentMismatchError(`${paymentId}: tidak ditemukan di Komerce`);

  const { data, error } = await createAdminClient().rpc("apply_payment_status", {
    p_payment_id: paymentId,
    p_status: status.status,
    p_amount: status.amount,
    p_paid_at: parseKomerceTime(status.paid_at) ?? undefined,
  });
  if (error) {
    if (error.message.includes("PEMBAYARAN_TIDAK_ADA") || error.message.includes("JUMLAH_TIDAK_COCOK")) {
      throw new PaymentMismatchError(`${paymentId}: ${error.message}`);
    }
    throw new Error(`apply_payment_status: ${error.message}`);
  }
  if (data === "late_payment" || data === "duplicate_payment") {
    console.error(`PERLU DICEK ADMIN (${data}) pembayaran ${paymentId}: refund atau proses manual.`);
  }
  return data as ApplyResult;
}

// Cek semua VA/QR yang masih menunggu pada satu pesanan (tombol "Sudah bayar? Cek status").
export async function syncOrderPayments(orderId: string): Promise<void> {
  const { data } = await createAdminClient()
    .from("payments")
    .select("provider_payment_id")
    .eq("order_id", orderId)
    .eq("status", "PENDING")
    .order("created_at", { ascending: false })
    .limit(3);
  for (const p of data ?? []) {
    try {
      await applyKomerceStatus(p.provider_payment_id);
    } catch (e) {
      // 429 = terlalu sering bertanya (batas Komerce 1x per 3 detik); coba lagi nanti
      if (!(e instanceof KomercePaymentError && e.status === 429)) throw e;
    }
  }
}
