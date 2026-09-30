"use client";

import { useState } from "react";
import type { Color } from "@/lib/catalog";

// Potongan kontrol filter yang dipakai bersama oleh sidebar (desktop) dan sheet (HP).

export function FilterHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-eyebrow font-semibold text-ink uppercase">{children}</h3>;
}

// Lingkaran warna yang bisa dipilih lebih dari satu
export function ColorSwatches({
  colors,
  selected,
  onToggle,
}: {
  colors: Color[];
  selected: string[];
  onToggle: (name: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((c) => {
        const on = selected.includes(c.name);
        return (
          <button
            key={c.name}
            type="button"
            aria-pressed={on}
            aria-label={c.name}
            title={c.name}
            onClick={() => onToggle(c.name)}
            className={`flex size-11 items-center justify-center rounded-full border-2 ${
              on ? "border-ink" : "border-transparent"
            }`}
          >
            <span className="size-8 rounded-full border border-ink/20" style={{ background: c.hex }} />
          </button>
        );
      })}
    </div>
  );
}

// Input harga minimum & maksimum. Nilai diterapkan lewat onCommit (saat Enter atau keluar dari kolom).
export function PriceInputs({
  min,
  max,
  onCommit,
}: {
  min?: number;
  max?: number;
  onCommit: (min?: number, max?: number) => void;
}) {
  const [minText, setMinText] = useState(min?.toString() ?? "");
  const [maxText, setMaxText] = useState(max?.toString() ?? "");

  // Hanya angka yang diterima; "Rp 90.000" -> 90000
  const toNumber = (s: string) => {
    const digits = s.replace(/\D/g, "");
    return digits ? Number(digits) : undefined;
  };
  const commit = () => onCommit(toNumber(minText), toNumber(maxText));

  const inputCls =
    "h-11 w-full min-w-0 rounded-input border border-line-strong bg-paper px-3 text-sm outline-none focus:border-slate";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        commit();
      }}
      className="flex items-end gap-2"
    >
      <label className="flex flex-1 flex-col gap-1 text-xs font-semibold">
        Min
        <input
          inputMode="numeric"
          placeholder="Rp0"
          value={minText}
          onChange={(e) => setMinText(e.target.value)}
          onBlur={commit}
          className={inputCls}
        />
      </label>
      <span className="pb-3 text-muted" aria-hidden="true">
        –
      </span>
      <label className="flex flex-1 flex-col gap-1 text-xs font-semibold">
        Maks
        <input
          inputMode="numeric"
          placeholder="Rp500rb"
          value={maxText}
          onChange={(e) => setMaxText(e.target.value)}
          onBlur={commit}
          className={inputCls}
        />
      </label>
    </form>
  );
}
