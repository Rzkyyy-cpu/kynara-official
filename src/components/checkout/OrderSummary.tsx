"use client";

import { useState } from "react";
import { CartThumb } from "@/components/cart/CartThumb";
import { ChevronDownIcon } from "@/components/icons";
import { formatRupiah } from "@/lib/format";

export type SummaryItem = {
  variantId: string;
  productName: string;
  variantText: string;
  colorHex: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
};

// Baris angka ringkasan: subtotal, ongkir, total. Angka ini hanya TAMPILAN;
// yang benar-benar ditagih dihitung ulang server saat pesanan dibuat.
export function SummaryLines({
  subtotal,
  shipping,
  totalLabel = "Total",
}: {
  subtotal: number;
  shipping: number | null; // null = belum dipilih
  totalLabel?: string;
}) {
  return (
    <>
      <div className="flex flex-col gap-3 border-t border-line pt-4 text-[15px]">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <span>{formatRupiah(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Ongkos kirim</span>
          <span className={shipping === null ? "text-muted" : ""}>
            {shipping === null ? "Dipilih di langkah 2" : formatRupiah(shipping)}
          </span>
        </div>
      </div>
      <div className="flex items-baseline justify-between border-t border-line pt-4">
        <span className="text-lg font-bold">{totalLabel}</span>
        <span className="text-xl font-bold">{formatRupiah(subtotal + (shipping ?? 0))}</span>
      </div>
    </>
  );
}

// Daftar produk: dengan foto (langkah 1) atau ringkas "Nama × 2" (langkah 2 & 3), sesuai desain
export function SummaryItems({ items, withPhotos }: { items: SummaryItem[]; withPhotos: boolean }) {
  if (!withPhotos) {
    return (
      <ul className="flex flex-col gap-3 text-[15px]">
        {items.map((it) => (
          <li key={it.variantId} className="flex justify-between gap-3">
            <span className="text-muted">
              {it.productName} × {it.quantity}
            </span>
            <span>{formatRupiah(it.price * it.quantity)}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="flex flex-col gap-4">
      {items.map((it) => (
        <li key={it.variantId} className="flex items-center gap-4">
          <CartThumb imageUrl={it.imageUrl} tone={it.colorHex} alt={it.productName} className="w-12" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[15px] font-semibold">{it.productName}</span>
            <span className="text-[13px] text-muted">
              {it.variantText} · ×{it.quantity}
            </span>
          </div>
          <span className="text-[15px]">{formatRupiah(it.price * it.quantity)}</span>
        </li>
      ))}
    </ul>
  );
}

// Ringkasan yang bisa dibuka-tutup di HP
export function MobileSummary({ items, subtotal }: { items: SummaryItem[]; subtotal: number }) {
  const [open, setOpen] = useState(false);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  return (
    <div className="flex flex-col gap-2 lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between rounded-2xl border border-line bg-paper px-4 py-3.5 text-left text-sm font-semibold"
      >
        <span>Ringkasan pesanan · {count} produk</span>
        <span className="flex items-center gap-1.5">
          {formatRupiah(subtotal)}
          <ChevronDownIcon size={16} className={open ? "rotate-180" : ""} />
        </span>
      </button>
      {open && (
        <ul className="rounded-2xl border border-line bg-paper px-4 py-2 text-[13px]">
          {items.map((it) => (
            <li key={it.variantId} className="flex min-h-9 items-center justify-between gap-3">
              <span>
                {it.productName} × {it.quantity}
              </span>
              <span>{formatRupiah(it.price * it.quantity)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
