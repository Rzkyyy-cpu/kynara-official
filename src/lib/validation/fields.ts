import { z } from "zod";

// Aturan kolom yang dipakai ulang di beberapa form. Pesan error ditulis untuk pembeli, bukan programmer.

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Isi email dulu, ya.")
  .max(254, "Email terlalu panjang.")
  .pipe(z.email("Format email belum benar, contoh: nama@email.com."));

// Password baru: minimal 8 karakter, campuran huruf dan angka (sesuai petunjuk di form daftar).
export const newPasswordField = z
  .string()
  .min(8, "Password minimal 8 karakter.")
  .max(72, "Password maksimal 72 karakter.")
  .regex(/[A-Za-z]/, "Password harus berisi huruf.")
  .regex(/[0-9]/, "Password harus berisi angka.");

export const fullNameField = z
  .string()
  .trim()
  .min(2, "Isi nama lengkap (minimal 2 huruf).")
  .max(100, "Nama maksimal 100 karakter.");

// Nomor HP Indonesia. Pengguna boleh mengetik "0812-3456-7890", "+62 812 3456 7890", atau "6281234567890".
// Semuanya disimpan dalam satu bentuk baku: 081234567890.
export const phoneField = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-().]/g, "").replace(/^\+?62/, "0"))
  .pipe(
    z
      .string()
      .min(1, "Isi nomor HP dulu, ya.")
      .regex(/^08[0-9]{8,11}$/, "Nomor HP diawali 08 dan berisi 10–13 angka."),
  );

// Checkbox HTML hanya mengirim nilai kalau dicentang ("on"). Tidak dicentang = tidak ada.
// .optional() wajib: di Zod v4 kolom yang tidak ada di objek hanya boleh kalau skemanya optional.
export const checkboxField = z
  .string()
  .optional()
  .transform((v) => v === "on" || v === "true");
