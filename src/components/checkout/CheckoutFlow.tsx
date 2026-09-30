"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { type QuoteResult, placeOrder, quoteShipping } from "@/app/(checkout)/checkout/actions";
import type { AddressCardData } from "@/components/account/AddressBook";
import { AddressStep } from "@/components/checkout/AddressStep";
import { CheckoutHeader } from "@/components/checkout/CheckoutHeader";
import { MobileSummary, type SummaryItem, SummaryItems, SummaryLines } from "@/components/checkout/OrderSummary";
import { Alert } from "@/components/form/Alert";
import { Button } from "@/components/ui/Button";
import { formatPhone, formatRupiah } from "@/lib/format";
import { type ShippingRate, etdText } from "@/lib/shipping/types";
import type { ADDRESS_LABELS } from "@/lib/validation/account";

type Quote = Extract<QuoteResult, { ok: true }>;

// Checkout 3 langkah dalam satu halaman. Pilihan pembeli disimpan di state browser,
// sedangkan semua angka dihitung server (quoteShipping & placeOrder).
export function CheckoutFlow({
  items,
  subtotal,
  addresses,
  provinces,
}: {
  items: SummaryItem[];
  subtotal: number;
  addresses: AddressCardData[];
  provinces: [string, string][];
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [choice, setChoice] = useState(() => (addresses.find((a) => a.isDefault) ?? addresses[0])?.id ?? "new");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [rateId, setRateId] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const rate: ShippingRate | undefined = quote?.rates.find((r) => r.id === rateId && r.available);
  // Subtotal terbaru dari server (kalau harga berubah setelah halaman dibuka)
  const currentSubtotal = quote?.subtotal ?? subtotal;

  const go = (s: 1 | 2 | 3) => {
    setError(null);
    setStep(s);
    window.scrollTo({ top: 0 });
  };

  const back = () => {
    if (step === 1) router.push("/keranjang");
    else go((step - 1) as 1 | 2);
  };

  // Langkah 1 -> 2
  const toShipping = () =>
    startTransition(async () => {
      setError(null);
      setFieldErrors({});
      let input: Parameters<typeof quoteShipping>[0];
      if (choice === "new") {
        const f = formRef.current;
        if (!f) return;
        const v = Object.fromEntries(new FormData(f)) as Record<string, string>;
        input = {
          kind: "new",
          save: v.save === "on",
          address: {
            label: v.label as (typeof ADDRESS_LABELS)[number], // divalidasi Zod di server
            recipientName: v.recipientName ?? "",
            phone: v.phone ?? "",
            provinceCode: v.provinceCode ?? "",
            cityCode: v.cityCode ?? "",
            districtCode: v.districtCode ?? "",
            postalCode: v.postalCode ?? "",
            street: v.street ?? "",
            landmark: v.landmark ?? "",
          },
        };
      } else {
        input = { kind: "saved", addressId: choice };
      }

      const res = await quoteShipping(input);
      if (!res.ok) {
        setFieldErrors(res.fieldErrors ?? {});
        setError(res.error ?? (res.fieldErrors ? "Periksa lagi isian alamat yang ditandai merah." : "Terjadi kesalahan."));
        return;
      }
      if (res.addressInput.kind === "saved" && choice === "new") {
        // Alamat baru sudah tersimpan ke buku alamat: muat ulang daftar alamat dari server
        setChoice(res.addressInput.addressId);
        router.refresh();
      }
      setQuote(res);
      const stillValid = res.rates.some((r) => r.id === rateId && r.available);
      if (!stillValid) setRateId(res.rates.find((r) => r.available)?.id ?? null);
      go(2);
    });

  // Langkah 3: buat pesanan
  const submitOrder = () =>
    startTransition(async () => {
      if (!quote || !rate) return;
      setError(null);
      const res = await placeOrder({
        address: quote.addressInput,
        rateId: rate.id,
        expectedTotal: currentSubtotal + rate.cost,
        agree: agree as true,
      });
      // Kalau berhasil, server langsung mengarahkan ke halaman pesanan (redirect), jadi baris ini hanya untuk gagal
      if (res && !res.ok) setError(res.error ?? "Pesanan gagal dibuat.");
    });

  const primary =
    step === 1
      ? { label: "Lanjut ke Pengiriman", onClick: toShipping, disabled: false }
      : step === 2
        ? { label: "Lanjut ke Konfirmasi", onClick: () => go(3), disabled: !rate }
        : { label: "Buat Pesanan", onClick: submitOrder, disabled: !agree || !rate };

  const shipping = step === 1 ? null : (rate?.cost ?? null);
  const barLabel = step === 1 ? "Subtotal" : step === 2 ? "Total sementara" : "Total bayar";
  const backLabel = step === 1 ? "Kembali ke keranjang" : step === 2 ? "Kembali ke alamat" : "Kembali ke pengiriman";

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <CheckoutHeader step={step} onBack={back} />

      <div className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 gap-4 px-5 pt-4 pb-6 lg:grid-cols-[minmax(0,1fr)_424px] lg:items-start lg:gap-12 lg:px-20 lg:pt-12 lg:pb-24">
        <main className="flex min-w-0 flex-col gap-4 lg:gap-6">
          <MobileSummary items={items} subtotal={currentSubtotal} />
          {error && <Alert tone="error">{error}</Alert>}

          {step === 1 && (
            <AddressStep
              addresses={addresses}
              provinces={provinces}
              choice={choice}
              onChoose={(c) => {
                setChoice(c);
                setFieldErrors({});
              }}
              formRef={formRef}
              errors={fieldErrors}
            />
          )}

          {step >= 2 && quote && <AddressCard quote={quote} rate={step === 3 ? rate : undefined} onChange={() => go(1)} />}

          {step === 2 && quote && (
            <section className="flex flex-col gap-3 lg:gap-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <h1 className="text-lg font-bold lg:font-serif lg:text-5xl/[56px] lg:font-medium">Pilih kurir</h1>
                <span className="text-[13px] text-muted lg:text-[15px]">
                  <span className="lg:hidden">Ongkos kirim untuk berat </span>
                  <span className="hidden lg:inline">Berat paket </span>
                  {quote.weightGram} gram
                </span>
              </div>
              <fieldset className="flex flex-col gap-2.5 lg:gap-3">
                <legend className="sr-only">Pilih kurir</legend>
                {quote.rates.map((r) => (
                  <RateOption key={r.id} rate={r} checked={r.id === rateId} onPick={() => setRateId(r.id)} />
                ))}
              </fieldset>
            </section>
          )}

          {step === 3 && (
            <section className="flex flex-col gap-3 lg:gap-4">
              <h1 className="text-lg font-bold lg:font-serif lg:text-5xl/[56px] lg:font-medium">Konfirmasi pesanan</h1>
              <div className="rounded-2xl border border-line bg-paper p-4 lg:p-6">
                <SummaryItems items={items} withPhotos />
              </div>
              <p className="rounded-input bg-sky-tint px-4 py-3 text-sm/[21px] text-slate-900">
                Setelah pesanan dibuat, stok langsung kami simpan untukmu selama <strong>24 jam</strong>. Pilih metode
                pembayaran (transfer bank, e-wallet, atau QRIS) di halaman pesanan.
              </p>
            </section>
          )}
        </main>

        {/* Ringkasan + tombol utama (desktop) */}
        <aside className="sticky top-8 hidden flex-col gap-5 rounded-2xl border border-line bg-paper p-7 lg:flex">
          <h2 className="text-xl font-bold">Ringkasan pesanan</h2>
          <SummaryItems items={items} withPhotos={step === 1} />
          <SummaryLines subtotal={currentSubtotal} shipping={shipping} totalLabel={step === 3 ? "Total bayar" : "Total"} />
          {step === 3 && <AgreeBox checked={agree} onChange={setAgree} />}
          <Button fullWidth loading={pending} disabled={primary.disabled} onClick={primary.onClick}>
            {primary.label}
          </Button>
          <button type="button" onClick={back} className="min-h-11 text-[15px] font-semibold text-slate-700">
            {backLabel}
          </button>
        </aside>

        {step === 3 && (
          <div className="lg:hidden">
            <AgreeBox checked={agree} onChange={setAgree} />
          </div>
        )}
      </div>

      {/* Bar bawah (HP) */}
      <div className="sticky bottom-0 z-20 flex items-center justify-between gap-3 border-t border-line bg-paper px-5 pt-3 pb-5 lg:hidden">
        <div className="flex flex-col">
          <span className="text-xs text-muted">{barLabel}</span>
          <strong className="text-lg">{formatRupiah(currentSubtotal + (shipping ?? 0))}</strong>
        </div>
        <Button
          className="max-w-[220px] flex-1 px-4"
          loading={pending}
          disabled={primary.disabled}
          onClick={primary.onClick}
        >
          {primary.label}
        </Button>
      </div>
    </div>
  );
}

function AddressCard({ quote, rate, onChange }: { quote: Quote; rate?: ShippingRate; onChange: () => void }) {
  const a = quote.address;
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-4 lg:px-8 lg:py-6">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-eyebrow font-bold text-slate-700 uppercase">Dikirim ke · {a.label}</span>
        <span className="text-[15px] font-semibold lg:text-base">
          {a.name} · {formatPhone(a.phone)}
        </span>
        <span className="text-sm/[21px] text-muted">{a.text}</span>
        {rate && (
          <span className="text-sm text-muted">
            {rate.label}
            {rate.etd ? ` · ${etdText(rate).toLowerCase()}` : ""}
          </span>
        )}
      </div>
      <button type="button" onClick={onChange} className="min-h-11 shrink-0 text-[15px] font-semibold text-slate-700">
        Ubah
      </button>
    </div>
  );
}

function RateOption({ rate, checked, onPick }: { rate: ShippingRate; checked: boolean; onPick: () => void }) {
  const etd = etdText(rate);
  return (
    <label
      className={`grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border-[1.5px] bg-paper px-4 py-4 lg:px-7 lg:py-5 ${
        !rate.available ? "cursor-not-allowed border-line opacity-60" : checked ? "cursor-pointer border-slate-900" : "cursor-pointer border-line"
      }`}
    >
      <input
        type="radio"
        name="rate"
        checked={checked}
        disabled={!rate.available}
        onChange={onPick}
        className="size-5 accent-slate-700"
      />
      <span className="flex flex-col">
        <span className="text-[15px] font-semibold lg:text-base">{rate.label}</span>
        <span className="text-[13px] text-muted lg:text-sm">{etd}</span>
      </span>
      <span className="text-[15px] font-bold lg:text-base">{rate.available ? formatRupiah(rate.cost) : "–"}</span>
    </label>
  );
}

function AgreeBox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer gap-3 text-sm/[21px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-5 shrink-0 accent-slate-700"
      />
      <span>
        Data pesanan sudah benar dan saya setuju dengan{" "}
        <Link href="/kebijakan-retur" className="text-slate-700 underline" target="_blank">
          kebijakan retur
        </Link>
        .
      </span>
    </label>
  );
}
