import { createHmac, timingSafeEqual } from "node:crypto";

// Verifikasi callback Komerce Payment (https://rajaongkir.com/docs/payment-api/getting-started/callback-handling).
//
// HMAC-SHA256 = "segel lilin dengan cap pribadi". Komerce menghitung segel dari ISI MENTAH body callback
// memakai Callback API Key (kunci rahasia yang kita buat sendiri & kirim saat membuat transaksi),
// lalu mengirim segelnya di header X-Callback-Api-Key. Kita hitung ulang dengan kunci yang sama:
// kalau isi diubah satu huruf saja, atau pengirim tidak tahu kuncinya, segelnya tidak akan cocok.
//
// PENTING: yang di-hash harus teks body persis seperti diterima (jangan JSON.parse lalu stringify lagi).

export function callbackSignature(rawBody: string, callbackKey: string) {
  return createHmac("sha256", callbackKey).update(rawBody, "utf8").digest();
}

export function verifyCallbackSignature(rawBody: string, header: string | null, callbackKey: string | undefined): boolean {
  if (!callbackKey || !header) return false; // tanpa kunci atau tanpa segel: tolak
  const expected = callbackSignature(rawBody, callbackKey);
  const value = header.trim();
  // Dokumentasi tidak menyebut formatnya, jadi terima hex (umum) maupun base64
  const received = /^[0-9a-f]{64}$/i.test(value) ? Buffer.from(value, "hex") : Buffer.from(value, "base64");
  // timingSafeEqual: waktu pembandingan selalu sama, supaya segel tidak bisa ditebak sedikit demi sedikit
  return received.length === expected.length && timingSafeEqual(received, expected);
}
