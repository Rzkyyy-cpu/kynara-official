import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { buildCatalogUrl, type CatalogFilters } from "@/lib/catalog-url";

// Nomor halaman: 1 2 3 … 9 >. Menampilkan halaman pertama, terakhir, dan 1 di kiri-kanan halaman aktif.
function pageList(current: number, total: number): (number | "…")[] {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("…");
    result.push(p);
  });
  return result;
}

export function Pagination({ filters, totalPages }: { filters: CatalogFilters; totalPages: number }) {
  if (totalPages <= 1) return null;
  const current = filters.halaman;
  const itemCls = "flex size-11 items-center justify-center rounded-full border text-sm font-semibold";

  return (
    <nav aria-label="Halaman" className="flex justify-center">
      <ul className="flex items-center gap-2">
        {current > 1 && (
          <li>
            <Link
              href={buildCatalogUrl(filters, { halaman: current - 1 })}
              aria-label="Halaman sebelumnya"
              className={`${itemCls} border-line-strong bg-paper`}
            >
              <ArrowRightIcon size={16} className="rotate-180" />
            </Link>
          </li>
        )}
        {pageList(current, totalPages).map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} className="px-1 text-muted" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={buildCatalogUrl(filters, { halaman: p })}
                aria-label={`Halaman ${p}`}
                aria-current={p === current ? "page" : undefined}
                className={`${itemCls} ${p === current ? "border-ink bg-ink text-bg" : "border-line-strong bg-paper"}`}
              >
                {p}
              </Link>
            </li>
          ),
        )}
        {current < totalPages && (
          <li>
            <Link
              href={buildCatalogUrl(filters, { halaman: current + 1 })}
              aria-label="Halaman berikutnya"
              className={`${itemCls} border-line-strong bg-paper`}
            >
              <ArrowRightIcon size={16} />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
