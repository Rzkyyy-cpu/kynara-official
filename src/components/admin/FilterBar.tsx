"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SearchIcon } from "@/components/icons";

// Baris cari + filter dropdown di halaman daftar admin (Pesanan, Produk). Semua disimpan di URL;
// server membaca & memvalidasinya lagi dengan Zod, jadi nilai di sini tidak dipercaya.

type Select = { name: string; label: string; value: string; options: [value: string, label: string][] };

export function FilterBar({
  q,
  placeholder,
  selects,
  summary,
}: {
  q: string;
  placeholder: string;
  selects: Select[];
  summary: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function set(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("hal"); // filter berubah = kembali ke halaman 1
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 ${pending ? "opacity-60" : ""}`}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          set("q", String(new FormData(e.currentTarget).get("q") ?? "").trim());
        }}
        className="relative w-full sm:w-80"
      >
        <SearchIcon size={18} className="pointer-events-none absolute top-[11px] left-3 text-muted" />
        <input
          name="q"
          type="search"
          defaultValue={q}
          maxLength={50}
          aria-label={placeholder}
          placeholder={placeholder}
          className="h-10 w-full rounded-[10px] border border-line-strong bg-paper pr-3 pl-[38px] text-[13px] font-medium outline-none placeholder:text-muted focus:border-slate"
        />
      </form>
      {selects.map((s) => (
        <select
          key={s.name}
          aria-label={s.label}
          value={s.value}
          onChange={(e) => set(s.name, e.target.value)}
          className="h-10 max-w-full rounded-[10px] border border-line-strong bg-paper px-2.5 text-[13px] font-semibold"
        >
          {s.options.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      ))}
      <span className="text-[13px] text-muted sm:ml-auto">{summary}</span>
    </div>
  );
}
