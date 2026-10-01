import { describe, expect, it } from "vitest";
import { bannerStatus, heroBanner } from "@/lib/admin/banner-status";
import { catalogError } from "@/lib/admin/errors";
import { imageProblem } from "@/lib/admin/images";
import { STORAGE_PREFIX, bannerSchema, categorySchema, productSchema, productFiltersSchema, slugify, suggestSku } from "@/lib/validation/admin-catalog";

const img = (name: string) => `${STORAGE_PREFIX}produk/${name}.webp`;
const variant = (color: string, size: string, sku: string) => ({
  color_name: color,
  color_hex: "#9DAE9B",
  size_name: size,
  sku,
  price: "79000",
  stock: "5",
  stock_before: "5",
  is_active: true,
});
const product = {
  name: "Pashmina Airflow Sekar",
  category_id: "7f1a5b2e-0c3d-4a5b-8c9d-0e1f2a3b4c5d",
  material: "Airflow",
  weight_gram: "150",
  description: "",
  finishing: "",
  care: "",
  is_active: true,
  images: [{ url: img("a"), alt: "" }],
  variants: [variant("Sage", "Standar", "PAS-SAG-STA")],
};

describe("slug & SKU", () => {
  it("slug dari nama", () => {
    expect(slugify("Pashmina Airflow Sekar")).toBe("pashmina-airflow-sekar");
    expect(slugify("Instan / Bergo")).toBe("instan-bergo");
    expect(slugify("  Café — Édisi #1 ")).toBe("cafe-edisi-1");
  });

  it("SKU otomatis dari nama, warna, ukuran", () => {
    expect(suggestSku("Pashmina Airflow Sekar", "Sage", "Standar")).toBe("PAS-AIR-SEK-SAG-STA");
    expect(suggestSku("", "Lilac", "All size")).toBe("PRD-LIL-ALL");
  });
});

describe("validasi produk", () => {
  it("produk lengkap lolos, angka dari input teks diubah jadi number", () => {
    const p = productSchema.parse(product);
    expect(p.weight_gram).toBe(150);
    expect(p.variants[0].price).toBe(79000);
  });

  it("foto dari luar bucket toko ditolak", () => {
    for (const url of ["https://situs-lain.com/a.jpg", `${STORAGE_PREFIX}../rahasia.png`, "javascript:alert(1)"]) {
      expect(productSchema.safeParse({ ...product, images: [{ url, alt: "" }] }).success).toBe(false);
    }
  });

  it("nama > 40 karakter, varian dobel, dan SKU kembar ditolak", () => {
    expect(productSchema.safeParse({ ...product, name: "x".repeat(41) }).success).toBe(false);
    const dobel = productSchema.safeParse({ ...product, variants: [variant("Sage", "Standar", "A-1"), variant("sage", "standar", "A-2")] });
    expect(dobel.error?.issues[0].message).toContain("dobel");
    const kembar = productSchema.safeParse({ ...product, variants: [variant("Sage", "Standar", "A-1"), variant("Lilac", "Standar", "a-1")] });
    expect(kembar.error?.issues[0].message).toContain("SKU");
  });

  it("stok minus, harga nol, dan SKU aneh ditolak", () => {
    expect(productSchema.safeParse({ ...product, variants: [{ ...variant("A", "B", "A-B"), stock: "-1" }] }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, variants: [{ ...variant("A", "B", "A-B"), price: "0" }] }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, variants: [variant("A", "B", "A B<script>")] }).success).toBe(false);
  });
});

describe("validasi kategori & banner", () => {
  it("slug kategori harus huruf kecil-strip", () => {
    const c = { name: "Pashmina", slug: "pashmina", description: "", image_url: null };
    expect(categorySchema.safeParse(c).success).toBe(true);
    expect(categorySchema.safeParse({ ...c, slug: "Pash Mina" }).success).toBe(false);
    expect(categorySchema.safeParse({ ...c, slug: "../admin" }).success).toBe(false);
  });

  it("tautan banner hanya ke halaman toko sendiri", () => {
    const b = { title: "Promo", subtitle: "", cta_text: "Lihat", image_desktop_url: null, image_mobile_url: null, starts_at: "2026-10-01", ends_at: null, is_published: true };
    for (const href of ["/koleksi", "/koleksi?kategori=pashmina", "/produk/pashmina-airflow-sekar"]) {
      expect(bannerSchema.safeParse({ ...b, cta_href: href }).success).toBe(true);
    }
    for (const href of ["https://situs-lain.com", "//situs-lain.com", "/admin", "javascript:alert(1)", "/koleksi?kategori=a&b=c"]) {
      expect(bannerSchema.safeParse({ ...b, cta_href: href }).success).toBe(false);
    }
    expect(bannerSchema.safeParse({ ...b, cta_href: "/koleksi", ends_at: "2026-09-01" }).error?.issues[0].message).toContain("setelah");
  });

  it("filter daftar produk kembali ke bawaan kalau aneh", () => {
    expect(productFiltersSchema.parse({ tab: "x", kategori: "bukan-uuid", q: "a,b", bahan: "Voal" })).toEqual({ tab: "semua", q: "", kategori: "", bahan: "Voal", hal: 1 });
  });
});

describe("foto", () => {
  it("tipe, ukuran file, dan resolusi minimum", () => {
    expect(imageProblem({ type: "image/gif", size: 1000 }, "produk")).toContain("JPG, PNG, atau WebP");
    expect(imageProblem({ type: "image/png", size: 3.4 * 1024 * 1024 }, "produk")).toBe("File 3,4 MB, maks. 2 MB.");
    expect(imageProblem({ type: "image/webp", size: 500_000 }, "produk", { width: 800, height: 1000 })).toContain("min. 1080 × 1350");
    expect(imageProblem({ type: "image/webp", size: 500_000 }, "kategori", { width: 800, height: 1000 })).toBeNull();
    expect(imageProblem({ type: "image/jpeg", size: 500_000 }, "banner-desktop", { width: 1440, height: 640 })).toBeNull();
  });
});

describe("status banner", () => {
  const b = (is_published: boolean, starts_at: string, ends_at: string | null, sort_order = 0) => ({ is_published, starts_at, ends_at, sort_order });

  it("aktif, terjadwal, berakhir, draf (tanggal WIB)", () => {
    expect(bannerStatus(b(false, "2026-09-01", null), "2026-10-01")).toBe("draf");
    expect(bannerStatus(b(true, "2026-09-01", null), "2026-10-01")).toBe("aktif");
    expect(bannerStatus(b(true, "2026-10-01", "2026-10-01"), "2026-10-01")).toBe("aktif"); // hari terakhir masih tayang
    expect(bannerStatus(b(true, "2026-10-05", null), "2026-10-01")).toBe("terjadwal");
    expect(bannerStatus(b(true, "2026-08-01", "2026-08-31"), "2026-10-01")).toBe("berakhir");
  });

  it("hero = banner aktif paling atas", () => {
    const list = [b(true, "2026-10-05", null, 1), b(true, "2026-09-01", null, 3), b(true, "2026-09-01", null, 2)];
    expect(heroBanner(list, "2026-10-01")?.sort_order).toBe(2);
    expect(heroBanner([b(false, "2026-09-01", null)], "2026-10-01")).toBeNull();
  });
});

describe("pesan error katalog", () => {
  it("kode database diterjemahkan", () => {
    expect(catalogError('violates unique constraint "product_variants_sku_key"')).toContain("SKU sudah dipakai");
    expect(catalogError("BERANDA_PENUH")).toContain("6 kategori");
    expect(catalogError("PRODUK_PERNAH_DIPESAN")).toContain("Sembunyikan");
    expect(catalogError("koneksi putus")).toContain("Coba lagi");
  });
});
