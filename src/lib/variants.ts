// Logika pilihan varian di halaman Detail Produk. Dipisah dari komponen supaya mudah dites.

export type VariantOption = {
  id: string;
  color_name: string;
  color_hex: string;
  size_name: string;
  size_detail: string | null;
  price: number;
  stock: number;
};

export type ColorOption = { name: string; hex: string; soldOut: boolean };

// Daftar warna unik (urut sesuai varian). Warna "habis" kalau semua ukurannya stok 0.
export function colorOptions(variants: VariantOption[]): ColorOption[] {
  const map = new Map<string, ColorOption>();
  for (const v of variants) {
    const c = map.get(v.color_name) ?? { name: v.color_name, hex: v.color_hex, soldOut: true };
    if (v.stock > 0) c.soldOut = false;
    map.set(v.color_name, c);
  }
  return [...map.values()];
}

// Daftar ukuran unik (urut sesuai varian)
export function sizeNames(variants: VariantOption[]): string[] {
  return [...new Set(variants.map((v) => v.size_name))];
}

export function findVariant(variants: VariantOption[], color: string, size: string) {
  return variants.find((v) => v.color_name === color && v.size_name === size);
}

// Pilihan awal: varian pertama yang masih ada stoknya (kalau semua habis, varian pertama)
export function initialVariant(variants: VariantOption[]): VariantOption | undefined {
  return variants.find((v) => v.stock > 0) ?? variants[0];
}

// Saat ganti warna: pertahankan ukuran yang sama kalau masih ada stok, kalau tidak pilih ukuran lain yang tersedia
export function variantForColor(variants: VariantOption[], color: string, currentSize: string) {
  const same = findVariant(variants, color, currentSize);
  if (same && same.stock > 0) return same;
  const forColor = variants.filter((v) => v.color_name === color);
  return forColor.find((v) => v.stock > 0) ?? same ?? forColor[0];
}

export type StockStatus = { text: string; tone: "ok" | "low" | "out" };

// Teks stok sesuai prototipe detail produk
export function stockStatus(stock: number): StockStatus {
  if (stock <= 0) return { text: "Habis untuk varian ini", tone: "out" };
  if (stock <= 5) return { text: `Sisa ${stock} pcs, segera habis`, tone: "low" };
  return { text: `Stok tersedia · ${stock} pcs`, tone: "ok" };
}
