import "server-only";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

// Rate limit = "buku catatan satpam": berapa kali sebuah kunci (IP, email) mencoba dalam satu jendela waktu.
// Penghitungnya di tabel Postgres rate_limits (lihat migration rate_limit), jadi tetap akurat
// walaupun Vercel menjalankan banyak server sekaligus.

export const LIMITS = {
  login: { max: 5, windowSeconds: 15 * 60 }, // 5x per 15 menit per IP+email
  loginIp: { max: 30, windowSeconds: 15 * 60 }, // 30x per 15 menit per IP (menebak banyak email)
  register: { max: 5, windowSeconds: 60 * 60 },
  resetEmail: { max: 3, windowSeconds: 60 * 60 }, // kirim email reset per email
  changePassword: { max: 5, windowSeconds: 15 * 60 },
  checkout: { max: 10, windowSeconds: 10 * 60 }, // buat pesanan per user
  payment: { max: 20, windowSeconds: 10 * 60 }, // buat VA/QR & cek status bayar per user
  shippingQuote: { max: 30, windowSeconds: 10 * 60 }, // cek ongkir per user (Fase 6 memakai kuota API)
} as const;

export async function clientIp(): Promise<string> {
  const h = await headers();
  // Di Vercel, IP asli pengunjung ada di x-forwarded-for (bagian pertama).
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

// true = boleh lanjut, false = terlalu sering.
// Kalau database error, kita IZINKAN (fail-open) supaya gangguan kecil tidak mengunci semua pembeli;
// Supabase Auth tetap punya rate limit bawaannya sendiri sebagai lapis kedua.
export async function checkRateLimit(key: string, limit: { max: number; windowSeconds: number }) {
  const { data, error } = await createAdminClient().rpc("check_rate_limit", {
    p_key: key.slice(0, 200),
    p_max: limit.max,
    p_window_seconds: limit.windowSeconds,
  });
  if (error) {
    console.error("rate limit error:", error.message);
    return true;
  }
  return data === true;
}

export const TOO_MANY = "Terlalu banyak percobaan. Tunggu beberapa menit, lalu coba lagi.";
