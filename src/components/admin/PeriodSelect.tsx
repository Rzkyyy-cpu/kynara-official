"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { PERIODS, type Period } from "@/lib/validation/admin";

// Pilihan periode ringkasan. Disimpan di URL (?periode=7), jadi halaman bisa dibagikan/di-refresh.
export function PeriodSelect({ value }: { value: Period }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2.5 text-[13px] font-semibold">
      Periode
      <select
        value={value}
        disabled={pending}
        onChange={(e) => startTransition(() => router.replace(`${pathname}?periode=${e.target.value}`, { scroll: false }))}
        className="h-10 rounded-[10px] border border-line-strong bg-paper px-3 text-sm font-medium disabled:opacity-60"
      >
        {Object.entries(PERIODS).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
