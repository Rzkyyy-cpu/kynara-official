// Tipe & fungsi URL filter Koleksi. Sengaja TANPA Zod, karena file ini juga dipakai komponen
// di browser (panel filter). Validasi input dari URL ada di catalog-filters.ts (hanya di server).

export const PAGE_SIZE = 12; // habis dibagi 2 (HP), 3 (desktop + sidebar), dan 4

export const SORTS = {
  terbaru: "Terbaru",
  terlaris: "Terlaris",
  termurah: "Harga terendah",
  termahal: "Harga tertinggi",
} as const;
export type Sort = keyof typeof SORTS;

export const PRICE_RANGES = {
  a: { label: "Di bawah Rp90.000", short: "< Rp90rb", min: 0, max: 89_999 },
  b: { label: "Rp90.000 – Rp150.000", short: "Rp90–150rb", min: 90_000, max: 150_000 },
  c: { label: "Di atas Rp150.000", short: "> Rp150rb", min: 150_001, max: null },
} as const;
export type PriceRange = keyof typeof PRICE_RANGES;

export type CatalogFilters = {
  kategori?: string;
  bahan: string[];
  warna: string[];
  harga?: PriceRange;
  min?: number;
  maks?: number;
  urut: Sort;
  q?: string;
  halaman: number;
};

export const EMPTY_FILTERS: CatalogFilters = { bahan: [], warna: [], urut: "terbaru", halaman: 1 };

// Filter -> URL. Nilai default tidak ditulis supaya URL tetap pendek.
export function buildCatalogUrl(filters: CatalogFilters, changes: Partial<CatalogFilters> = {}): string {
  const f = { ...filters, ...changes };
  const p = new URLSearchParams();
  if (f.kategori) p.set("kategori", f.kategori);
  if (f.q) p.set("q", f.q);
  if (f.bahan.length) p.set("bahan", f.bahan.join(","));
  if (f.warna.length) p.set("warna", f.warna.join(","));
  if (f.harga) p.set("harga", f.harga);
  if (f.min !== undefined) p.set("min", String(f.min));
  if (f.maks !== undefined) p.set("maks", String(f.maks));
  if (f.urut !== "terbaru") p.set("urut", f.urut);
  if (f.halaman > 1) p.set("halaman", String(f.halaman));
  const qs = p.toString();
  return qs ? `/koleksi?${qs}` : "/koleksi";
}

// Rentang harga yang berlaku: isian min/maks manual mengalahkan pilihan cepat (harga=a/b/c)
export function priceBounds(f: CatalogFilters): { min?: number; max?: number } {
  if (f.min !== undefined || f.maks !== undefined) return { min: f.min, max: f.maks };
  if (f.harga) {
    const r = PRICE_RANGES[f.harga];
    return { min: r.min, max: r.max ?? undefined };
  }
  return {};
}

export function countActiveFilters(f: CatalogFilters): number {
  const priceActive = f.harga !== undefined || f.min !== undefined || f.maks !== undefined;
  return f.bahan.length + f.warna.length + (priceActive ? 1 : 0);
}

// Tambah/hapus satu nilai dari daftar (dipakai checkbox bahan & warna)
export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
