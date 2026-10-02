import { z } from "zod";
import { checkboxField, emailField, fullNameField, newPasswordField, phoneField } from "@/lib/validation/fields";

export const loginSchema = z.object({
  email: emailField,
  // Saat login jangan menilai kekuatan password (akun lama mungkin punya aturan berbeda), cukup wajib diisi.
  password: z.string().min(1, "Isi password dulu, ya.").max(72, "Password maksimal 72 karakter."),
  remember: checkboxField,
});

export const registerSchema = z.object({
  fullName: fullNameField,
  phone: phoneField,
  email: emailField,
  password: newPasswordField,
  agree: checkboxField.refine((v) => v, "Centang persetujuan Syarat & Ketentuan dulu, ya."),
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    password: newPasswordField,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Ulangi password baru dengan sama persis.",
  });

// Alamat tujuan setelah login (?next=...). Hanya boleh path di situs sendiri,
// supaya link login tidak bisa dipakai untuk melempar orang ke situs penipu ("open redirect").
// Cara cek: biarkan parser URL (sama seperti browser) membaca alamatnya terhadap situs palsu "kynara.invalid".
// Kalau hasilnya pindah ke situs lain, tolak. Ini juga menangkap trik seperti "/\t/penipu.com":
// browser membuang tab, sehingga alamat itu berubah jadi "//penipu.com".
export function safeNextPath(value: unknown, fallback = "/akun"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.length > 512) return fallback;
  if (/[\u0000-\u001F\u007F\\]/.test(value)) return fallback; // karakter kontrol & backslash
  try {
    const url = new URL(value, "https://kynara.invalid");
    if (url.origin !== "https://kynara.invalid") return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
