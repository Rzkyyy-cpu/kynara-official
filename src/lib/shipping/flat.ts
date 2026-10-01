import type { RateRequest, ShippingProvider, ShippingRate } from "@/lib/shipping/types";

// Tarif FLAT cadangan: dipakai hanya kalau RajaOngkir gangguan atau kuota hariannya habis,
// supaya pembeli tetap bisa checkout. Tarif per kg ditentukan zona provinsi tujuan, dengan batas atas.

// Nama provinsi mengikuti data wilayah Kepmendagri (src/data/wilayah.json)
const JAWA = ["Daerah Khusus Ibukota Jakarta", "Jawa Barat", "Jawa Tengah", "Daerah Istimewa Yogyakarta", "Jawa Timur", "Banten"];
const DEKAT = ["Bali", "Lampung", "Sumatera Selatan", "Bengkulu", "Jambi", "Kepulauan Bangka Belitung"];

export function zoneOf(province: string): 1 | 2 | 3 {
  const p = province.toLowerCase();
  if (JAWA.some((x) => x.toLowerCase() === p)) return 1;
  if (DEKAT.some((x) => x.toLowerCase() === p)) return 2;
  return 3;
}

export function billableKg(weightGram: number) {
  return Math.max(1, Math.ceil(weightGram / 1000));
}

// Zona 1 (Jawa), 2 (Bali & Sumatera bagian selatan), 3 (lainnya: tarif tetap)
const ZONES = {
  1: { perKg: 5_000, max: 10_000, etd: { min: 2, max: 4 } },
  2: { perKg: 10_000, max: 20_000, etd: { min: 3, max: 5 } },
  3: { perKg: 40_000, max: 40_000, etd: { min: 4, max: 8 } },
} as const;

export function flatCost(province: string, weightGram: number) {
  const z = ZONES[zoneOf(province)];
  return Math.min(z.perKg * billableKg(weightGram), z.max);
}

export const flatProvider: ShippingProvider = {
  name: "flat",
  async getRates({ destination, weightGram }: RateRequest): Promise<ShippingRate[]> {
    const z = ZONES[zoneOf(destination.province)];
    return [
      {
        id: "flat:REG",
        courier: "flat",
        service: "REG",
        label: "Pengiriman Reguler (tarif flat)",
        cost: flatCost(destination.province, weightGram),
        etd: { ...z.etd },
        available: true,
      },
    ];
  },
};
