import "server-only";

import { z } from "zod";
import type { CatalogFilters } from "@/lib/catalog-url";

// Filter halaman Koleksi disimpan di URL, contoh:
//   /koleksi?kategori=pashmina&bahan=Airflow,Ceruty&harga=a&urut=termurah&halaman=2
// Keuntungannya: bisa di-bookmark, dibagikan, dan tetap sama saat refresh.
// Semua nilai dari URL dianggap tidak bisa dipercaya, jadi divalidasi dengan Zod.
// Nilai yang tidak valid tidak membuat error, tapi diganti nilai default (.catch).

type RawParams = Record<string, string | string[] | undefined>;

// "Airflow,Ceruty" -> ["Airflow", "Ceruty"]; maksimal 10 nilai, masing-masing maks. 30 karakter
const list = z
  .string()
  .transform((s) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x.length > 0 && x.length <= 30),
  )
  .pipe(z.array(z.string()).max(10))
  .catch([]);

const rupiah = z.coerce.number().int().min(0).max(100_000_000).optional().catch(undefined);

const schema = z.object({
  kategori: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .max(60)
    .optional()
    .catch(undefined),
  bahan: list,
  warna: list,
  harga: z.enum(["a", "b", "c"]).optional().catch(undefined),
  min: rupiah,
  maks: rupiah,
  urut: z.enum(["terbaru", "terlaris", "termurah", "termahal"]).catch("terbaru"),
  // Buang karakter khusus pencarian SQL (% _ \) supaya tidak bisa dipakai mengakali query
  q: z
    .string()
    .transform((s) => s.replace(/[%_\\]/g, " ").trim().slice(0, 60))
    .optional()
    .catch(undefined),
  halaman: z.coerce.number().int().min(1).max(1000).catch(1),
});

export function parseFilters(params: RawParams): CatalogFilters {
  // Kalau parameter muncul dua kali (?bahan=a&bahan=b), ambil yang pertama
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const parsed = schema.parse({
    kategori: first(params.kategori),
    bahan: first(params.bahan) ?? "",
    warna: first(params.warna) ?? "",
    harga: first(params.harga),
    min: first(params.min) || undefined,
    maks: first(params.maks) || undefined,
    urut: first(params.urut),
    q: first(params.q),
    halaman: first(params.halaman),
  });
  return { ...parsed, q: parsed.q || undefined };
}
