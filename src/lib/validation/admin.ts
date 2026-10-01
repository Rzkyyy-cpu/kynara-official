import { z } from "zod";
import { TRACKING_PATTERN } from "@/lib/admin/order-rules";

// Validasi input halaman admin: parameter URL (filter) dan isi aksi (ubah status).
// Parameter URL yang aneh tidak membuat error, tapi kembali ke nilai bawaan (.catch).

// searchParams bisa berupa string, array (?a=1&a=2), atau tidak ada; ambil nilai pertama
const param = <T extends z.ZodType>(schema: T) => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), schema);

// ---------- Ringkasan ----------
export const PERIODS = {
  hari: "Hari ini",
  "7": "7 hari terakhir",
  "30": "30 hari terakhir",
  bulan: "Bulan ini",
} as const;
export type Period = keyof typeof PERIODS;

export const periodSchema = param(z.enum(["hari", "7", "30", "bulan"]).catch("30"));

// ---------- Daftar pesanan ----------
export const ORDER_TABS = {
  semua: "Semua",
  menunggu_pembayaran: "Menunggu Pembayaran",
  diproses: "Diproses",
  dikirim: "Dikirim",
  selesai: "Selesai",
  batal: "Dibatalkan", // dibatalkan + kedaluwarsa
} as const;
export type OrderTab = keyof typeof ORDER_TABS;

export const ORDER_RANGES = { "7": "7 hari terakhir", "30": "30 hari terakhir", semua: "Semua waktu" } as const;
export const COURIER_FILTERS = { semua: "Semua kurir", jne: "JNE", jnt: "J&T", sicepat: "SiCepat", flat: "Tarif flat" } as const;

export const orderFiltersSchema = z.object({
  status: param(z.enum(Object.keys(ORDER_TABS) as [OrderTab, ...OrderTab[]]).catch("semua")),
  // Huruf, angka, spasi, titik, apostrof, strip saja: aman dipakai di filter PostgREST
  q: param(
    z
      .string()
      .trim()
      .max(50)
      .regex(/^[\p{L}\p{N} .'-]*$/u)
      .catch(""),
  ).catch(""),
  rentang: param(z.enum(["7", "30", "semua"]).catch("30")),
  kurir: param(z.enum(["semua", "jne", "jnt", "sicepat", "flat"]).catch("semua")),
  hal: param(z.coerce.number().int().min(1).max(1000).catch(1)),
});
export type OrderFilters = z.infer<typeof orderFiltersSchema>;

// ---------- Ubah status pesanan ----------
export const updateOrderSchema = z.object({
  nomor: z.string().regex(/^KYN-\d{6}-\d{4,}$/, "Nomor pesanan tidak valid."),
  status: z.enum(["menunggu_pembayaran", "diproses", "dikirim", "selesai", "dibatalkan", "kedaluwarsa"]),
  resi: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => v || undefined)
    .refine((v) => v === undefined || TRACKING_PATTERN.test(v), "Nomor resi 6–40 karakter, hanya huruf, angka, dan tanda strip."),
});
export type UpdateOrderInput = z.input<typeof updateOrderSchema>;

export const orderNumberSchema = z.string().regex(/^KYN-\d{6}-\d{4,}$/);
