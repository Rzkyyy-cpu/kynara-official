"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColorSwatches, FilterHeading, PriceInputs } from "@/components/catalog/FilterControls";
import type { Color } from "@/lib/catalog";
import {
  buildCatalogUrl,
  type CatalogFilters,
  PRICE_RANGES,
  type PriceRange,
  toggleValue,
} from "@/lib/catalog-url";

// Sidebar filter desktop (koleksi desktop). Setiap perubahan langsung mengubah URL,
// lalu Next.js mengambil ulang daftar produk dari server.
export function FilterSidebar({
  filters,
  materials,
  colors,
}: {
  filters: CatalogFilters;
  materials: string[];
  colors: Color[];
}) {
  const router = useRouter();

  // Setiap filter berubah, kembali ke halaman 1 (halaman lama mungkin sudah tidak ada)
  const apply = (changes: Partial<CatalogFilters>) => {
    const url = buildCatalogUrl(filters, { ...changes, halaman: 1 });
    router.push(url, { scroll: false });
  };

  const priceKey: PriceRange | "all" = filters.harga ?? "all";
  const hasCustomPrice = filters.min !== undefined || filters.maks !== undefined;

  return (
    <aside aria-label="Filter produk" className="hidden w-[190px] shrink-0 flex-col gap-6 lg:flex">
      <div className="flex items-center justify-between border-b border-line pb-5">
        <h2 className="text-lg font-semibold">Filter</h2>
        <Link
          href={buildCatalogUrl({ bahan: [], warna: [], urut: filters.urut, halaman: 1, kategori: filters.kategori, q: filters.q })}
          scroll={false}
          className="text-sm font-semibold text-slate-700 hover:underline"
        >
          Reset
        </Link>
      </div>

      <fieldset className="flex flex-col gap-2.5 border-b border-line pb-6">
        <legend className="mb-3">
          <FilterHeading>Bahan</FilterHeading>
        </legend>
        {materials.map((m) => (
          <label key={m} className="flex min-h-8 cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={filters.bahan.includes(m)}
              onChange={() => apply({ bahan: toggleValue(filters.bahan, m) })}
              className="size-[18px] accent-slate-700"
            />
            {m}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2.5 border-b border-line pb-6">
        <legend className="mb-3">
          <FilterHeading>Harga</FilterHeading>
        </legend>
        {(["all", "a", "b", "c"] as const).map((k) => (
          <label key={k} className="flex min-h-8 cursor-pointer items-center gap-3 text-sm">
            <input
              type="radio"
              name="harga"
              checked={!hasCustomPrice && priceKey === k}
              onChange={() => apply({ harga: k === "all" ? undefined : k, min: undefined, maks: undefined })}
              className="size-[18px] accent-slate-700"
            />
            {k === "all" ? "Semua harga" : PRICE_RANGES[k].label}
          </label>
        ))}
        <div className="mt-2">
          <PriceInputs
            key={`${filters.min}-${filters.maks}`}
            min={filters.min}
            max={filters.maks}
            onCommit={(min, maks) => {
              if (min === filters.min && maks === filters.maks) return; // tidak berubah
              apply({ min, maks, harga: undefined });
            }}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3">
          <FilterHeading>Warna</FilterHeading>
        </legend>
        <ColorSwatches
          colors={colors}
          selected={filters.warna}
          onToggle={(name) => apply({ warna: toggleValue(filters.warna, name) })}
        />
      </fieldset>
    </aside>
  );
}
