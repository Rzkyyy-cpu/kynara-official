import type { Metadata } from "next";
import { ActiveFilterChips } from "@/components/catalog/ActiveFilterChips";
import { FilterSidebar } from "@/components/catalog/FilterSidebar";
import { MobileFilter } from "@/components/catalog/MobileFilter";
import { Pagination } from "@/components/catalog/Pagination";
import { SortSelect } from "@/components/catalog/SortSelect";
import { SearchIcon } from "@/components/icons";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { ChipLink } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductCard } from "@/components/ui/ProductCard";
import { getCategories, getFilterOptions, getProducts } from "@/lib/catalog";
import { parseFilters } from "@/lib/catalog-filters";
import { buildCatalogUrl, countActiveFilters, PAGE_SIZE } from "@/lib/catalog-url";

export async function generateMetadata({ searchParams }: PageProps<"/koleksi">): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  const category = filters.kategori ? (await getCategories()).find((c) => c.slug === filters.kategori) : undefined;
  return {
    title: `${category?.name ?? "Semua Koleksi"} — kynara`,
    description: category?.description ?? "Kerudung dan busana muslimah kynara: pashmina, segi empat, bergo, outer, dan lainnya.",
  };
}

export default async function KoleksiPage({ searchParams }: PageProps<"/koleksi">) {
  // searchParams berasal dari URL, jadi divalidasi dulu (lihat catalog-filters.ts)
  const filters = parseFilters(await searchParams);

  // Tiga query berjalan bersamaan, bukan bergantian, supaya halaman lebih cepat
  const [categories, options, { items, total, totalPages }] = await Promise.all([
    getCategories(),
    getFilterOptions(),
    getProducts(filters),
  ]);

  const category = categories.find((c) => c.slug === filters.kategori);
  const title = category?.name ?? "Semua Koleksi";
  const from = (filters.halaman - 1) * PAGE_SIZE + 1;
  const to = from + items.length - 1;
  const hasFilters = countActiveFilters(filters) > 0 || !!filters.q;

  return (
    <Container className="flex flex-col gap-5 pt-5 pb-12 lg:gap-6 lg:pt-7 lg:pb-20">
      <Breadcrumb
        items={[
          { label: "Beranda", href: "/" },
          category ? { label: "Koleksi", href: "/koleksi" } : { label: "Koleksi" },
          ...(category ? [{ label: category.name }] : []),
        ]}
      />

      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-4xl font-medium lg:text-5xl">{title}</h1>
        {category?.description && <p className="hidden text-[15px] text-muted lg:block">{category.description}</p>}
        <p className="text-sm text-muted lg:hidden">{total} produk</p>
      </header>

      {/* Pencarian: formulir biasa (GET), hasilnya jadi ?q=... di URL */}
      <form action="/koleksi" role="search" className="max-w-md">
        {filters.kategori && <input type="hidden" name="kategori" value={filters.kategori} />}
        <label className="flex h-12 items-center gap-2.5 rounded-full border border-line-strong bg-paper px-4 text-muted focus-within:border-slate">
          <SearchIcon size={20} />
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            aria-label="Cari produk"
            placeholder="Cari pashmina, bergo…"
            className="w-full bg-transparent text-[15px] text-ink outline-none"
          />
        </label>
      </form>

      {/* Pilihan kategori: bisa digeser ke samping di HP */}
      <nav aria-label="Kategori" className="-mx-5 overflow-x-auto px-5 lg:mx-0 lg:px-0">
        <div className="flex gap-2">
          <ChipLink href={buildCatalogUrl(filters, { kategori: undefined, halaman: 1 })} selected={!category}>
            Semua
          </ChipLink>
          {categories.map((c) => (
            <ChipLink
              key={c.slug}
              href={buildCatalogUrl(filters, { kategori: c.slug, halaman: 1 })}
              selected={c.slug === filters.kategori}
            >
              {c.name}
            </ChipLink>
          ))}
        </div>
      </nav>

      <MobileFilter filters={filters} materials={options.materials} colors={options.colors} categories={categories} />

      <div className="flex gap-10 lg:mt-4">
        <FilterSidebar filters={filters} materials={options.materials} colors={options.colors} />

        <section aria-label="Daftar produk" className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="hidden items-center justify-between lg:flex">
            <p className="text-sm font-semibold">
              {total} produk{filters.q && <span className="font-normal text-muted"> untuk “{filters.q}”</span>}
            </p>
            <SortSelect filters={filters} />
          </div>

          <ActiveFilterChips filters={filters} />

          {items.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-6">
                {items.map((p) => (
                  <ProductCard key={p.href} product={p} />
                ))}
              </div>
              <p className="text-center text-[13px] text-muted">
                Menampilkan {from}–{to} dari {total} produk
              </p>
              <Pagination filters={filters} totalPages={totalPages} />
            </>
          ) : (
            <EmptyState
              icon={<SearchIcon size={28} />}
              title="Belum ada yang cocok"
              description={
                hasFilters
                  ? "Coba kurangi filter atau pakai kata kunci lain."
                  : "Produk di kategori ini sedang disiapkan. Lihat koleksi lainnya dulu, ya."
              }
            >
              {hasFilters && (
                <Button href={buildCatalogUrl({ bahan: [], warna: [], urut: "terbaru", halaman: 1, kategori: filters.kategori })} variant="outline" size="md">
                  Hapus filter
                </Button>
              )}
              <Button href="/koleksi" size="md">
                Lihat Semua Koleksi
              </Button>
            </EmptyState>
          )}
        </section>
      </div>
    </Container>
  );
}
