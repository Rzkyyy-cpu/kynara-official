"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProduct, setProductActive } from "@/app/admin/produk/actions";
import { Switch } from "@/components/admin/Switch";
import { useToast } from "@/components/admin/Toast";
import { EditIcon, TrashIcon } from "@/components/icons";

// Toggle "Tampil" dan tombol edit/hapus di tabel produk (admin-desktop/03).

export function ProductActiveSwitch({ id, name, active }: { id: string; name: string; active: boolean }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [on, setOn] = useState(active);

  return (
    <Switch
      checked={on}
      disabled={pending}
      label={`Tampilkan ${name} di toko`}
      onChange={(next) => {
        setOn(next); // langsung berubah di layar (optimistis), dikembalikan kalau gagal
        startTransition(async () => {
          const res = await setProductActive(id, next);
          if (res.ok) toast({ title: next ? `${name} tampil di toko` : `${name} disembunyikan` });
          else {
            setOn(!next);
            toast({ title: res.error, tone: "error" });
          }
        });
      }}
    />
  );
}

export function ProductRowActions({ id, name }: { id: string; name: string }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-0.5">
      <Link href={`/admin/produk/${id}`} aria-label={`Edit ${name}`} className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-bg">
        <EditIcon />
      </Link>
      <button
        type="button"
        aria-label={`Hapus ${name}`}
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Hapus ${name}? Semua varian dan fotonya ikut terhapus.`)) return;
          startTransition(async () => {
            const res = await deleteProduct(id);
            toast(res.ok ? { title: `${name} dihapus` } : { title: res.error, tone: "error" });
            if (res.ok) router.refresh();
          });
        }}
        className="inline-flex size-9 items-center justify-center rounded-lg text-error hover:bg-bg disabled:opacity-50"
      >
        <TrashIcon size={18} />
      </button>
    </div>
  );
}
