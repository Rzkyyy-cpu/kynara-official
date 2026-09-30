"use server";

import { z } from "zod";
import { type CartItemView, ensureCartId, getUserCartLines, getVariantDetails } from "@/lib/cart/server";
import {
  type CartLine,
  MAX_CART_LINES,
  type StockIssue,
  clampQuantity,
  mergeCartLines,
  reconcileStock,
} from "@/lib/cart/totals";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cartLineSchema, cartLinesSchema } from "@/lib/validation/cart";

// Aksi keranjang. Tamu menyimpan keranjang di browser (localStorage), jadi untuk tamu server
// hanya dipakai untuk MEMBACA harga & stok terbaru (loadCart). User login menyimpan keranjang di database.

export type LoadedCart = {
  lines: CartLine[]; // jumlah yang sudah disesuaikan dengan stok
  items: Record<string, CartItemView>; // detail per variantId (yang tidak tersedia tidak ada di sini)
  issues: StockIssue[];
};

export async function loadCart(input: CartLine[]): Promise<LoadedCart | null> {
  const parsed = cartLinesSchema.safeParse(input);
  if (!parsed.success) return null;

  const details = await getVariantDetails(parsed.data.map((l) => l.variantId));
  const { lines, issues } = reconcileStock(parsed.data, (id) => {
    const d = details.get(id);
    return d ? { stock: d.stock, available: true } : undefined;
  });
  return { lines, items: Object.fromEntries(details), issues };
}

// ---------- User login ----------

export async function getMyCart(): Promise<CartLine[] | null> {
  const user = await getUser();
  if (!user) return null;
  return getUserCartLines(user.id);
}

// Ubah jumlah satu varian (0 = hapus). Jumlah dibatasi stok terbaru di server.
export async function setCartQuantity(variantId: string, quantity: number): Promise<{ ok: boolean; quantity: number }> {
  const user = await getUser();
  const parsed = cartLineSchema.safeParse({ variantId, quantity });
  if (!user || !parsed.success) return { ok: false, quantity: 0 };

  const supabase = await createClient();
  const cartId = await ensureCartId(user.id);
  const stock = (await getVariantDetails([parsed.data.variantId])).get(parsed.data.variantId)?.stock ?? 0;
  const q = clampQuantity(parsed.data.quantity, stock);

  if (q === 0) {
    const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId).eq("variant_id", parsed.data.variantId);
    return { ok: !error, quantity: 0 };
  }

  // Varian baru: cek batas jenis barang
  const { count } = await supabase.from("cart_items").select("variant_id", { count: "exact", head: true }).eq("cart_id", cartId);
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id")
    .eq("cart_id", cartId)
    .eq("variant_id", parsed.data.variantId)
    .maybeSingle();
  if (!existing && (count ?? 0) >= MAX_CART_LINES) return { ok: false, quantity: 0 };

  const { error } = await supabase
    .from("cart_items")
    .upsert({ cart_id: cartId, variant_id: parsed.data.variantId, quantity: q }, { onConflict: "cart_id,variant_id" });
  if (error) console.error("set cart quantity:", error.message);
  return { ok: !error, quantity: q };
}

// Dipanggil sekali setelah tamu login: keranjang di browser digabung ke keranjang di database.
export async function mergeGuestCart(guestLines: CartLine[]): Promise<CartLine[] | null> {
  const user = await getUser();
  const parsed = cartLinesSchema.safeParse(guestLines);
  if (!user || !parsed.success) return null;

  const dbLines = await getUserCartLines(user.id);
  if (parsed.data.length === 0) return dbLines;

  const merged = mergeCartLines(dbLines, parsed.data);
  const details = await getVariantDetails(merged.map((l) => l.variantId));
  const rows = merged
    .map((l) => ({ variantId: l.variantId, quantity: clampQuantity(l.quantity, details.get(l.variantId)?.stock ?? 0) }))
    .filter((l) => l.quantity > 0);

  const cartId = await ensureCartId(user.id);
  const supabase = await createClient();
  if (rows.length) {
    const { error } = await supabase.from("cart_items").upsert(
      rows.map((l) => ({ cart_id: cartId, variant_id: l.variantId, quantity: l.quantity })),
      { onConflict: "cart_id,variant_id" },
    );
    if (error) {
      console.error("merge cart:", error.message);
      return null;
    }
  }
  return getUserCartLines(user.id);
}

// Dipakai tombol "Tambah ke Keranjang" untuk user login: jumlah baru = jumlah lama + tambahan.
const addSchema = z.object({ variantId: z.uuid(), add: z.int().min(1).max(99) });

export async function addToCart(variantId: string, add: number): Promise<{ ok: boolean; quantity: number }> {
  const user = await getUser();
  const parsed = addSchema.safeParse({ variantId, add });
  if (!user || !parsed.success) return { ok: false, quantity: 0 };

  const lines = await getUserCartLines(user.id);
  const current = lines.find((l) => l.variantId === parsed.data.variantId)?.quantity ?? 0;
  return setCartQuantity(parsed.data.variantId, Math.min(99, current + parsed.data.add));
}
