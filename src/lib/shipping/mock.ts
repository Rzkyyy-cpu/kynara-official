import type { RateRequest, ShippingProvider, ShippingRate } from "@/lib/shipping/types";

// Provider TIRUAN (Fase 4). Tarif dibuat masuk akal tapi bukan tarif asli:
// dihitung dari berat (dibulatkan ke atas per kg, minimal 1 kg) dan zona provinsi tujuan.
// Diganti provider RajaOngkir di Fase 6.

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

// Tarif per kg untuk zona 1 / 2 / 3, beserta estimasi hari
const SERVICES = [
  { courier: "jne", service: "REG", label: "JNE Reguler", perKg: [12000, 22000, 38000], etd: [[2, 3], [3, 4], [4, 7]] },
  { courier: "jnt", service: "EZ", label: "J&T Express EZ", perKg: [13000, 23000, 39000], etd: [[2, 3], [3, 4], [4, 7]] },
  { courier: "sicepat", service: "REG", label: "SiCepat REG", perKg: [11000, 21000, 36000], etd: [[2, 4], [3, 5], [4, 8]] },
  { courier: "jne", service: "YES", label: "JNE YES", perKg: [25000, 40000, 65000], etd: [[1, 1], [1, 2], [2, 3]] },
] as const;

export const mockProvider: ShippingProvider = {
  name: "tiruan",
  async getRates({ destination, weightGram }: RateRequest): Promise<ShippingRate[]> {
    const zone = zoneOf(destination.province);
    const kg = billableKg(weightGram);

    const rates: ShippingRate[] = SERVICES.map((s) => {
      const [min, max] = s.etd[zone - 1];
      return {
        id: `${s.courier}:${s.service}`,
        courier: s.courier,
        service: s.service,
        label: s.label,
        cost: s.perKg[zone - 1] * kg,
        etd: { min, max },
        available: true,
      };
    });
    // Kurir instan (desain): belum tersedia untuk semua alamat
    rates.push({ id: "instan:INSTANT", courier: "instan", service: "INSTANT", label: "Kurir instan", cost: 0, etd: null, available: false });
    return rates;
  },
};
