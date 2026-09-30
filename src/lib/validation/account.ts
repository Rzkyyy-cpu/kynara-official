import { z } from "zod";
import { checkboxField, fullNameField, newPasswordField, phoneField } from "@/lib/validation/fields";

// Tanggal lahir opsional, format dari <input type="date">: YYYY-MM-DD.
const birthDateField = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(
    z
      .iso.date("Tanggal lahir belum benar.")
      .refine((v) => v >= "1900-01-01" && v <= new Date().toISOString().slice(0, 10), "Tanggal lahir belum benar.")
      .nullable(),
  );

export const profileSchema = z.object({
  fullName: fullNameField,
  phone: phoneField,
  birthDate: birthDateField,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Isi password lama dulu, ya."),
    password: newPasswordField,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Ulangi password baru dengan sama persis.",
  })
  .refine((d) => d.password !== d.currentPassword, {
    path: ["password"],
    message: "Password baru harus berbeda dari password lama.",
  });

export const ADDRESS_LABELS = ["Rumah", "Kantor", "Kos", "Lainnya"] as const;

// Form alamat mengirim KODE wilayah (dari dropdown). Nama wilayah dicari di server dari data resmi,
// jadi isian yang dimanipulasi (kode asal-asalan) akan ditolak.
export const addressSchema = z.object({
  id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  label: z.enum(ADDRESS_LABELS, "Pilih label alamat."),
  recipientName: fullNameField.pipe(z.string().max(100)),
  phone: phoneField,
  provinceCode: z.string().regex(/^\d{2}$/, "Pilih provinsi."),
  cityCode: z.string().regex(/^\d{2}\.\d{2}$/, "Pilih kota/kabupaten."),
  districtCode: z.string().regex(/^\d{2}\.\d{2}\.\d{2}$/, "Pilih kecamatan."),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Kode pos berisi 5 angka."),
  street: z
    .string()
    .trim()
    .min(5, "Tulis alamat lengkap (minimal 5 karakter).")
    .max(300, "Alamat maksimal 300 karakter."),
  landmark: z
    .string()
    .trim()
    .max(150, "Patokan maksimal 150 karakter.")
    .transform((v) => (v === "" ? null : v)),
  isDefault: checkboxField,
});

export type AddressInput = z.infer<typeof addressSchema>;
