"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ColorSwatches, FilterHeading, PriceInputs } from "@/components/catalog/FilterControls";
import { CloseIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ChipButton } from "@/components/ui/Chip";
import type { Color } from "@/lib/catalog";
import {
  buildCatalogUrl,
  type CatalogFilters,
  countActiveFilters,
  PRICE_RANGES,
  SORTS,
  type Sort,
  toggleValue,
} from "@/lib/catalog-url";

// Baris tombol "Filter" & "Urutkan" di HP, plus sheet "Filter & urutkan" yang muncul dari bawah
// (mobile-belanja/04-filter-urutkan). Berbeda dengan sidebar desktop, pilihan di sini
// baru diterapkan saat tombol "Tampilkan produk" ditekan.
export function MobileFilter({
  filters,
  materials,
  colors,
  categories,
}: {
  filters: CatalogFilters;
  materials: string[];
  colors: Color[];
  categories: { name: string; slug: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters); // salinan sementara selama sheet terbuka
  const closeRef = useRef<HTMLButtonElement>(null);
  const active = countActiveFilters(filters);

  const openSheet = () => {
    setDraft(filters);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const update = (changes: Partial<CatalogFilters>) => setDraft((d) => ({ ...d, ...changes }));
  const apply = () => {
    setOpen(false);
    router.push(buildCatalogUrl(draft, { halaman: 1 }));
  };

  const triggerCls =
    "flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-line-strong bg-paper text-sm font-semibold";

  return (
    <div className="lg:hidden">
      <div className="flex gap-2.5">
        <button type="button" onClick={openSheet} className={triggerCls}>
          Filter
          {active > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-slate-600 text-[11px] text-white">
              {active}
            </span>
          )}
        </button>
        <button type="button" onClick={openSheet} className={triggerCls}>
          {SORTS[filters.urut]}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Tutup filter"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/50"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filter dan urutkan"
            className="absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-[20px] bg-paper"
          >
            <span className="mx-auto mt-2 h-1 w-10 rounded-full bg-line-strong" aria-hidden="true" />
            <div className="flex items-center justify-between border-b border-line py-2 pr-2 pl-5">
              <h2 className="text-lg font-bold">Filter &amp; urutkan</h2>
              <button
                ref={closeRef}
                type="button"
                aria-label="Tutup"
                onClick={() => setOpen(false)}
                className="flex size-11 items-center justify-center"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex flex-col gap-7 overflow-y-auto px-5 py-5">
              <section className="flex flex-col gap-3">
                <FilterHeading>Urutkan</FilterHeading>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(SORTS) as Sort[]).map((s) => (
                    <ChipButton key={s} selected={draft.urut === s} onClick={() => update({ urut: s })}>
                      {SORTS[s]}
                    </ChipButton>
                  ))}
                </div>
              </section>

              <section className="flex flex-col gap-3">
                <FilterHeading>Bahan</FilterHeading>
                <div className="flex flex-wrap gap-2">
                  {materials.map((m) => (
                    <ChipButton
                      key={m}
                      selected={draft.bahan.includes(m)}
                      onClick={() => update({ bahan: toggleValue(draft.bahan, m) })}
                    >
                      {m}
                    </ChipButton>
                  ))}
                </div>
              </section>

              <section className="flex flex-col gap-3">
                <FilterHeading>Harga</FilterHeading>
                <PriceInputs
                  key={`${draft.min}-${draft.maks}`}
                  min={draft.min}
                  max={draft.maks}
                  onCommit={(min, maks) => {
                    if (min !== draft.min || maks !== draft.maks) update({ min, maks, harga: undefined });
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {(["a", "b", "c"] as const).map((k) => (
                    <ChipButton
                      key={k}
                      selected={draft.harga === k && draft.min === undefined && draft.maks === undefined}
                      onClick={() =>
                        update({ harga: draft.harga === k ? undefined : k, min: undefined, maks: undefined })
                      }
                    >
                      {PRICE_RANGES[k].short}
                    </ChipButton>
                  ))}
                </div>
              </section>

              <section className="flex flex-col gap-3">
                <FilterHeading>Warna</FilterHeading>
                <ColorSwatches
                  colors={colors}
                  selected={draft.warna}
                  onToggle={(name) => update({ warna: toggleValue(draft.warna, name) })}
                />
              </section>

              <section className="flex flex-col gap-3">
                <FilterHeading>Kategori</FilterHeading>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <ChipButton
                      key={c.slug}
                      selected={draft.kategori === c.slug}
                      onClick={() => update({ kategori: draft.kategori === c.slug ? undefined : c.slug })}
                    >
                      {c.name}
                    </ChipButton>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid grid-cols-[1fr_1.7fr] gap-3 border-t border-line px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button
                variant="outline"
                size="md"
                onClick={() => setDraft({ bahan: [], warna: [], urut: "terbaru", halaman: 1, q: filters.q })}
              >
                Reset
              </Button>
              <Button size="md" onClick={apply}>
                Tampilkan produk
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
