import * as z from "zod/mini";
import { type CartLine, MAX_CART_LINES, MAX_QTY } from "@/lib/cart/totals";

// Keranjang tamu di localStorage = "catatan belanja di saku pembeli".
// Hanya berisi id varian + jumlah. Isinya bisa diubah siapa pun lewat DevTools,
// jadi setiap kali dibaca tetap divalidasi, dan harga/stok selalu dicek ulang ke server.

const KEY = "kynara-cart";

// File ini dimuat di SETIAP halaman toko (lewat CartProvider), jadi memakai "zod/mini": versi ringan
// dari paket zod yang sama. Zod lengkap (validation/cart.ts) menambah ±90 KB JavaScript ke browser.
// Aturannya harus sama dengan cartLinesSchema di validation/cart.ts (dijaga oleh storage.test.ts).
export const guestCartSchema = z.array(
  z.object({
    variantId: z.uuid(),
    quantity: z.int().check(z.minimum(0), z.maximum(MAX_QTY)),
  }),
).check(z.maxLength(MAX_CART_LINES));

export function readGuestCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = guestCartSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.filter((l) => l.quantity > 0) : [];
  } catch {
    return []; // mode privat / data rusak: anggap keranjang kosong
  }
}

export function writeGuestCart(lines: CartLine[]) {
  try {
    if (lines.length === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // penyimpanan penuh/diblokir: keranjang tetap jalan selama halaman terbuka
  }
}

export const GUEST_CART_KEY = KEY;
