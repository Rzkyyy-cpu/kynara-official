import "server-only";

import { mockProvider } from "@/lib/shipping/mock";
import type { RateRequest, ShippingProvider, ShippingRate } from "@/lib/shipping/types";

export type { RateRequest, ShippingDestination, ShippingRate } from "@/lib/shipping/types";
export { ShippingError } from "@/lib/shipping/types";

// Satu-satunya pintu ongkir yang dipakai halaman & server action.
// Mengganti provider (Fase 6) cukup di baris ini.
const provider: ShippingProvider = mockProvider;

export async function getRates(request: RateRequest): Promise<ShippingRate[]> {
  return provider.getRates(request);
}

// Cocokkan pilihan dari browser dengan daftar tarif hasil hitung ulang di server.
// Yang dipakai adalah angka dari server; dari browser hanya diambil id pilihannya.
export function findRate(rates: ShippingRate[], rateId: string): ShippingRate | null {
  return rates.find((r) => r.id === rateId && r.available) ?? null;
}
