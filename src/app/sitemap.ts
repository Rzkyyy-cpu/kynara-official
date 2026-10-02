import type { MetadataRoute } from "next";
import { getCategories, getSitemapProducts } from "@/lib/catalog";
import { categoryHref } from "@/lib/navigation";
import { SITE_URL } from "@/lib/site";

// sitemap.xml = "daftar isi" untuk mesin pencari: semua halaman publik yang layak diindeks.
// Halaman akun, keranjang, checkout, dan admin sengaja tidak dicantumkan.
// Dibuat ulang paling lama tiap 1 jam, supaya produk baru ikut masuk.
export const revalidate = 3600;

const STATIC_PAGES = ["/tentang", "/panduan", "/kebijakan-retur", "/syarat-ketentuan", "/kebijakan-privasi"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getSitemapProducts()]);

  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/koleksi`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: `${SITE_URL}${categoryHref(c.slug)}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({
      url: `${SITE_URL}/produk/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...STATIC_PAGES.map((path) => ({ url: `${SITE_URL}${path}`, changeFrequency: "monthly" as const, priority: 0.3 })),
  ];
}
