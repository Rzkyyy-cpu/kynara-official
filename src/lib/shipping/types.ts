// Kontrak (interface) modul ongkir. Analogi: colokan listrik standar.
// Halaman checkout hanya tahu bentuk colokannya (getRates -> daftar ShippingRate),
// jadi "alat" di baliknya (tarif tiruan sekarang, RajaOngkir di Fase 6) bisa diganti
// tanpa mengubah halaman checkout sedikit pun.

export type ShippingDestination = {
  province: string;
  city: string;
  district: string;
  postalCode: string;
  // ID tujuan RajaOngkir (diisi Fase 6). Provider tiruan tidak memakainya.
  rajaongkirDestinationId?: string | null;
};

export type RateRequest = {
  destination: ShippingDestination;
  weightGram: number; // berat total paket
};

export type ShippingRate = {
  id: string; // kunci unik pilihan, contoh "jne:REG". Dipakai browser untuk memilih, lalu dicocokkan ulang di server.
  courier: string; // kode kurir, contoh "jne"
  service: string; // kode layanan, contoh "REG"
  label: string; // nama tampil, contoh "JNE Reguler"
  cost: number; // rupiah, bilangan bulat
  etd: { min: number; max: number } | null; // estimasi tiba (hari)
  available: boolean; // false = tampil abu-abu "Tidak tersedia untuk alamat ini"
};

export interface ShippingProvider {
  name: string;
  getRates(request: RateRequest): Promise<ShippingRate[]>;
}

// Error yang pesannya aman ditampilkan ke pembeli (mis. API ongkir sedang gangguan).
export class ShippingError extends Error {}

// "Estimasi 2–3 hari" / "Estimasi 1 hari"
export function etdText(rate: Pick<ShippingRate, "etd">): string {
  if (!rate.etd) return "Tidak tersedia untuk alamat ini";
  const { min, max } = rate.etd;
  return `Estimasi ${min === max ? min : `${min}–${max}`} hari`;
}
