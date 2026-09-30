import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/validation/auth";

// Pintu kembali setelah pengguna meninggalkan situs kita:
//  - dari halaman login Google  -> membawa ?code=...
//  - dari tautan di email (verifikasi akun / reset password):
//      * format bawaan Supabase  -> ?code=...  (hanya berhasil di browser yang sama saat meminta)
//      * format token_hash       -> ?token_hash=...&type=...  (berhasil walau email dibuka di HP lain)
// Di sini "tiket" itu ditukar menjadi sesi login (cookie), lalu pengguna diarahkan ke ?next.

const OTP_TYPES: EmailOtpType[] = ["signup", "email", "recovery", "invite", "magiclink", "email_change"];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;

  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type && OTP_TYPES.includes(type)) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  }

  if (!ok) {
    // Tautan kedaluwarsa/sudah dipakai, atau login Google dibatalkan
    return NextResponse.redirect(new URL("/masuk?error=tautan", origin));
  }
  const dest = type === "recovery" ? "/reset-password" : next;
  return NextResponse.redirect(new URL(dest, origin));
}
