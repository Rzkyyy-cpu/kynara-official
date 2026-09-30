// Logika keranjang yang murni (tanpa database/browser), supaya mudah dites.
// Semua uang dalam rupiah bilangan bulat.

export const MAX_QTY = 99; // sama dengan batas cart_items.quantity di database
export const MAX_CART_LINES = 30; // jenis barang maksimal dalam satu keranjang

// Isi keranjang yang disimpan: hanya id varian dan jumlah. Harga TIDAK pernah disimpan di sini.
export type CartLine = { variantId: string; quantity: number };

export type PricedLine = { price: number; quantity: number; weightGram: number };

export type Totals = {
  itemCount: number; // jumlah pcs
  subtotal: number;
  weightGram: number;
  shippingCost: number;
  total: number;
};

export function calcTotals(lines: PricedLine[], shippingCost = 0): Totals {
  if (!Number.isInteger(shippingCost) || shippingCost < 0) throw new Error("Ongkir tidak valid");
  let itemCount = 0;
  let subtotal = 0;
  let weightGram = 0;
  for (const l of lines) {
    if (!Number.isInteger(l.price) || l.price <= 0) throw new Error("Harga tidak valid");
    if (!Number.isInteger(l.quantity) || l.quantity <= 0) throw new Error("Jumlah tidak valid");
    itemCount += l.quantity;
    subtotal += l.price * l.quantity;
    weightGram += Math.max(0, l.weightGram) * l.quantity;
  }
  return { itemCount, subtotal, weightGram, shippingCost, total: subtotal + shippingCost };
}

// Jumlah yang boleh: minimal 0, maksimal stok dan MAX_QTY.
export function clampQuantity(quantity: number, stock: number): number {
  return Math.max(0, Math.min(Math.floor(quantity), stock, MAX_QTY));
}

// Gabungkan keranjang tamu (localStorage) dengan keranjang di database saat login.
// Varian yang sama dijumlahkan; hasilnya dibatasi MAX_QTY (stok dicek terpisah di server).
export function mergeCartLines(a: CartLine[], b: CartLine[]): CartLine[] {
  const map = new Map<string, number>();
  for (const l of [...a, ...b]) {
    if (l.quantity <= 0) continue;
    map.set(l.variantId, Math.min(MAX_QTY, (map.get(l.variantId) ?? 0) + l.quantity));
  }
  return [...map].slice(0, MAX_CART_LINES).map(([variantId, quantity]) => ({ variantId, quantity }));
}

export type StockIssue =
  | { variantId: string; kind: "unavailable" } // produk/varian dinonaktifkan atau stok 0
  | { variantId: string; kind: "reduced"; from: number; to: number }; // jumlah dikurangi mengikuti stok

// Bandingkan isi keranjang dengan stok terbaru. Mengembalikan jumlah yang disesuaikan dan daftar peringatan.
export function reconcileStock(
  lines: CartLine[],
  stockOf: (variantId: string) => { stock: number; available: boolean } | undefined,
): { lines: CartLine[]; issues: StockIssue[] } {
  const out: CartLine[] = [];
  const issues: StockIssue[] = [];
  for (const l of lines) {
    const info = stockOf(l.variantId);
    if (!info || !info.available || info.stock <= 0) {
      issues.push({ variantId: l.variantId, kind: "unavailable" });
      out.push(l); // tetap ditampilkan (dengan tanda habis) supaya pembeli tahu, tapi tidak ikut dihitung
      continue;
    }
    const q = clampQuantity(l.quantity, info.stock);
    if (q < l.quantity) issues.push({ variantId: l.variantId, kind: "reduced", from: l.quantity, to: q });
    out.push({ variantId: l.variantId, quantity: q });
  }
  return { lines: out, issues };
}
