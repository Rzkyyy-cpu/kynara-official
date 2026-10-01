"use server";

import { revalidatePath } from "next/cache";
import { getUser, siteOrigin } from "@/lib/auth";
import { type PaymentChoice, paymentChoiceSchema } from "@/lib/komerce-payment/status";
import { getMyOrder } from "@/lib/orders";
import { startPayment, syncOrderPayments } from "@/lib/payments";
import { LIMITS, TOO_MANY, checkRateLimit } from "@/lib/rate-limit";

type Result = { ok: true; status?: string } | { ok: false; error: string };

const ORDER_NUMBER = /^KYN-\d{6}-\d{4,}$/;
const NOT_LOGGED_IN = "Sesi login berakhir. Silakan masuk lagi.";

// Buat VA/QR baru (ganti metode, atau QR lama sudah kedaluwarsa)
export async function choosePayment(orderNumber: string, choice: PaymentChoice): Promise<Result> {
  const user = await getUser();
  if (!user) return { ok: false, error: NOT_LOGGED_IN };
  const parsed = paymentChoiceSchema.safeParse(choice);
  if (!ORDER_NUMBER.test(orderNumber) || !parsed.success) return { ok: false, error: "Pilihan pembayaran tidak valid." };
  if (!(await checkRateLimit(`pay:${user.id}`, LIMITS.payment))) return { ok: false, error: TOO_MANY };

  try {
    const res = await startPayment(user, orderNumber, parsed.data, await siteOrigin());
    if (res.ok) revalidatePath(`/akun/pesanan/${orderNumber}`);
    return res;
  } catch (e) {
    console.error("choosePayment:", e instanceof Error ? e.message : e);
    return { ok: false, error: "Layanan pembayaran sedang gangguan. Coba lagi beberapa saat lagi." };
  }
}

// "Sudah bayar? Cek status": tanya langsung ke Komerce tanpa menunggu callback.
// Berguna juga saat mencoba di localhost, yang tidak bisa dijangkau callback Komerce.
export async function checkPayment(orderNumber: string): Promise<Result> {
  const user = await getUser();
  if (!user) return { ok: false, error: NOT_LOGGED_IN };
  if (!ORDER_NUMBER.test(orderNumber)) return { ok: false, error: "Pesanan tidak ditemukan." };
  if (!(await checkRateLimit(`pay:${user.id}`, LIMITS.payment))) return { ok: false, error: TOO_MANY };

  // Pastikan pesanan ini milik user (dibaca lewat RLS) sebelum bertanya ke Komerce
  const order = await getMyOrder(user.id, orderNumber);
  if (!order) return { ok: false, error: "Pesanan tidak ditemukan." };
  if (order.status !== "menunggu_pembayaran") return { ok: true, status: order.status };

  try {
    await syncOrderPayments(order.id);
  } catch (e) {
    console.error("checkPayment:", e instanceof Error ? e.message : e);
    return { ok: false, error: "Status pembayaran belum bisa dicek. Coba lagi sebentar lagi." };
  }
  const fresh = await getMyOrder(user.id, orderNumber);
  const status = fresh?.status ?? order.status;
  revalidatePath(`/akun/pesanan/${orderNumber}`);
  if (status !== order.status) revalidatePath("/", "layout"); // urutan "Terlaris" di katalog berubah
  return { ok: true, status };
}
