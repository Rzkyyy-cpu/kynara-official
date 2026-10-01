import { z } from "zod";

// Bentuk data API Komerce Payment + aturan kecil yang murni (tanpa jaringan/database), supaya mudah dites.
// Referensi: https://rajaongkir.com/docs/payment-api/getting-started/available-endpoints

export const PAYMENT_STATUSES = ["PENDING", "PAID", "EXPIRED", "CANCELED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// Pilihan metode dari browser (checkout langkah 3 / ganti metode). Divalidasi ulang di server.
export const paymentChoiceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("va"), bank: z.string().regex(/^[A-Z0-9_]{2,20}$/, "Bank tidak dikenal.") }),
  z.object({ type: z.literal("qris") }),
]);
export type PaymentChoice = z.infer<typeof paymentChoiceSchema>;

// GET /api/v1/user/methods
export const methodsResponseSchema = z.object({
  data: z.array(
    z.object({
      payment_type: z.string(),
      display_name: z.string(),
      bank_code: z.string().optional().default(""),
      min_amount: z.number().optional(),
      max_amount: z.number().optional(),
    }),
  ),
});

// POST /api/v1/user/payment/create
export const createResponseSchema = z.object({
  data: z.object({
    payment_id: z.string().min(1).max(100),
    payment_url: z.string().url().optional(),
    va_number: z.string().max(40).optional(),
    qr_string: z.string().max(2000).optional(),
    amount: z.number().int(),
    status: z.enum(PAYMENT_STATUSES),
    expired_at: z.string(),
  }),
});

// GET /api/v1/user/payment/status/{payment_id}
export const statusResponseSchema = z.object({
  data: z.object({
    payment_id: z.string(),
    amount: z.number().int(),
    status: z.enum(PAYMENT_STATUSES),
    paid_at: z.string().optional().nullable(),
  }),
});

// Isi callback tidak didokumentasikan lengkap. Yang kita butuhkan hanya "pembayaran yang mana";
// statusnya selalu ditanyakan ulang ke API, bukan diambil dari callback.
export const callbackSchema = z.looseObject({
  payment_id: z.string().min(1).max(100).optional(),
  data: z.looseObject({ payment_id: z.string().min(1).max(100).optional() }).optional(),
});

export function callbackPaymentId(body: unknown): string | null {
  const parsed = callbackSchema.safeParse(body);
  if (!parsed.success) return null;
  return parsed.data.payment_id ?? parsed.data.data?.payment_id ?? null;
}

// Waktu dari Komerce kadang ISO ("2025-11-04T14:30:00Z"), kadang "2026-01-13 10:13:15" tanpa zona (dianggap WIB).
export function parseKomerceTime(value?: string | null): string | null {
  if (!value) return null;
  const v = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(" ", "T")}+07:00` : value;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// Kode bank -> nama tampilan: singkatan pendek tetap kapital (BCA, BNI, CIMB),
// lainnya jadi "Mandiri", "Permata", "Sahabat Sampoerna"
export function bankName(code: string) {
  if (code.length <= 4) return code;
  return code
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

// Nama metode untuk ditampilkan
export function paymentLabel(method: string, channel: string | null) {
  return method === "qris" ? "QRIS" : `${bankName(channel ?? "")} Virtual Account`.trim();
}

export const MIN_AMOUNT = 10_000; // minimal transaksi Komerce
export const VA_MIN_SECONDS = 3600; // masa berlaku VA minimal 1 jam
export const QRIS_MAX_AMOUNT = 10_000_000;

// Berapa lama VA berlaku: disamakan dengan sisa batas bayar pesanan, supaya VA mati bersamaan dengan pesanan.
// null = sisa waktu kurang dari 1 jam, VA tidak bisa dibuat (pakai QRIS).
export function vaExpirySeconds(orderExpiresAt: string, now = Date.now()): number | null {
  const seconds = Math.floor((new Date(orderExpiresAt).getTime() - now) / 1000);
  return seconds >= VA_MIN_SECONDS ? seconds : null;
}
