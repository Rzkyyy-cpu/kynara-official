"use client";

import { useRouter } from "next/navigation";
import { buildCatalogUrl, type CatalogFilters, SORTS, type Sort } from "@/lib/catalog-url";

// Pilihan "Urutkan" di desktop. Di HP, urutan dipilih lewat sheet filter.
export function SortSelect({ filters }: { filters: CatalogFilters }) {
  const router = useRouter();
  return (
    <label className="hidden items-center gap-2.5 text-sm font-semibold lg:flex">
      Urutkan
      <select
        value={filters.urut}
        onChange={(e) => router.push(buildCatalogUrl(filters, { urut: e.target.value as Sort, halaman: 1 }), { scroll: false })}
        className="h-11 min-w-40 rounded-input border border-line-strong bg-paper px-3 text-sm font-medium outline-none focus:border-slate"
      >
        {(Object.keys(SORTS) as Sort[]).map((s) => (
          <option key={s} value={s}>
            {SORTS[s]}
          </option>
        ))}
      </select>
    </label>
  );
}
