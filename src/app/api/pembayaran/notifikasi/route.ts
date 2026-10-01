import { revalidatePath } from "next/cache";
import { callbackKey } from "@/lib/komerce-payment/client";
import { verifyCallbackSignature } from "@/lib/komerce-payment/signature";
import { callbackPaymentId } from "@/lib/komerce-payment/status";
import { PaymentMismatchError, applyKomerceStatus } from "@/lib/payments";
import { createAdminClient } from "@/lib/supabase/admin";

// Webhook (callback) Komerce Payment: Komerce "mengetuk pintu" server kita setiap status VA/QRIS berubah.
// Alamat ini dikirim otomatis di setiap transaksi (callback_url), jadi tidak perlu didaftarkan di dashboard.
//
// Urutan pemeriksaan:
// 1) Segel HMAC-SHA256 dari body MENTAH harus cocok dengan KOMERCE_CALLBACK_KEY -> kalau tidak: 401
// 2) payment_id harus ada di tabel payments kita                                -> kalau tidak: 200 (diabaikan)
// 3) Status TIDAK diambil dari isi callback, tapi ditanyakan ulang ke API Komerce
// 4) Diterapkan lewat apply_payment_status (idempoten: callback ganda aman)

export async function POST(request: Request) {
  const raw = await request.text(); // teks asli, belum di-parse: dipakai untuk menghitung segel
  if (!verifyCallbackSignature(raw, request.headers.get("x-callback-api-key"), callbackKey())) {
    console.warn("callback pembayaran: signature salah");
    return Response.json({ ok: false, error: "Signature tidak valid" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {
    // ditangani di bawah (payment_id tidak ada)
  }
  const paymentId = callbackPaymentId(body);
  if (!paymentId) return Response.json({ ok: false, error: "Callback tidak dikenali" }, { status: 400 });

  const { data: payment } = await createAdminClient()
    .from("payments")
    .select("order:orders (order_number)")
    .eq("provider_payment_id", paymentId)
    .maybeSingle();
  if (!payment) {
    // Bukan milik website ini (mis. transaksi uji dari dashboard). Jawab 200 supaya tidak dikirim ulang.
    console.warn(`callback pembayaran: ${paymentId} tidak dikenal`);
    return Response.json({ ok: true, result: "unknown" });
  }

  try {
    const result = await applyKomerceStatus(paymentId);
    if (result === "paid") {
      revalidatePath(`/akun/pesanan/${payment.order?.order_number ?? ""}`);
      revalidatePath("/", "layout"); // urutan "Terlaris" di katalog berubah
    }
    return Response.json({ ok: true, result });
  } catch (e) {
    if (e instanceof PaymentMismatchError) {
      // Dicoba ulang pun hasilnya sama: jawab 200 supaya berhenti dikirim, dan catat untuk dicek.
      console.error("callback ditolak:", e.message);
      return Response.json({ ok: false, error: "Pembayaran tidak cocok" });
    }
    console.error("callback error:", e instanceof Error ? e.message : e);
    return Response.json({ ok: false, error: "Gangguan sementara" }, { status: 500 });
  }
}
