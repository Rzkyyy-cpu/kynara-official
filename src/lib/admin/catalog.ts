import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ProductFilters } from "@/lib/validation/admin-catalog";

// Query katalog untuk halaman admin. Koneksi bersesi: RLS memastikan hanya admin yang melihat
// produk/varian yang disembunyikan dan banner yang masih draf.

export const PRODUCTS_PER_PAGE = 20;

type Filterable<T> = {
  eq(column: string, value: string | boolean): T;
  gt(column: string, value: number): T;
  or(filters: string): T;
};

function applyProductFilters<T extends Filterable<T>>(query: T, f: ProductFilters, tab = f.tab): T {
  let q = query;
  if (tab === "tampil") q = q.eq("is_active", true);
  if (tab === "sembunyi") q = q.eq("is_active", false);
  if (tab === "menipis") q = q.gt("low_variant_count", 0);
  if (f.kategori) q = q.eq("category_id", f.kategori);
  if (f.bahan) q = q.eq("material", f.bahan);
  // q sudah divalidasi Zod (tanpa koma, kurung, kutip), aman disusun ke filter "or"
  if (f.q) q = q.or(`name.ilike."*${f.q}*",skus.ilike."*${f.q}*"`);
  return q;
}

export async function listAdminProducts(f: ProductFilters) {
  const supabase = await createClient();
  const from = (f.hal - 1) * PRODUCTS_PER_PAGE;
  const { data, error, count } = await applyProductFilters(
    supabase.from("admin_product_list").select("*", { count: "exact" }),
    f,
  )
    .order("created_at", { ascending: false })
    .range(from, from + PRODUCTS_PER_PAGE - 1);
  if (error) throw new Error(`Gagal memuat produk: ${error.message}`);
  return { rows: data, total: count ?? 0 };
}
export type AdminProductRow = Awaited<ReturnType<typeof listAdminProducts>>["rows"][number];

export async function countProductTabs(f: ProductFilters) {
  const supabase = await createClient();
  const tabs = ["semua", "tampil", "sembunyi", "menipis"] as const;
  const results = await Promise.all(
    tabs.map((tab) => applyProductFilters(supabase.from("admin_product_list").select("id", { count: "exact", head: true }), f, tab)),
  );
  return Object.fromEntries(tabs.map((t, i) => [t, results[i].count ?? 0])) as Record<(typeof tabs)[number], number>;
}

export async function getAdminProduct(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, name, slug, category_id, material, weight_gram, description, finishing, care, is_active, created_at, updated_at,
      variants:product_variants (id, color_name, color_hex, size_name, size_detail, sku, price, stock, is_active, sort_order),
      images:product_images (url, alt, sort_order)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Gagal memuat produk: ${error.message}`);
  if (!data) return null;
  return {
    ...data,
    variants: [...data.variants].sort((a, b) => a.sort_order - b.sort_order),
    images: [...data.images].sort((a, b) => a.sort_order - b.sort_order),
  };
}
export type AdminProduct = NonNullable<Awaited<ReturnType<typeof getAdminProduct>>>;

// Kategori + jumlah produk per kategori (untuk tabel kategori & pilihan di form)
export async function getAdminCategories() {
  const supabase = await createClient();
  const [{ data, error }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, description, image_url, sort_order, show_on_home").order("sort_order"),
    supabase.from("products").select("category_id"),
  ]);
  if (error) throw new Error(`Gagal memuat kategori: ${error.message}`);
  const counts = new Map<string, number>();
  for (const p of products ?? []) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  return data.map((c) => ({ ...c, product_count: counts.get(c.id) ?? 0 }));
}
export type AdminCategory = Awaited<ReturnType<typeof getAdminCategories>>[number];

// Bahan yang sudah dipakai (saran di form & filter)
export async function getMaterials() {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("material");
  return [...new Set((data ?? []).map((p) => p.material))].sort((a, b) => a.localeCompare(b, "id"));
}

export async function getAdminBanners() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("banners").select("*").order("sort_order").order("created_at");
  if (error) throw new Error(`Gagal memuat banner: ${error.message}`);
  return data;
}
export type AdminBanner = Awaited<ReturnType<typeof getAdminBanners>>[number];

// Pilihan tautan tombol banner: produk yang tampil di toko
export async function getProductLinks() {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("name, slug").eq("is_active", true).order("name");
  return data ?? [];
}
