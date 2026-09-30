"use client";

import { useState, useTransition } from "react";
import { deleteAddress, setDefaultAddress } from "@/app/(toko)/akun/actions";
import { AddressForm, type AddressFormValues } from "@/components/account/AddressForm";
import { Alert } from "@/components/form/Alert";
import { PinIcon, PlusIcon } from "@/components/icons";
import { formatPhone } from "@/lib/format";

export type AddressCardData = AddressFormValues & { id: string; fullText: string };

// Buku alamat: daftar kartu alamat (2 kolom di desktop, 1 kolom di HP) + form tambah/ubah.
// Dipakai di halaman Profil & alamat (desktop) dan halaman Alamat (HP).
export function AddressBook({
  addresses,
  provinces,
  max,
}: {
  addresses: AddressCardData[];
  provinces: [string, string][];
  max: number;
}) {
  // editing: null = form tertutup, "new" = tambah alamat, atau id alamat yang sedang diubah
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const done = (text: string) => {
    setEditing(null);
    setMessage({ tone: "success", text });
  };

  function remove(a: AddressCardData) {
    if (!confirm(`Hapus alamat "${a.label}"?`)) return;
    startTransition(async () => {
      const res = await deleteAddress(a.id);
      setMessage(res.ok ? { tone: "success", text: "Alamat dihapus." } : { tone: "error", text: "Gagal menghapus alamat." });
    });
  }

  function makeDefault(a: AddressCardData) {
    startTransition(async () => {
      const res = await setDefaultAddress(a.id);
      setMessage(
        res.ok ? { tone: "success", text: `${a.label} jadi alamat utama.` } : { tone: "error", text: "Gagal mengubah alamat utama." },
      );
    });
  }

  const form = (initial?: AddressFormValues) => (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <h3 className="mb-4 text-lg font-bold">{initial ? "Ubah alamat" : "Alamat baru"}</h3>
      <AddressForm
        key={initial?.id ?? "new"}
        initial={initial}
        provinces={provinces}
        onDone={done}
        onCancel={() => setEditing(null)}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-4" aria-busy={pending || undefined}>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      {addresses.length === 0 && editing === null && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <PinIcon size={18} /> Belum ada alamat tersimpan.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {addresses.map((a) =>
          editing === a.id ? (
            <div key={a.id} className="lg:col-span-2">
              {form(a)}
            </div>
          ) : (
            <article
              key={a.id}
              className={`flex flex-col gap-1.5 rounded-card bg-paper p-5 ${
                a.isDefault ? "border-[1.5px] border-slate" : "border border-line"
              }`}
            >
              <div className="flex items-center gap-2">
                <strong className="text-[15px]">{a.label}</strong>
                {a.isDefault && (
                  <span className="inline-flex h-[22px] items-center rounded-full bg-sky-tint px-2 text-[11px] font-bold text-status-kirim">
                    Utama
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold">
                {a.recipientName} · {formatPhone(a.phone)}
              </span>
              <p className="text-sm/[21px] text-muted">{a.fullText}</p>
              {a.landmark && <p className="text-[13px] text-muted">Patokan: {a.landmark}</p>}
              <div className="-ml-1 flex flex-wrap gap-3">
                <button type="button" onClick={() => setEditing(a.id)} className="h-10 px-1 text-sm font-semibold text-slate-700">
                  Ubah
                </button>
                <button
                  type="button"
                  onClick={() => remove(a)}
                  disabled={pending}
                  className="h-10 px-1 text-sm font-semibold text-error"
                >
                  Hapus
                </button>
                {!a.isDefault && (
                  <button
                    type="button"
                    onClick={() => makeDefault(a)}
                    disabled={pending}
                    className="h-10 px-1 text-sm font-semibold text-slate-700"
                  >
                    Jadikan utama
                  </button>
                )}
              </div>
            </article>
          ),
        )}
      </div>

      {editing === "new"
        ? form()
        : addresses.length < max && (
            <button
              type="button"
              onClick={() => {
                setMessage(null);
                setEditing("new");
              }}
              className="flex h-14 items-center justify-center gap-2 rounded-card border border-dashed border-line-strong text-[15px] font-semibold"
            >
              <PlusIcon size={18} /> Tambah alamat baru
            </button>
          )}
    </div>
  );
}
