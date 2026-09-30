import type { CartLine } from "@/lib/cart/totals";
import { cartLinesSchema } from "@/lib/validation/cart";

// Keranjang tamu di localStorage = "catatan belanja di saku pembeli".
// Hanya berisi id varian + jumlah. Isinya bisa diubah siapa pun lewat DevTools,
// jadi setiap kali dibaca tetap divalidasi, dan harga/stok selalu dicek ulang ke server.

const KEY = "kynara-cart";

export function readGuestCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = cartLinesSchema.safeParse(JSON.parse(raw));
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
