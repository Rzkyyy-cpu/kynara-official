import "server-only";

import {
  type PaymentChoice,
  createResponseSchema,
  methodsResponseSchema,
  statusResponseSchema,
} from "@/lib/komerce-payment/status";

// Pemanggil Komerce Payment API memakai fetch biasa, tanpa library tambahan.
// API Key hanya dibaca di sini, dan "server-only" menjamin file ini tidak ikut ke browser.

const baseUrl = () =>
  process.env.KOMERCE_IS_PRODUCTION === "true"
    ? "https://api.collaborator.komerce.id/user"
    : "https://api-sandbox.collaborator.komerce.id/user";

export class KomercePaymentError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export const callbackKey = () => process.env.KOMERCE_CALLBACK_KEY || undefined;

async function call(path: string, init: RequestInit & { next?: { revalidate: number } } = {}) {
  const key = process.env.KOMERCE_PAYMENT_API_KEY;
  if (!key) throw new KomercePaymentError("KOMERCE_PAYMENT_API_KEY belum diisi di .env.local");
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: { "x-api-key": key, "Content-Type": "application/json", Accept: "application/json", ...init.headers },
    signal: AbortSignal.timeout(15_000),
  });
  const body: unknown = await res.json().catch(() => null);
  return { res, body };
}

function errorMessage(body: unknown, status: number) {
  const meta = (body as { meta?: { message?: unknown } } | null)?.meta;
  return typeof meta?.message === "string" ? meta.message : `HTTP ${status}`;
}

export type PaymentMethodOption = { type: "va" | "qris"; code: string; name: string; min: number; max: number };

// Cadangan kalau daftar metode gagal diambil (kode bank mengikuti contoh dokumentasi)
const FALLBACK_METHODS: PaymentMethodOption[] = [
  { type: "va", code: "BCA", name: "Bank Central Asia", min: 10_000, max: 999_999_999 },
  { type: "va", code: "BNI", name: "Bank Negara Indonesia", min: 10_000, max: 999_999_999 },
  { type: "va", code: "BRI", name: "Bank Rakyat Indonesia", min: 10_000, max: 999_999_999 },
  { type: "va", code: "MANDIRI", name: "Bank Mandiri", min: 10_000, max: 999_999_999 },
  { type: "qris", code: "QRIS", name: "QRIS", min: 10_000, max: 10_000_000 },
];

// Daftar metode yang aktif di akun Komerce. Disimpan (cache) 1 jam oleh Next.js supaya checkout tetap cepat.
export async function getPaymentMethods(): Promise<PaymentMethodOption[]> {
  try {
    const { res, body } = await call("/api/v1/user/methods", { next: { revalidate: 3600 } });
    const parsed = methodsResponseSchema.safeParse(body);
    if (!res.ok || !parsed.success) throw new KomercePaymentError(errorMessage(body, res.status), res.status);
    const list = parsed.data.data.flatMap((m): PaymentMethodOption[] => {
      const type = m.payment_type === "qris" ? "qris" : m.payment_type === "va" ? "va" : null;
      if (!type || (type === "va" && !m.bank_code)) return [];
      return [{ type, code: type === "qris" ? "QRIS" : m.bank_code, name: m.display_name, min: m.min_amount ?? 10_000, max: m.max_amount ?? Infinity }];
    });
    return list.length ? list : FALLBACK_METHODS;
  } catch (e) {
    console.error("komerce methods:", e instanceof Error ? e.message : e);
    return FALLBACK_METHODS;
  }
}

export type CreatePaymentInput = {
  reference: string; // order_id di Komerce (unik per percobaan bayar)
  choice: PaymentChoice;
  amount: number;
  customer: { name: string; email: string; phone: string };
  items: { name: string; quantity: number; price: number }[];
  expirySeconds?: number; // hanya VA (QRIS selalu 5 menit)
  callbackUrl: string;
};

export async function createPayment(input: CreatePaymentInput) {
  const key = callbackKey();
  if (!key) throw new KomercePaymentError("KOMERCE_CALLBACK_KEY belum diisi di .env.local");
  const { res, body } = await call("/api/v1/user/payment/create", {
    method: "POST",
    body: JSON.stringify({
      order_id: input.reference,
      payment_type: input.choice.type === "va" ? "bank_transfer" : "qris",
      ...(input.choice.type === "va" ? { channel_code: input.choice.bank, expiry_duration: input.expirySeconds } : {}),
      amount: input.amount,
      customer: input.customer,
      items: input.items,
      callback_url: input.callbackUrl,
      // Dokumentasi menulis nama field ini dengan dua ejaan berbeda, jadi keduanya dikirim
      callback_API_KEY: key,
      callback_api_key: key,
    }),
    cache: "no-store",
  });
  const parsed = createResponseSchema.safeParse(body);
  if (!res.ok || !parsed.success) throw new KomercePaymentError(`create: ${errorMessage(body, res.status)}`, res.status);
  return parsed.data.data;
}

// Status langsung dari Komerce (sumber kebenaran). null = pembayaran tidak ditemukan.
// Batas Komerce: 1 kali per 3 detik per pembayaran -> kena batas dilempar sebagai error status 429.
export async function getPaymentStatus(paymentId: string) {
  const { res, body } = await call(`/api/v1/user/payment/status/${encodeURIComponent(paymentId)}`, { cache: "no-store" });
  if (res.status === 404) return null;
  const parsed = statusResponseSchema.safeParse(body);
  if (!res.ok || !parsed.success) throw new KomercePaymentError(`status: ${errorMessage(body, res.status)}`, res.status);
  return parsed.data.data;
}

// Menonaktifkan VA yang belum dibayar (dipakai saat pembeli ganti metode)
export async function cancelPayment(paymentId: string, reason: string) {
  const { res, body } = await call("/api/v1/user/payment/cancel", {
    method: "POST",
    body: JSON.stringify({ payment_id: paymentId, reason }),
    cache: "no-store",
  });
  if (!res.ok) throw new KomercePaymentError(`cancel: ${errorMessage(body, res.status)}`, res.status);
}
