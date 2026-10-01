"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCategory, reorderCategories, saveCategory, setCategoryOnHome } from "@/app/admin/kategori/actions";
import { ImageField } from "@/components/admin/ImageField";
import { Switch } from "@/components/admin/Switch";
import { useToast } from "@/components/admin/Toast";
import { PageHeader, cardCls, thCls } from "@/components/admin/ui";
import { Alert } from "@/components/form/Alert";
import { ChevronDownIcon, EditIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import type { AdminCategory } from "@/lib/admin/catalog";
import { categorySchema, slugify } from "@/lib/validation/admin-catalog";

// Kelola kategori (admin-desktop/05): tabel di kiri, panel edit di kanan (di HP: bertumpuk).
// Urutan = urutan di menu Koleksi & beranda; diubah dengan tombol naik/turun.

const MAX_HOME = 6;
const inputCls = "h-11 w-full rounded-[10px] border border-line-strong bg-paper px-3 text-sm outline-none focus:border-slate";
type Draft = { id?: string; name: string; slug: string; description: string; image_url: string | null; slugTouched: boolean };
const emptyDraft: Draft = { name: "", slug: "", description: "", image_url: null, slugTouched: false };

export function CategoryManager({ categories }: { categories: AdminCategory[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [order, setOrder] = useState(categories.map((c) => c.id));
  const [synced, setSynced] = useState(categories);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [capError, setCapError] = useState(false);

  // Data server berubah (setelah simpan): ikuti urutan terbaru
  if (synced !== categories) {
    setSynced(categories);
    setOrder(categories.map((c) => c.id));
  }

  const byId = new Map(categories.map((c) => [c.id, c]));
  const rows = order.map((id) => byId.get(id)).filter((c): c is AdminCategory => Boolean(c));
  const onHome = categories.filter((c) => c.show_on_home).length;

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string, after?: () => void) {
    startTransition(async () => {
      const res = await action();
      if (res.ok) {
        toast({ title: success });
        after?.();
        router.refresh();
      } else toast({ title: res.error ?? "Gagal menyimpan.", tone: "error" });
    });
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...order];
    [next[index], next[index + dir]] = [next[index + dir], next[index]];
    setOrder(next); // langsung pindah di layar
    run(() => reorderCategories(next), "Urutan kategori disimpan");
  }

  function toggleHome(c: AdminCategory, show: boolean) {
    // Pesan cepat di browser; database tetap menolak kalau ternyata sudah 6 (BERANDA_PENUH)
    if (show && onHome >= MAX_HOME) {
      setCapError(true);
      return;
    }
    setCapError(false);
    run(() => setCategoryOnHome(c.id, show), show ? `${c.name} tampil di beranda` : `${c.name} disembunyikan dari beranda`);
  }

  function edit(c: AdminCategory) {
    setFormError(null);
    setDraft({ id: c.id, name: c.name, slug: c.slug, description: c.description ?? "", image_url: c.image_url, slugTouched: true });
  }

  function submit() {
    if (!draft) return;
    setFormError(null);
    const input = { id: draft.id, name: draft.name, slug: draft.slug, description: draft.description, image_url: draft.image_url };
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message);
      return;
    }
    startTransition(async () => {
      const res = await saveCategory(input);
      if (!res.ok) {
        setFormError(res.error);
        return;
      }
      toast({ title: `Kategori ${draft.name} disimpan` });
      setDraft(null);
      router.refresh();
    });
  }

  function remove(c: AdminCategory) {
    if (c.product_count > 0) {
      toast({ title: `${c.name} masih punya ${c.product_count} produk. Pindahkan produknya dulu.`, tone: "error" });
      return;
    }
    if (!window.confirm(`Hapus kategori ${c.name}?`)) return;
    run(() => deleteCategory(c.id), `Kategori ${c.name} dihapus`, () => draft?.id === c.id && setDraft(null));
  }

  const iconBtn = "inline-flex size-9 items-center justify-center rounded-lg hover:bg-bg disabled:opacity-30";

  return (
    <>
      <PageHeader
        title="Kategori"
        subtitle="Urutan di sini sama dengan urutan di menu Koleksi dan beranda."
        action={
          <Button size="sm" className="self-start" onClick={() => (setFormError(null), setDraft({ ...emptyDraft }))}>
            <PlusIcon size={16} /> Tambah Kategori
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className={`${cardCls} min-w-0 overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
            <span className="text-sm font-semibold">{categories.length} kategori</span>
            <span className={`text-[13px] font-semibold ${onHome >= MAX_HOME ? "text-stock-critical" : "text-slate-900"}`}>
              Tampil di beranda: {onHome}/{MAX_HOME}
            </span>
          </div>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
              <thead className="bg-admin-thead">
                <tr>
                  <th className={`${thCls} w-[84px]`}>
                    <span className="sr-only">Urutan</span>
                  </th>
                  <th className={`${thCls} w-[60px]`}>Foto</th>
                  <th className={thCls}>Nama</th>
                  <th className={thCls}>Slug</th>
                  <th className={thCls}>Produk</th>
                  <th className={thCls}>Beranda</th>
                  <th className={`${thCls} w-[90px]`}>
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c, i) => (
                  <tr key={c.id} className={`border-t border-line-soft ${draft?.id === c.id ? "bg-admin-row-selected" : ""}`}>
                    <td className="px-2 py-2">
                      <div className="flex">
                        <button type="button" disabled={i === 0 || pending} onClick={() => move(i, -1)} aria-label={`Naikkan ${c.name}`} className={iconBtn}>
                          <ChevronDownIcon size={16} className="rotate-180" />
                        </button>
                        <button type="button" disabled={i === rows.length - 1 || pending} onClick={() => move(i, 1)} aria-label={`Turunkan ${c.name}`} className={iconBtn}>
                          <ChevronDownIcon size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-2.5 py-2">
                      <span className="relative block aspect-[4/5] w-10 overflow-hidden rounded-md bg-line">
                        {c.image_url && <Image src={c.image_url} alt="" fill sizes="40px" className="object-cover" />}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 text-sm font-bold">{c.name}</td>
                    <td className="px-2.5 py-2 text-muted">/{c.slug}</td>
                    <td className="px-2.5 py-2">{c.product_count} produk</td>
                    <td className="px-2.5 py-2">
                      <Switch checked={c.show_on_home} disabled={pending} label={`Tampilkan ${c.name} di beranda`} onChange={(next) => toggleHome(c, next)} />
                    </td>
                    <td className="px-2.5 py-2">
                      <div className="flex gap-0.5">
                        <button type="button" onClick={() => edit(c)} aria-label={`Edit ${c.name}`} className={iconBtn}>
                          <EditIcon />
                        </button>
                        <button type="button" disabled={pending} onClick={() => remove(c)} aria-label={`Hapus ${c.name}`} className={`${iconBtn} text-error`}>
                          <TrashIcon size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {capError && (
            <div role="alert" className="m-4 rounded-[10px] bg-admin-row-error px-3.5 py-3 text-[13px] font-semibold text-error">
              Beranda hanya menampilkan 6 kategori. Matikan salah satu dulu sebelum menambah yang lain.
            </div>
          )}
        </div>

        <section className={`${cardCls} flex flex-col gap-4 p-5 lg:sticky lg:top-6 lg:p-6`}>
          {!draft ? (
            <p className="text-sm text-muted">Pilih ikon pensil untuk mengedit kategori, atau tambah kategori baru.</p>
          ) : (
            <>
              <h2 className="text-base font-bold">{draft.id ? "Edit kategori" : "Tambah kategori"}</h2>
              {formError && <Alert tone="error">{formError}</Alert>}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="kn" className="text-[13px] font-semibold">
                  Nama kategori
                </label>
                <input
                  id="kn"
                  value={draft.name}
                  maxLength={50}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.slugTouched ? draft.slug : slugify(e.target.value) })}
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ks" className="text-[13px] font-semibold">
                  Slug (URL)
                </label>
                <input
                  id="ks"
                  value={draft.slug}
                  maxLength={60}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase(), slugTouched: true })}
                  className={inputCls}
                />
                <span className="text-xs text-muted">
                  /koleksi?kategori={draft.slug || "…"}
                  {draft.id && " · Mengubah slug membuat link lama ke kategori ini tidak berlaku."}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="kd" className="flex justify-between text-[13px] font-semibold">
                  Deskripsi singkat <span className="font-medium text-muted">{draft.description.length}/150</span>
                </label>
                <textarea
                  id="kd"
                  rows={3}
                  maxLength={150}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  className={`${inputCls} h-24 resize-y py-2.5`}
                />
              </div>
              <ImageField kind="kategori" label="Foto kategori (4:5)" value={draft.image_url} onChange={(url) => setDraft({ ...draft, image_url: url })} />
              <div className="mt-1 flex gap-2.5">
                <Button size="sm" className="grow" loading={pending} onClick={submit}>
                  Simpan
                </Button>
                <Button size="sm" variant="outline" className="border-line-strong" onClick={() => setDraft(null)}>
                  Batal
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
