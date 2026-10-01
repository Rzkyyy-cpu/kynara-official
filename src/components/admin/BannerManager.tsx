"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteBanner, reorderBanners, saveBanner } from "@/app/admin/banner/actions";
import { ImageField } from "@/components/admin/ImageField";
import { useToast } from "@/components/admin/Toast";
import { PageHeader, cardCls } from "@/components/admin/ui";
import { Alert } from "@/components/form/Alert";
import { ChevronDownIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { BANNER_STATUS, bannerStatus, heroBanner, todayWib } from "@/lib/admin/banner-status";
import type { AdminBanner } from "@/lib/admin/catalog";
import { bannerSchema } from "@/lib/validation/admin-catalog";

// Banner beranda (admin-desktop/06). Daftar di kiri, panel edit + pratinjau di kanan.
// Yang tampil di hero = banner AKTIF paling atas. Maks. 3 banner tayang (dijaga database).

const inputCls = "h-11 w-full rounded-[10px] border border-line-strong bg-paper px-3 text-sm outline-none focus:border-slate";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const dateLabel = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

type Draft = {
  id?: string;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_href: string;
  image_desktop_url: string | null;
  image_mobile_url: string | null;
  starts_at: string;
  ends_at: string;
};
type LinkOption = { value: string; label: string };

export function BannerManager({
  banners,
  categories,
  products,
}: {
  banners: AdminBanner[];
  categories: { name: string; slug: string }[];
  products: { name: string; slug: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const today = todayWib();
  const hero = heroBanner(banners, today);

  const links: { group: string; options: LinkOption[] }[] = [
    { group: "Umum", options: [{ value: "/koleksi", label: "Semua koleksi" }] },
    { group: "Kategori", options: categories.map((c) => ({ value: `/koleksi?kategori=${c.slug}`, label: `Kategori: ${c.name}` })) },
    { group: "Produk", options: products.map((p) => ({ value: `/produk/${p.slug}`, label: `Produk: ${p.name}` })) },
  ];
  const linkLabel = (href: string) => links.flatMap((g) => g.options).find((o) => o.value === href)?.label ?? href;

  const newDraft = (): Draft => ({
    title: "",
    subtitle: "",
    cta_text: "Belanja Sekarang",
    cta_href: "/koleksi",
    image_desktop_url: null,
    image_mobile_url: null,
    starts_at: today,
    ends_at: "",
  });

  function edit(b: AdminBanner) {
    setFormError(null);
    setDraft({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle ?? "",
      cta_text: b.cta_text,
      cta_href: b.cta_href,
      image_desktop_url: b.image_desktop_url,
      image_mobile_url: b.image_mobile_url,
      starts_at: b.starts_at,
      ends_at: b.ends_at ?? "",
    });
  }

  function submit(publish: boolean) {
    if (!draft) return;
    setFormError(null);
    const input = { ...draft, ends_at: draft.ends_at || null, is_published: publish };
    const parsed = bannerSchema.safeParse(input);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message);
      return;
    }
    startTransition(async () => {
      const res = await saveBanner(input);
      if (!res.ok) {
        setFormError(res.error);
        return;
      }
      toast({ title: publish ? `Banner "${draft.title}" ditayangkan` : `Banner "${draft.title}" disimpan sebagai draf` });
      setDraft(null);
      router.refresh();
    });
  }

  function move(index: number, dir: -1 | 1) {
    const ids = banners.map((b) => b.id);
    [ids[index], ids[index + dir]] = [ids[index + dir], ids[index]];
    startTransition(async () => {
      const res = await reorderBanners(ids);
      toast(res.ok ? { title: "Urutan banner disimpan" } : { title: res.error, tone: "error" });
      router.refresh();
    });
  }

  function remove() {
    if (!draft?.id || !window.confirm(`Hapus banner "${draft.title}"?`)) return;
    startTransition(async () => {
      const res = await deleteBanner(draft.id!);
      if (!res.ok) {
        setFormError(res.error);
        return;
      }
      toast({ title: "Banner dihapus" });
      setDraft(null);
      router.refresh();
    });
  }

  const iconBtn = "inline-flex size-9 items-center justify-center rounded-lg hover:bg-bg disabled:opacity-30";

  return (
    <>
      <PageHeader
        title="Banner beranda"
        subtitle="Banner aktif paling atas tampil di hero beranda. Maks. 3 banner tayang."
        action={
          <Button size="sm" className="self-start" onClick={() => (setFormError(null), setDraft(newDraft()))}>
            <PlusIcon size={16} /> Tambah Banner
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-w-0 flex-col gap-3">
          {banners.length === 0 && (
            <div className={`${cardCls} px-5 py-10 text-center text-sm text-muted`}>
              Belum ada banner. Selama kosong, beranda memakai teks hero bawaan.
            </div>
          )}
          {banners.map((b, i) => {
            const s = bannerStatus(b, today);
            const status = BANNER_STATUS[s];
            const when =
              s === "aktif" ? `Tayang sejak ${dateLabel(b.starts_at)}${b.ends_at ? ` sampai ${dateLabel(b.ends_at)}` : ""}`
              : s === "terjadwal" ? `Mulai ${dateLabel(b.starts_at)}`
              : s === "berakhir" ? `Berakhir ${dateLabel(b.ends_at!)}`
              : "Belum ditayangkan";
            return (
              <article
                key={b.id}
                className={`grid grid-cols-[36px_minmax(0,1fr)] items-center gap-3 rounded-card border-[1.5px] bg-paper p-3 sm:grid-cols-[36px_160px_56px_minmax(0,1fr)_auto] sm:gap-4 sm:p-4 ${
                  draft?.id === b.id ? "border-slate" : "border-line"
                }`}
              >
                <div className="row-span-2 flex flex-col sm:row-span-1">
                  <button type="button" disabled={i === 0 || pending} onClick={() => move(i, -1)} aria-label={`Naikkan banner ${b.title}`} className={iconBtn}>
                    <ChevronDownIcon size={16} className="rotate-180" />
                  </button>
                  <button type="button" disabled={i === banners.length - 1 || pending} onClick={() => move(i, 1)} aria-label={`Turunkan banner ${b.title}`} className={iconBtn}>
                    <ChevronDownIcon size={16} />
                  </button>
                </div>
                <Thumb url={b.image_desktop_url} label="Desktop" className="hidden h-[72px] sm:block" />
                <Thumb url={b.image_mobile_url} label="HP" className="hidden h-[70px] sm:block" />
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-[15px]">{b.title}</strong>
                    <span className={`inline-flex h-[22px] items-center rounded-full px-2 text-[11px] font-bold ${status.cls}`}>{status.label}</span>
                    {hero?.id === b.id && <span className="text-[11px] font-bold text-slate-700">● Tampil di beranda</span>}
                  </div>
                  <span className="text-[13px] text-muted">
                    Tombol &quot;{b.cta_text}&quot; → {linkLabel(b.cta_href)}
                  </span>
                  <span className="text-xs text-muted">{when}</span>
                </div>
                <Button size="sm" variant="outline" className="h-9 justify-self-start border-line-strong sm:justify-self-end" onClick={() => edit(b)}>
                  Edit
                </Button>
              </article>
            );
          })}
        </div>

        <section className={`${cardCls} flex flex-col gap-4 p-5 lg:sticky lg:top-6 lg:p-6`}>
          {!draft ? (
            <p className="text-sm text-muted">Pilih &quot;Edit&quot; pada banner, atau tambah banner baru.</p>
          ) : (
            <>
              <h2 className="text-base font-bold">{draft.id ? "Edit banner" : "Tambah banner"}</h2>
              {/* Pratinjau hero */}
              <div className="relative flex h-[180px] flex-col justify-end gap-2 overflow-hidden rounded-input bg-slate-600 p-[18px]">
                {draft.image_desktop_url && <Image src={draft.image_desktop_url} alt="" fill sizes="420px" className="object-cover" />}
                <span className="absolute top-2.5 right-2.5 rounded-full bg-bg/90 px-2 py-0.5 text-[10px] font-bold">Pratinjau</span>
                <span className="relative max-w-[260px] font-serif text-[22px]/7 font-medium text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.25)]">
                  {draft.title || "Judul banner"}
                </span>
                <span className="relative flex h-[30px] items-center self-start rounded-full bg-slate-600 px-3.5 text-xs font-semibold text-white">
                  {draft.cta_text || "Teks tombol"}
                </span>
              </div>

              {formError && <Alert tone="error">{formError}</Alert>}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="bt" className="flex justify-between text-[13px] font-semibold">
                  Judul <span className="font-medium text-muted">{draft.title.length}/48</span>
                </label>
                <input id="bt" value={draft.title} maxLength={48} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={inputCls} />
                <span className="text-xs text-muted">Maks. 48 karakter, 1–2 baris di HP.</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bs" className="text-[13px] font-semibold">
                  Subjudul <span className="font-normal text-muted">(opsional)</span>
                </label>
                <input id="bs" value={draft.subtitle} maxLength={120} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="bc" className="text-[13px] font-semibold">
                    Teks tombol
                  </label>
                  <input id="bc" value={draft.cta_text} maxLength={24} onChange={(e) => setDraft({ ...draft, cta_text: e.target.value })} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="bl" className="text-[13px] font-semibold">
                    Tautan tombol
                  </label>
                  <select id="bl" value={draft.cta_href} onChange={(e) => setDraft({ ...draft, cta_href: e.target.value })} className={inputCls}>
                    {links.map((g) => (
                      <optgroup key={g.group} label={g.group}>
                        {g.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
                <ImageField kind="banner-desktop" label="Gambar desktop" aspect="aspect-[9/4]" value={draft.image_desktop_url} onChange={(url) => setDraft({ ...draft, image_desktop_url: url })} />
                <ImageField kind="banner-hp" label="Gambar HP" value={draft.image_mobile_url} onChange={(url) => setDraft({ ...draft, image_mobile_url: url })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="bm" className="text-[13px] font-semibold">
                    Mulai tayang
                  </label>
                  <input id="bm" type="date" value={draft.starts_at} onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="be" className="text-[13px] font-semibold">
                    Selesai <span className="font-normal text-muted">(opsional)</span>
                  </label>
                  <input id="be" type="date" value={draft.ends_at} min={draft.starts_at} onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="mt-1 flex flex-wrap gap-2.5">
                <Button size="sm" className="grow" loading={pending} onClick={() => submit(true)}>
                  Simpan &amp; Tayangkan
                </Button>
                <Button size="sm" variant="outline" className="border-line-strong" disabled={pending} onClick={() => submit(false)}>
                  Simpan draf
                </Button>
              </div>
              {draft.id && (
                <button type="button" onClick={remove} disabled={pending} className="flex items-center gap-1.5 self-start text-[13px] font-semibold text-error">
                  <TrashIcon size={16} /> Hapus banner
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}

function Thumb({ url, label, className }: { url: string | null; label: string; className: string }) {
  return (
    <span className={`relative overflow-hidden rounded-lg bg-line ${className}`}>
      {url && <Image src={url} alt="" fill sizes="160px" className="object-cover" />}
      <span className="absolute bottom-1 left-1 rounded bg-bg/90 px-1.5 py-0.5 text-[10px] font-bold">{label}</span>
    </span>
  );
}
