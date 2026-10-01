"use client";

import { type PaymentChoice, paymentLabel } from "@/lib/komerce-payment/status";

// Pilihan metode bayar (checkout langkah 3: desktop-akun-checkout/09, mobile-akun-checkout/10).
// HP: satu kartu berisi baris-baris; desktop: kartu kecil 2 kolom per grup.

export type MethodOption = { type: "va" | "qris"; code: string };

export const choiceKey = (c: PaymentChoice | null) => (c ? (c.type === "va" ? `va:${c.bank}` : "qris") : "");
export const toChoice = (m: MethodOption): PaymentChoice => (m.type === "va" ? { type: "va", bank: m.code } : { type: "qris" });
export const methodName = (m: MethodOption) => paymentLabel(m.type, m.code);
export const methodTag = (c: PaymentChoice | null) => (c ? (c.type === "va" ? c.bank : "QRIS") : "");

export function PaymentMethodPicker({
  methods,
  value,
  onChange,
  vaDisabledReason,
}: {
  methods: MethodOption[];
  value: PaymentChoice | null;
  onChange: (c: PaymentChoice) => void;
  vaDisabledReason?: string | null; // mis. sisa waktu bayar < 1 jam
}) {
  const groups = [
    { title: "Virtual account", items: methods.filter((m) => m.type === "va"), disabled: !!vaDisabledReason, note: vaDisabledReason },
    {
      title: "E-wallet & QRIS",
      items: methods.filter((m) => m.type === "qris"),
      disabled: false,
      note: "Scan pakai GoPay, OVO, DANA, ShopeePay, atau m-banking.",
    },
  ].filter((g) => g.items.length > 0);
  const selected = choiceKey(value);

  return (
    <fieldset className="flex flex-col overflow-hidden rounded-2xl border border-line bg-paper pb-2 lg:gap-6 lg:overflow-visible lg:border-0 lg:bg-transparent lg:pb-0">
      <legend className="sr-only">Pilih metode pembayaran</legend>
      {groups.map((g) => (
        <div key={g.title} className="flex flex-col lg:gap-2.5">
          <span className="px-4 pt-3.5 pb-1.5 text-xs font-bold tracking-[0.08em] text-ink-soft uppercase lg:p-0">{g.title}</span>
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-2.5">
            {g.items.map((m) => {
              const key = choiceKey(toChoice(m));
              const on = key === selected;
              return (
                <label
                  key={key}
                  className={`grid min-h-[52px] grid-cols-[24px_1fr_auto] items-center gap-3 px-4 text-sm font-semibold lg:min-h-[60px] lg:grid-cols-[22px_1fr_auto] lg:rounded-xl lg:border-[1.5px] lg:bg-paper ${
                    on ? "bg-pay-selected lg:border-slate-700" : "lg:border-line"
                  } ${g.disabled ? "cursor-not-allowed text-disabled" : "cursor-pointer"}`}
                >
                  <input
                    type="radio"
                    name="metode-bayar"
                    checked={on}
                    disabled={g.disabled}
                    onChange={() => onChange(toChoice(m))}
                    className="size-5 accent-slate-700 lg:size-[18px]"
                  />
                  <span>{methodName(m)}</span>
                  <span className="flex h-[26px] min-w-14 items-center justify-center rounded-md border border-line bg-paper px-1.5 text-[10px] font-bold text-ink-soft">
                    {m.code}
                  </span>
                </label>
              );
            })}
          </div>
          {g.note && <p className="px-4 pt-1 text-xs text-muted lg:px-0">{g.note}</p>}
        </div>
      ))}
    </fieldset>
  );
}
