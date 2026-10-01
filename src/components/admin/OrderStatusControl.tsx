"use client";

import { useRef, useState, useTransition } from "react";
import { updateOrderStatus } from "@/app/admin/pesanan/actions";
import { useToast } from "@/components/admin/Toast";
import { NEXT_STATUS, type OrderStatus, canEditTracking } from "@/lib/admin/order-rules";
import { waNumber } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/order-status";

// Ubah status + nomor resi langsung dari tabel (admin-desktop/02).
//  - Dropdown hanya berisi status sekarang dan status berikutnya yang diizinkan.
//  - Memilih "Dikirim" tanpa resi: belum disimpan, kolom resi ditandai wajib dulu.
//  - Resi disimpan saat kolom ditinggalkan (blur) atau tekan Enter.
//  - Membatalkan pesanan minta konfirmasi, karena stok dikembalikan dan tidak bisa diulang.
// Aturan sebenarnya tetap dijaga database (admin_update_order); ini hanya memandu.

type Props = {
  orderNumber: string;
  status: OrderStatus;
  tracking: string | null;
  paid: boolean;
  buyer: { name: string; phone: string };
  layout?: "cells" | "stack"; // cells = dua <td> di tabel, stack = bertumpuk di halaman detail
};

export function OrderStatusControl({ orderNumber, status, tracking, paid, buyer, layout = "cells" }: Props) {
  const toast = useToast();
  const resiRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState(status);
  const [resi, setResi] = useState(tracking ?? "");
  const [error, setError] = useState<string | null>(null);

  // Data dari server berubah (setelah simpan / refresh): samakan isian dengan data terbaru
  const [synced, setSynced] = useState({ status, tracking });
  if (synced.status !== status || synced.tracking !== tracking) {
    setSynced({ status, tracking });
    setSelected(status);
    setResi(tracking ?? "");
  }

  const options = [status, ...NEXT_STATUS[status]];
  const editableResi = canEditTracking(status);
  const needResi = selected === "dikirim" && !resi.trim();

  function save(next: OrderStatus, nextResi: string) {
    setError(null);
    startTransition(async () => {
      const res = await updateOrderStatus({ nomor: orderNumber, status: next, resi: nextResi });
      if (!res.ok) {
        setError(res.error);
        setSelected(status);
        return;
      }
      const label = ORDER_STATUS[next].label;
      const wa = waNumber(buyer.phone);
      const text =
        next === "dikirim"
          ? `Halo ${buyer.name}, pesanan kynara ${orderNumber} sudah dikirim dengan nomor resi ${nextResi.trim()}. Terima kasih sudah belanja!`
          : `Halo ${buyer.name}, status pesanan kynara ${orderNumber} sekarang: ${label}.`;
      toast({
        title: next === status ? `Nomor resi ${orderNumber} disimpan` : `${orderNumber} diubah ke ${label}`,
        waUrl: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(text)}` : null,
      });
    });
  }

  function onSelect(next: OrderStatus) {
    setError(null);
    setSelected(next);
    if (next === status) return;
    if (next === "dikirim" && !resi.trim()) {
      resiRef.current?.focus();
      return; // disimpan setelah resi diisi
    }
    if (next === "dibatalkan") {
      const msg = paid
        ? `Batalkan ${orderNumber}? Pesanan ini SUDAH DIBAYAR: stok dikembalikan dan dana pembeli harus di-refund manual.`
        : `Batalkan ${orderNumber}? Stok dikembalikan dan pembeli tidak bisa membayar lagi.`;
      if (!window.confirm(msg)) {
        setSelected(status);
        return;
      }
    }
    save(next, resi);
  }

  function commitResi() {
    if (!editableResi || pending) return;
    if (selected === "dikirim" && status === "diproses") {
      if (resi.trim()) save("dikirim", resi);
      return;
    }
    if (resi.trim() !== (tracking ?? "")) save(selected, resi);
  }

  const select = (
    <select
      aria-label={`Status ${orderNumber}`}
      value={selected}
      disabled={pending || options.length === 1}
      onChange={(e) => onSelect(e.target.value as OrderStatus)}
      className={`h-10 w-full rounded-[10px] border-0 px-2.5 text-[13px] font-semibold disabled:opacity-100 ${ORDER_STATUS[selected].cls} ${
        pending ? "animate-pulse" : ""
      }`}
    >
      {options.map((s) => (
        <option key={s} value={s}>
          {ORDER_STATUS[s].label}
        </option>
      ))}
    </select>
  );

  const resiInput = (
    <>
      <input
        ref={resiRef}
        aria-label={`Nomor resi ${orderNumber}`}
        aria-invalid={needResi || undefined}
        value={resi}
        disabled={!editableResi || pending}
        placeholder={editableResi ? "Isi nomor resi" : "—"}
        maxLength={40}
        onChange={(e) => setResi(e.target.value)}
        onBlur={commitResi}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitResi();
          }
        }}
        className={`h-10 w-full rounded-[10px] border bg-paper px-3 text-[13px] font-medium outline-none placeholder:text-muted focus:border-slate disabled:bg-paper ${
          needResi ? "border-error-field" : "border-line-strong"
        }`}
      />
      {needResi && <p className="mt-0.5 text-[11px] font-semibold text-error-field">Wajib untuk status Dikirim</p>}
      {error && (
        <p role="alert" className="mt-0.5 text-[11px] font-semibold text-error-field">
          {error}
        </p>
      )}
    </>
  );

  if (layout === "stack") {
    return (
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
          Status
          {select}
        </label>
        <div className="flex flex-col gap-1.5 text-[13px] font-semibold">
          Nomor resi
          <div className="font-normal">{resiInput}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <td className={`w-[190px] px-2.5 py-3 align-middle ${needResi ? "bg-admin-row-error" : ""}`}>{select}</td>
      <td className={`w-[200px] px-2.5 py-3 align-middle ${needResi ? "bg-admin-row-error" : ""}`}>{resiInput}</td>
    </>
  );
}
