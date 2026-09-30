import Link from "next/link";
import { CheckIcon, ChevronLeftIcon, LockIcon } from "@/components/icons";

export const STEPS = ["Alamat", "Pengiriman", "Konfirmasi"] as const;

// Kepala halaman checkout: tanpa menu toko supaya pembeli fokus menyelesaikan pesanan.
// Desktop: logo · langkah · "Checkout aman". HP: tombol kembali · "Checkout" · "Aman", langkah di bawahnya.
export function CheckoutHeader({ step, onBack }: { step: 1 | 2 | 3; onBack: () => void }) {
  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-line bg-paper pr-3 pl-2 lg:h-20 lg:bg-bg lg:px-20">
        <button
          type="button"
          onClick={onBack}
          aria-label={step === 1 ? "Kembali ke keranjang" : "Kembali ke langkah sebelumnya"}
          className="flex size-11 items-center justify-center lg:hidden"
        >
          <ChevronLeftIcon size={22} />
        </button>
        <Link href="/" className="hidden font-serif text-[30px] font-medium text-ink lg:block">
          kynara
        </Link>
        <span className="text-base font-bold lg:hidden">Checkout</span>

        <Steps step={step} className="hidden lg:flex" />

        <span className="flex items-center gap-1 text-xs font-semibold text-slate-900 lg:gap-1.5 lg:text-[13px]">
          <LockIcon size={14} />
          <span className="lg:hidden">Aman</span>
          <span className="hidden lg:inline">Checkout aman</span>
        </span>
      </header>
      <Steps step={step} className="grid border-b border-line bg-paper px-5 py-4 lg:hidden" />
    </>
  );
}

function Steps({ step, className }: { step: number; className: string }) {
  return (
    <ol aria-label="Langkah checkout" className={`grid-cols-3 items-center gap-4 text-xs lg:gap-4 lg:text-sm ${className}`}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const current = n === step;
        return (
          <li key={label} className="contents">
            {i > 0 && (
              <span
                aria-hidden="true"
                className={`hidden h-0.5 w-14 lg:block ${n <= step ? "bg-slate-700" : "bg-line-strong"}`}
              />
            )}
            <span
              aria-current={current ? "step" : undefined}
              className={`flex flex-col items-center gap-1.5 lg:flex-row lg:gap-2.5 ${
                current ? "font-bold text-ink" : done ? "font-medium text-slate-700" : "text-muted"
              }`}
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  current
                    ? "bg-ink text-bg"
                    : done
                      ? "bg-slate-600 text-white"
                      : "border-[1.5px] border-line-dashed text-muted"
                }`}
              >
                {done ? <CheckIcon size={16} /> : n}
              </span>
              {label}
              {done && <span className="sr-only">(selesai)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
