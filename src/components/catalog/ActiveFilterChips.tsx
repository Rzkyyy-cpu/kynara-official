import Link from "next/link";
import { CloseIcon } from "@/components/icons";
import { buildCatalogUrl, type CatalogFilters, PRICE_RANGES } from "@/lib/catalog-url";
import { formatRupiah } from "@/lib/format";

// Chip filter yang sedang aktif, misalnya [Airflow ×] [Ceruty ×]. Klik × untuk menghapus satu filter.
export function ActiveFilterChips({ filters }: { filters: CatalogFilters }) {
  const chips: { label: string; href: string }[] = [
    ...filters.bahan.map((b) => ({
      label: b,
      href: buildCatalogUrl(filters, { bahan: filters.bahan.filter((x) => x !== b), halaman: 1 }),
    })),
    ...filters.warna.map((w) => ({
      label: w,
      href: buildCatalogUrl(filters, { warna: filters.warna.filter((x) => x !== w), halaman: 1 }),
    })),
  ];

  const clearPrice = buildCatalogUrl(filters, { harga: undefined, min: undefined, maks: undefined, halaman: 1 });
  if (filters.min !== undefined || filters.maks !== undefined) {
    const label =
      filters.min !== undefined && filters.maks !== undefined
        ? `${formatRupiah(filters.min)} – ${formatRupiah(filters.maks)}`
        : filters.min !== undefined
          ? `Mulai ${formatRupiah(filters.min)}`
          : `Sampai ${formatRupiah(filters.maks!)}`;
    chips.push({ label, href: clearPrice });
  } else if (filters.harga) {
    chips.push({ label: PRICE_RANGES[filters.harga].label, href: clearPrice });
  }

  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Filter aktif">
      {chips.map((c) => (
        <li key={c.label}>
          <Link
            href={c.href}
            scroll={false}
            aria-label={`Hapus filter ${c.label}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-sky-tint pr-2.5 pl-3 text-[13px] font-semibold text-slate-900"
          >
            {c.label}
            <CloseIcon size={14} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
