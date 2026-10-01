import { z } from "zod";

// Validasi form katalog admin (produk, kategori, banner). Dipakai di browser (pesan cepat)
// DAN di server action (penjaga sebenarnya). Database masih punya check constraint sendiri.

// ---------- Bantuan ----------

// "Pashmina Airflow Sekar" -> "pashmina-airflow-sekar"
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

// Kode SKU otomatis: "Pashmina Airflow Sekar" + Sage + Standar -> "PAS-AIR-SEK-SAG-STA"
export function suggestSku(productName: string, color: string, size: string): string {
  const part = (s: string) => slugify(s).replace(/-/g, "").slice(0, 3).toUpperCase();
  const base = slugify(productName).split("-").filter(Boolean).slice(0, 3).map(part).join("-") || "PRD";
  return [base, part(color) || "X", part(size) || "X"].join("-");
}

// URL foto WAJIB dari bucket "katalog" milik toko ini. URL dari situs lain ditolak,
// supaya halaman toko tidak bisa disisipi gambar dari luar (pelacak, konten tak pantas, dsb).
export const STORAGE_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/katalog/`;
const storageUrl = z
  .string()
  .max(500)
  .refine((u) => u.startsWith(STORAGE_PREFIX) && !u.includes(".."), "Foto harus diunggah lewat halaman admin.");

const text = (max: number, label: string) => z.string().trim().max(max, `${label} maksimal ${max} karakter.`);
const int = (label: string, min: number, max: number) =>
  z.coerce
    .number({ error: `${label} harus berupa angka.` })
    .int(`${label} harus bilangan bulat.`)
    .min(min, `${label} minimal ${min.toLocaleString("id-ID")}.`)
    .max(max, `${label} maksimal ${max.toLocaleString("id-ID")}.`);
const uuid = z.uuid("Data tidak valid.");

// ---------- Produk ----------

export const variantSchema = z.object({
  id: uuid.optional(),
  color_name: text(30, "Nama warna").min(1, "Nama warna wajib diisi."),
  color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Kode warna tidak valid."),
  size_name: text(30, "Nama ukuran").min(1, "Nama ukuran wajib diisi."),
  size_detail: text(60, "Detail ukuran").optional(),
  sku: z
    .string()
    .trim()
    .min(3, "SKU minimal 3 karakter.")
    .max(40, "SKU maksimal 40 karakter.")
    .regex(/^[A-Za-z0-9-]+$/, "SKU hanya huruf, angka, dan tanda strip."),
  price: int("Harga", 1_000, 100_000_000),
  stock: int("Stok", 0, 100_000),
  stock_before: int("Stok", 0, 100_000), // stok saat form dibuka (simpan selisih, lihat admin_save_product)
  is_active: z.boolean(),
});

export const productSchema = z
  .object({
    id: uuid.optional(),
    name: text(40, "Nama produk").min(1, "Nama produk wajib diisi."),
    category_id: uuid,
    material: text(30, "Bahan").min(1, "Bahan wajib diisi."),
    weight_gram: int("Berat", 1, 30_000),
    description: text(300, "Deskripsi"),
    finishing: text(100, "Finishing"),
    care: text(100, "Perawatan"),
    is_active: z.boolean(),
    images: z.array(z.object({ url: storageUrl, alt: text(120, "Teks foto") })).max(8, "Maksimal 8 foto."),
    variants: z.array(variantSchema).min(1, "Tambahkan minimal satu varian aktif.").max(60, "Maksimal 60 varian."),
  })
  .superRefine((p, ctx) => {
    const combos = new Set<string>();
    const skus = new Set<string>();
    for (const v of p.variants) {
      const combo = `${v.color_name.toLowerCase()}|${v.size_name.toLowerCase()}`;
      if (combos.has(combo)) ctx.addIssue({ code: "custom", path: ["variants"], message: `Varian ${v.color_name} · ${v.size_name} dobel.` });
      if (skus.has(v.sku.toUpperCase())) ctx.addIssue({ code: "custom", path: ["variants"], message: `SKU ${v.sku} dipakai dua kali.` });
      combos.add(combo);
      skus.add(v.sku.toUpperCase());
    }
  });
export type ProductInput = z.input<typeof productSchema>;

// ---------- Kategori ----------

export const slugSchema = z
  .string()
  .trim()
  .min(2, "Slug minimal 2 karakter.")
  .max(60, "Slug maksimal 60 karakter.")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug hanya huruf kecil, angka, dan tanda strip (contoh: hijab-segi-empat).");

export const categorySchema = z.object({
  id: uuid.optional(),
  name: text(50, "Nama kategori").min(1, "Nama kategori wajib diisi."),
  slug: slugSchema,
  description: text(150, "Deskripsi"),
  image_url: storageUrl.nullable(),
});
export type CategoryInput = z.input<typeof categorySchema>;

// ---------- Banner ----------

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid.");

export const bannerSchema = z
  .object({
    id: uuid.optional(),
    title: text(48, "Judul").min(1, "Judul wajib diisi."),
    subtitle: text(120, "Subjudul"),
    cta_text: text(24, "Teks tombol").min(1, "Teks tombol wajib diisi."),
    // Hanya halaman toko sendiri (sama dengan check constraint di database)
    cta_href: z
      .string()
      .regex(/^\/koleksi(\?kategori=[a-z0-9]+(-[a-z0-9]+)*)?$|^\/produk\/[a-z0-9]+(-[a-z0-9]+)*$/, "Pilih tautan tombol."),
    image_desktop_url: storageUrl.nullable(),
    image_mobile_url: storageUrl.nullable(),
    starts_at: isoDate,
    ends_at: isoDate.nullable(),
    is_published: z.boolean(),
  })
  .refine((b) => !b.ends_at || b.ends_at >= b.starts_at, { path: ["ends_at"], message: "Tanggal selesai harus setelah tanggal mulai." });
export type BannerInput = z.input<typeof bannerSchema>;

// ---------- Filter daftar produk ----------

const param = <T extends z.ZodType>(schema: T) => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), schema);

export const PRODUCT_TABS = { semua: "Semua", tampil: "Tampil", sembunyi: "Disembunyikan", menipis: "Stok menipis / habis" } as const;
export type ProductTab = keyof typeof PRODUCT_TABS;

export const productFiltersSchema = z.object({
  tab: param(z.enum(["semua", "tampil", "sembunyi", "menipis"]).catch("semua")),
  q: param(z.string().trim().max(50).regex(/^[\p{L}\p{N} .'-]*$/u).catch("")).catch(""),
  kategori: param(z.uuid().catch("")).catch(""),
  bahan: param(z.string().trim().max(30).regex(/^[\p{L}\p{N} '-]*$/u).catch("")).catch(""),
  hal: param(z.coerce.number().int().min(1).max(1000).catch(1)),
});
export type ProductFilters = z.infer<typeof productFiltersSchema>;
