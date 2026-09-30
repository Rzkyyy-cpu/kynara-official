"use server";

// Server Action = fungsi yang berjalan di SERVER tetapi bisa dipanggil langsung dari <form>.
// Browser hanya mengirim isian form; validasi, rate limit, dan komunikasi ke Supabase terjadi di sini.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { siteOrigin } from "@/lib/auth";
import { type FormState, formValues, invalid, withoutSecrets } from "@/lib/form";
import { LIMITS, TOO_MANY, checkRateLimit, clientIp } from "@/lib/rate-limit";
import { REMEMBER_COOKIE } from "@/lib/supabase/remember";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  safeNextPath,
} from "@/lib/validation/auth";

const GENERIC_ERROR = "Terjadi gangguan. Coba lagi sebentar lagi.";

// ---------- Masuk dengan email & password ----------
export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { email, password, remember } = parsed.data;
  const values = withoutSecrets(formValues(formData));

  // Dua pembatas: per IP+email (menebak password satu akun) dan per IP (menebak banyak akun).
  const ip = await clientIp();
  const ok =
    (await checkRateLimit(`login:${ip}:${email}`, LIMITS.login)) &&
    (await checkRateLimit(`login-ip:${ip}`, LIMITS.loginIp));
  if (!ok) return { error: TOO_MANY, values };

  const cookieStore = await cookies();
  if (remember) cookieStore.delete(REMEMBER_COOKIE);
  else cookieStore.set(REMEMBER_COOKIE, "0", { path: "/", sameSite: "lax", httpOnly: false });

  const supabase = await createClient({ remember });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Email belum diverifikasi. Buka tautan verifikasi di emailmu dulu, ya.", values };
    }
    if (error.code === "invalid_credentials") {
      return { error: "Email atau password belum cocok.", values };
    }
    console.error("login error:", error.code, error.message);
    return { error: GENERIC_ERROR, values };
  }

  redirect(safeNextPath(formData.get("next")));
}

// ---------- Daftar akun baru ----------
export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { fullName, phone, email, password } = parsed.data;
  const values = withoutSecrets(formValues(formData));

  if (!(await checkRateLimit(`register:${await clientIp()}`, LIMITS.register))) {
    return { error: TOO_MANY, values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Disalin trigger handle_new_user ke tabel profiles
      data: { full_name: fullName, phone },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/akun`,
    },
  });

  if (error) {
    if (error.code === "weak_password") {
      return { fieldErrors: { password: "Password terlalu mudah ditebak. Coba kombinasi lain." }, values };
    }
    if (error.code === "over_email_send_rate_limit") return { error: TOO_MANY, values };
    console.error("register error:", error.code, error.message);
    return { error: GENERIC_ERROR, values };
  }

  // Kalau verifikasi email aktif, belum ada sesi: minta cek email.
  // Supabase sengaja memberi jawaban yang SAMA untuk email yang sudah terdaftar,
  // supaya orang lain tidak bisa mengecek "email ini punya akun atau tidak".
  if (!data.session) {
    return { success: `Cek emailmu (${email}) dan buka tautan verifikasi untuk mengaktifkan akun.` };
  }
  redirect("/akun");
}

// ---------- Masuk / daftar dengan Google ----------
export async function signInWithGoogle(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/masuk?error=google");
  // Pengguna dikirim ke halaman login Google, lalu Google mengembalikannya ke /auth/callback
  redirect(data.url);
}

// ---------- Lupa password: kirim tautan reset ----------
export async function forgotPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { email } = parsed.data;

  const ip = await clientIp();
  const ok =
    (await checkRateLimit(`reset:${email}`, LIMITS.resetEmail)) &&
    (await checkRateLimit(`reset-ip:${ip}`, LIMITS.register));
  if (!ok) return { error: TOO_MANY, values: { email } };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });
  if (error && error.code !== "user_not_found") console.error("reset error:", error.code, error.message);

  // Jawaban selalu sama, baik email terdaftar maupun tidak (lihat alasan di register).
  return { success: email };
}

// ---------- Buat password baru (setelah membuka tautan reset) ----------
export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: "Tautan reset sudah kedaluwarsa. Minta tautan baru dari halaman Lupa password." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") {
      return { fieldErrors: { password: "Password baru harus berbeda dari password lama." } };
    }
    if (error.code === "weak_password") {
      return { fieldErrors: { password: "Password terlalu mudah ditebak. Coba kombinasi lain." } };
    }
    console.error("update password error:", error.code, error.message);
    return { error: GENERIC_ERROR };
  }
  redirect("/akun?pesan=password-diganti");
}
