import "server-only";

import type { CartLine } from "@/lib/cart/totals";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

// Query keranjang. Harga & stok SELALU diambil dari database saat dibutuhkan,
// jadi angka lama yang tersimpan di browser tidak pernah dipakai.

export type CartItemView = {
  variantId: string;
  productName: string;
  productSlug: string;
  colorName: string;
  colorHex: string;
  sizeName: string;
  sizeDetail: string | null;
  price: number;
  stock: number;
  weightGram: number;
  imageUrl: string | null;
};

// Detail varian untuk ditampilkan di keranjang/checkout.
// Varian yang nonaktif (atau produknya nonaktif) tidak ikut terbaca karena RLS, jadi dianggap "tidak tersedia".
export async function getVariantDetails(variantIds: string[]): Promise<Map<string, CartItemView>> {
  const out = new Map<string, CartItemView>();
  if (variantIds.length === 0) return out;

  const { data, error } = await createPublicClient()
    .from("product_variants")
    .select(
      `id, color_name, color_hex, size_name, size_detail, price, stock,
       product:products (name, slug, weight_gram, images:product_images (url, sort_order))`,
    )
    .in("id", variantIds);
  if (error) throw new Error(`Gagal memuat keranjang: ${error.message}`);

  for (const v of data) {
    const firstImage = [...v.product.images].sort((a, b) => a.sort_order - b.sort_order)[0];
    out.set(v.id, {
      variantId: v.id,
      productName: v.product.name,
      productSlug: v.product.slug,
      colorName: v.color_name,
      colorHex: v.color_hex,
      sizeName: v.size_name,
      sizeDetail: v.size_detail,
      price: v.price,
      stock: v.stock,
      weightGram: v.product.weight_gram,
      imageUrl: firstImage?.url ?? null,
    });
  }
  return out;
}

// Isi keranjang user yang login (RLS: hanya keranjang miliknya yang terbaca).
export async function getUserCartLines(userId: string): Promise<CartLine[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select("variant_id, quantity, cart:carts!inner (user_id)")
    .eq("cart.user_id", userId)
    .order("created_at");
  if (error) throw new Error(`Gagal memuat keranjang: ${error.message}`);
  return data.map((r) => ({ variantId: r.variant_id, quantity: r.quantity }));
}

// Id keranjang user; dibuat kalau belum ada (satu keranjang per user).
export async function ensureCartId(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("carts")
    .upsert({ user_id: userId }, { onConflict: "user_id" })
    .select("id")
    .single();
  if (error) throw new Error(`Gagal menyiapkan keranjang: ${error.message}`);
  return data.id;
}
