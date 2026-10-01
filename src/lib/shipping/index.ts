import "server-only";

import { flatProvider } from "@/lib/shipping/flat";
import { rajaongkirProvider } from "@/lib/shipping/rajaongkir";
import { type RateQuote, type RateRequest, ShippingError, type ShippingProvider, type ShippingRate } from "@/lib/shipping/types";

export type { RateQuote, RateRequest, ShippingDestination, ShippingRate } from "@/lib/shipping/types";
export { ShippingError } from "@/lib/shipping/types";

// Satu-satunya pintu ongkir yang dipakai halaman & server action.
// Mengganti provider cukup di dua baris ini.
const provider: ShippingProvider = rajaongkirProvider;
const fallback: ShippingProvider = flatProvider;

// Plastik + kardus/polymailer. Ditambahkan ke berat isi supaya ongkir tidak kurang bayar.
export const PACKAGING_GRAM = 100;

export function parcelWeight(itemsWeightGram: number) {
  return itemsWeightGram + PACKAGING_GRAM;
}

// Batas umum kurir reguler per paket. Di atas ini tarif (asli maupun flat) tidak bisa dipercaya,
// jadi pembeli diminta memecah pesanan.
export const MAX_PARCEL_GRAM = 30_000;
export const TOO_HEAVY = `Berat paket lebih dari ${MAX_PARCEL_GRAM / 1000} kg. Pecah menjadi beberapa pesanan, ya.`;

// Provider utama gagal (gangguan, kuota habis, wilayah tidak dikenal) atau tidak ada kurir
// yang melayani -> tarif flat, supaya pembeli tetap bisa checkout.
export async function getRates(request: RateRequest): Promise<RateQuote> {
  if (request.weightGram > MAX_PARCEL_GRAM) throw new ShippingError(TOO_HEAVY);
  try {
    const rates = await provider.getRates(request);
    if (rates.length > 0) return { rates, isFallback: false };
    console.warn(`ongkir ${provider.name}: tidak ada layanan untuk ${request.destination.district}, pakai tarif flat`);
  } catch (e) {
    console.error(`ongkir ${provider.name} gagal, pakai tarif flat:`, e instanceof Error ? e.message : e);
  }
  return { rates: await fallback.getRates(request), isFallback: true };
}

// Cocokkan pilihan dari browser dengan daftar tarif hasil hitung ulang di server.
// Yang dipakai adalah angka dari server; dari browser hanya diambil id pilihannya.
export function findRate(rates: ShippingRate[], rateId: string): ShippingRate | null {
  return rates.find((r) => r.id === rateId && r.available) ?? null;
}
