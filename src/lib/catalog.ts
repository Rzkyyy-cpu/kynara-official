import "server-only";

import type { ProductCardData } from "@/components/ui/ProductCard";
import { type CatalogFilters, PAGE_SIZE, priceBounds } from "@/lib/catalog-url";
import { createPublicClient } from "@/lib/supabase/public";
import type { Database } from "@/types/database";

// Semua query katalog dikumpulkan di sini, supaya halaman tidak menulis query sendiri-sendiri.
// "server-only" = file ini akan error kalau tidak sengaja di-import dari komponen browser.

type CardRow = Database["public"]["Views"]["product_cards"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Color = { name: string; hex: string };

const CARD_COLUMNS = "id, slug, name, material, min_price, colors, is_new, is_low_stock, image_url";

// Baris view -> data untuk komponen ProductCard
export function toCardData(row: Pick<CardRow, "id" | "slug" | "name" | "material" | "min_price" | "colors" | "is_new" | "is_low_stock" | "image_url">): ProductCardData {
  const colors = (row.colors as Color[] | null) ?? [];
  return {
    id: row.id ?? "",
    href: `/produk/${row.slug}`,
    name: row.name ?? "",
    price: row.min_price ?? 0,
    material: row.material ?? "",
    tag: row.is_low_stock ? "Stok terbatas" : row.is_new ? "Baru" : undefined,
    colors,
    imageUrl: row.image_url ?? undefined,
    tone: colors[0]?.hex, // selama belum ada foto, latar kartu memakai warna varian pertama
  };
}

function fail(what: string, error: { message: string }): never {
  throw new Error(`Gagal memuat ${what}: ${error.message}`);
}

// ---------- Kategori ----------

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await createPublicClient()
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) fail("kategori", error);
  return data;
}

// ---------- Beranda ----------

// Banner hero = banner tayang paling atas yang tanggalnya sedang berlaku (WIB). RLS hanya
// memberi pengunjung banner yang sudah ditayangkan; filter tanggal dilakukan di sini.
export async function getHeroBanner() {
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta" }).format(new Date());
  const { data, error } = await createPublicClient()
    .from("banners")
    .select("title, subtitle, cta_text, cta_href, image_desktop_url, image_mobile_url")
    .eq("is_published", true)
    .lte("starts_at", today)
    .or(`ends_at.is.null,ends_at.gte.${today}`)
    .order("sort_order")
    .limit(1)
    .maybeSingle();
  if (error) fail("banner", error);
  return data;
}

export async function getLatestProducts(limit = 8): Promise<ProductCardData[]> {
  const { data, error } = await createPublicClient()
    .from("product_cards")
    .select(CARD_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail("produk terbaru", error);
  return data.map(toCardData);
}

// ---------- Koleksi ----------

export async function getFilterOptions(): Promise<{ materials: string[]; colors: Color[] }> {
  const { data, error } = await createPublicClient().from("product_cards").select("material, colors");
  if (error) fail("pilihan filter", error);

  const materials = new Set<string>();
  const colors = new Map<string, Color>();
  for (const row of data) {
    if (row.material) materials.add(row.material);
    for (const c of (row.colors as Color[] | null) ?? []) colors.set(c.name, c);
  }
  return {
    materials: [...materials].sort((a, b) => a.localeCompare(b, "id")),
    colors: [...colors.values()],
  };
}

export async function getProducts(
  f: CatalogFilters,
): Promise<{ items: ProductCardData[]; total: number; totalPages: number }> {
  let query = createPublicClient().from("product_cards").select(CARD_COLUMNS, { count: "exact" });

  if (f.kategori) query = query.eq("category_slug", f.kategori);
  if (f.bahan.length) query = query.in("material", f.bahan);
  if (f.warna.length) query = query.overlaps("color_names", f.warna); // punya minimal satu warna yang dipilih
  if (f.q) query = query.ilike("name", `%${f.q}%`);

  const { min, max } = priceBounds(f);
  if (min !== undefined) query = query.gte("min_price", min);
  if (max !== undefined) query = query.lte("min_price", max);

  switch (f.urut) {
    case "terlaris":
      query = query.order("sold_count", { ascending: false });
      break;
    case "termurah":
      query = query.order("min_price", { ascending: true });
      break;
    case "termahal":
      query = query.order("min_price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }
  query = query.order("name"); // urutan cadangan supaya hasil stabil antar halaman

  const from = (f.halaman - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);

  // Halaman di luar jangkauan (mis. ?halaman=99) dikembalikan sebagai hasil kosong, bukan error
  if (error?.code === "PGRST103") return { items: [], total: count ?? 0, totalPages: 0 };
  if (error) fail("produk", error);

  const total = count ?? 0;
  return { items: data.map(toCardData), total, totalPages: Math.ceil(total / PAGE_SIZE) };
}

// ---------- Detail produk ----------

export async function getProductBySlug(slug: string) {
  const { data, error } = await createPublicClient()
    .from("products")
    .select(
      `id, slug, name, description, material, finishing, care, category_id, created_at,
       category:categories (name, slug),
       variants:product_variants (id, color_name, color_hex, size_name, size_detail, price, stock, sort_order),
       images:product_images (url, alt, color_name, sort_order)`,
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) fail("detail produk", error);
  if (!data) return null;

  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  return {
    ...data,
    isNew: Date.now() - new Date(data.created_at).getTime() < THIRTY_DAYS, // sama dengan aturan label "Baru" di view
    variants: [...data.variants].sort((a, b) => a.sort_order - b.sort_order),
    images: [...data.images].sort((a, b) => a.sort_order - b.sort_order),
  };
}
export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;
export type ProductVariant = ProductDetail["variants"][number];

export async function getReviewSummary(productId: string) {
  const { data, error } = await createPublicClient()
    .from("reviews")
    .select("rating")
    .eq("product_id", productId);
  if (error) fail("ulasan", error);

  const count = data.length;
  const average = count ? data.reduce((s, r) => s + r.rating, 0) / count : 0;
  // Persentase per bintang untuk grafik batang 5★ … 1★
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    percent: count ? Math.round((data.filter((r) => r.rating === star).length / count) * 100) : 0,
  }));
  return { count, average, distribution };
}

// Testimoni beranda: ulasan asli dari pembeli (rating 4–5 dan ada teksnya), terbaru dulu.
// reviewer_name sudah disingkat oleh database ("Nadia A."), jadi aman ditampilkan publik.
export async function getTestimonials(limit = 4) {
  const { data, error } = await createPublicClient()
    .from("reviews")
    .select("id, rating, body, reviewer_name, products!inner(name, slug)")
    .gte("rating", 4)
    .neq("body", "")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail("testimoni", error);

  return data.map((r) => ({
    id: r.id,
    rating: r.rating,
    text: r.body,
    name: r.reviewer_name,
    product: r.products.name,
    href: `/produk/${r.products.slug}`,
  }));
}
export type Testimonial = Awaited<ReturnType<typeof getTestimonials>>[number];

// "Cocok dipadukan dengan": produk lain di kategori yang sama, ditambah produk terlaris bila kurang
export async function getRelatedProducts(productId: string, categoryId: string, limit = 4) {
  const supabase = createPublicClient();
  const { data: sameCategory, error } = await supabase
    .from("product_cards")
    .select(CARD_COLUMNS)
    .eq("category_id", categoryId)
    .neq("id", productId)
    .order("sold_count", { ascending: false })
    .limit(limit);
  if (error) fail("produk terkait", error);

  let rows = sameCategory;
  if (rows.length < limit) {
    const exclude = [productId, ...rows.map((r) => r.id)].filter((id): id is string => !!id);
    const { data: more, error: moreError } = await supabase
      .from("product_cards")
      .select(CARD_COLUMNS)
      .not("id", "in", `(${exclude.join(",")})`)
      .order("sold_count", { ascending: false })
      .limit(limit - rows.length);
    if (moreError) fail("produk terkait", moreError);
    rows = [...rows, ...more];
  }
  return rows.map(toCardData);
}

// ---------- Sitemap ----------

// Slug produk yang tayang + kapan terakhir diubah, untuk sitemap.xml.
// RLS sudah menyembunyikan produk nonaktif dari pengunjung; filter is_active ditulis lagi supaya jelas.
export async function getSitemapProducts() {
  const { data, error } = await createPublicClient()
    .from("products")
    .select("slug, updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false });
  if (error) fail("daftar produk sitemap", error);
  return data;
}
