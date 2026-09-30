import "server-only";

import type { ProductCardData } from "@/components/ui/ProductCard";
import { toCardData } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

// Query halaman Akun. Semuanya memakai koneksi BERSESI (createClient dari server.ts),
// jadi RLS otomatis membatasi hanya data milik user yang login, tanpa perlu filter user_id manual.
// (Filter user_id tetap ditambahkan supaya maksud query jelas dan index terpakai.)

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Address = Database["public"]["Tables"]["addresses"]["Row"];

export const MAX_ADDRESSES = 10;

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data;
}

export async function getAddresses(userId: string): Promise<Address[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at");
  if (error) throw new Error(`Gagal memuat alamat: ${error.message}`);
  return data;
}

export async function getWishlistProducts(userId: string): Promise<ProductCardData[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("wishlists")
    .select("product_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Gagal memuat wishlist: ${error.message}`);
  if (rows.length === 0) return [];

  const { data: cards, error: cardError } = await supabase
    .from("product_cards")
    .select("id, slug, name, material, min_price, colors, is_new, is_low_stock, image_url")
    .in(
      "id",
      rows.map((r) => r.product_id),
    );
  if (cardError) throw new Error(`Gagal memuat wishlist: ${cardError.message}`);

  // Urutkan sesuai waktu disimpan (terbaru dulu). Produk yang sudah nonaktif otomatis tidak muncul.
  const byId = new Map(cards.map((c) => [c.id, c]));
  return rows.flatMap((r) => {
    const card = byId.get(r.product_id);
    return card ? [toCardData(card)] : [];
  });
}
