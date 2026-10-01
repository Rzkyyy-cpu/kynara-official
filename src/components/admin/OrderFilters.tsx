"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SearchIcon } from "@/components/icons";
import { COURIER_FILTERS, ORDER_RANGES } from "@/lib/validation/admin";

// Cari, rentang tanggal, dan kurir di halaman Pesanan. Semua disimpan di URL;
// server membaca & memvalidasinya lagi (orderFiltersSchema), jadi nilai di sini tidak dipercaya.
export function OrderFilters({ q, rentang, kurir, total }: { q: string; rentang: string; kurir: string; total: number }) {
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

  const selectCls = "h-10 rounded-[10px] border border-line-strong bg-paper px-2.5 text-[13px] font-semibold";

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
          aria-label="Cari pesanan"
          placeholder="Cari no. pesanan atau nama pembeli"
          className="h-10 w-full rounded-[10px] border border-line-strong bg-paper pr-3 pl-[38px] text-[13px] font-medium outline-none placeholder:text-muted focus:border-slate"
        />
      </form>
      <select aria-label="Rentang tanggal" value={rentang} onChange={(e) => set("rentang", e.target.value)} className={selectCls}>
        {Object.entries(ORDER_RANGES).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </select>
      <select aria-label="Kurir" value={kurir} onChange={(e) => set("kurir", e.target.value)} className={selectCls}>
        {Object.entries(COURIER_FILTERS).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </select>
      <span className="text-[13px] text-muted sm:ml-auto">{total} pesanan</span>
    </div>
  );
}
