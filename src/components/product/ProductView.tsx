"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { ChatIcon, PlaceholderFigure } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { formatRupiah } from "@/lib/format";
import { whatsappUrl } from "@/lib/site";
import {
  colorOptions,
  initialVariant,
  sizeNames,
  stockStatus,
  type VariantOption,
  variantForColor,
  findVariant,
} from "@/lib/variants";

type Img = { url: string; alt: string; color_name: string | null };

// Bagian atas halaman detail produk: galeri + pilihan varian + tombol beli.
// Berjalan di browser karena pilihan warna/ukuran/jumlah berubah saat diklik.
// Konten yang tidak interaktif (deskripsi, dll.) dikirim dari server lewat "children".
export function ProductView({
  productId,
  name,
  material,
  isNew,
  variants,
  images,
  rating,
  children,
}: {
  productId: string;
  name: string;
  material: string;
  isNew: boolean;
  variants: VariantOption[];
  images: Img[];
  rating: { count: number; average: number };
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState(() => initialVariant(variants));
  const [qty, setQty] = useState(1);
  const [photo, setPhoto] = useState(0);
  const cart = useCart();
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);

  const colors = colorOptions(variants);
  const sizes = sizeNames(variants);
  const stock = selected?.stock ?? 0;
  const status = stockStatus(stock);

  // Selama belum ada foto asli, galeri memakai kotak warna: warna terpilih + warna lain
  const slides: { tone: string; img?: Img }[] = images.length
    ? images.map((img) => ({ tone: "#EFE1E2", img }))
    : [selected?.color_hex ?? "#D9C7B0", ...colors.filter((c) => c.name !== selected?.color_name).map((c) => c.hex)]
        .slice(0, 5)
        .map((tone) => ({ tone }));
  const slide = slides[Math.min(photo, slides.length - 1)];

  const addToCart = async () => {
    if (!selected) return;
    setAdding(true);
    const res = await cart.add(selected.id, qty, selected.stock);
    setAdding(false);
    setNotice(
      res === "added"
        ? { tone: "ok", text: `${qty} pcs masuk ke keranjang.` }
        : res === "full"
          ? { tone: "warn", text: "Jumlah di keranjang sudah mencapai stok yang tersedia." }
          : { tone: "warn", text: "Gagal menambahkan ke keranjang. Coba lagi, ya." },
    );
  };

  const pickColor = (color: string) => {
    const v = variantForColor(variants, color, selected?.size_name ?? sizes[0]);
    setSelected(v);
    setQty(1);
    setPhoto(0);
  };
  const pickSize = (size: string) => {
    setSelected(findVariant(variants, selected?.color_name ?? colors[0].name, size));
    setQty(1);
  };

  const waText = encodeURIComponent(
    `Halo kynara, saya mau pesan ${name}${selected ? ` (${selected.color_name} · ${selected.size_name})` : ""} sebanyak ${qty} pcs.`,
  );

  return (
    // grid-cols-1 = minmax(0, 1fr): kolom tidak ikut melebar karena deretan thumbnail yang panjang
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-14">
      {/* ---------- Galeri ---------- */}
      <div className="flex flex-col gap-3 lg:flex-row-reverse lg:gap-4">
        <div
          className="relative aspect-[4/5] flex-1 overflow-hidden rounded-card"
          style={{ background: slide.tone }}
        >
          {slide.img ? (
            <Image src={slide.img.url} alt={slide.img.alt || name} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          ) : (
            <PlaceholderFigure className="absolute bottom-0 left-[20%] h-[78%] w-[60%]" />
          )}
          <span className="absolute right-3 bottom-3 rounded-full bg-paper/90 px-2.5 py-1 text-xs font-semibold">
            {photo + 1}/{slides.length}
          </span>
        </div>
        <div className="flex gap-2.5 overflow-x-auto lg:w-[72px] lg:flex-col">
          {slides.map((s, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Foto ${i + 1}`}
              aria-pressed={i === photo}
              onClick={() => setPhoto(i)}
              className={`relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-input border-2 lg:w-full ${
                i === photo ? "border-ink" : "border-transparent"
              }`}
              style={{ background: s.tone }}
            >
              {s.img ? (
                <Image src={s.img.url} alt="" fill sizes="72px" className="object-cover" />
              ) : (
                <PlaceholderFigure className="absolute bottom-0 left-[20%] h-[70%] w-[60%]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Info & pilihan varian ---------- */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2">
            <span className="inline-flex h-6 items-center rounded-full bg-sky-tint px-2.5 text-xs font-semibold text-slate-900">
              {material}
            </span>
            {isNew && (
              <span className="inline-flex h-6 items-center rounded-full bg-blush px-2.5 text-xs font-semibold text-error">
                Baru
              </span>
            )}
          </div>
          <h1 className="font-serif text-[28px]/9 font-medium lg:text-4xl/[44px]">{name}</h1>
          <p className="text-sm text-muted">
            {rating.count > 0 ? (
              <>
                <span className="text-pink" aria-hidden="true">
                  ★
                </span>{" "}
                <span className="font-semibold text-ink">{rating.average.toFixed(1).replace(".", ",")}</span>{" "}
                <a href="#ulasan" className="underline">
                  {rating.count} ulasan
                </a>
              </>
            ) : (
              "Belum ada ulasan"
            )}
          </p>
          <p className="text-2xl font-bold">{selected ? formatRupiah(selected.price) : "-"}</p>
        </div>

        <hr className="border-line" />

        {/* Warna */}
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm">
            Warna: <span className="font-semibold">{selected?.color_name}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const on = c.name === selected?.color_name;
              return (
                <button
                  key={c.name}
                  type="button"
                  aria-pressed={on}
                  aria-label={`${c.name}${c.soldOut ? ", habis" : ""}`}
                  title={c.name}
                  onClick={() => pickColor(c.name)}
                  className={`relative flex size-11 items-center justify-center rounded-full border-2 ${
                    on ? "border-ink" : "border-transparent"
                  } ${c.soldOut ? "opacity-45" : ""}`}
                >
                  <span className="size-9 rounded-full border border-ink/20" style={{ background: c.hex }} />
                  {/* Garis miring untuk warna yang habis */}
                  {c.soldOut && <span className="absolute h-0.5 w-8 rotate-[-45deg] bg-ink" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Ukuran (disembunyikan kalau produk hanya punya satu ukuran) */}
        {sizes.length > 1 && (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 flex w-full justify-between text-sm">
              Ukuran
            </legend>
            <div className="flex flex-wrap gap-2.5">
              {sizes.map((s) => {
                const v = findVariant(variants, selected?.color_name ?? "", s);
                const on = s === selected?.size_name;
                const n = v?.stock ?? 0;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    disabled={!v}
                    onClick={() => pickSize(s)}
                    className={`flex min-h-12 min-w-28 flex-col items-start justify-center rounded-input border px-3.5 py-2 text-left disabled:opacity-40 ${
                      on ? "border-ink bg-ink text-bg" : "border-line-strong bg-paper"
                    }`}
                  >
                    <span className="text-sm font-semibold">{s}</span>
                    <span className={`text-[11px] ${on ? "text-bg/80" : "text-muted"}`}>
                      {v?.size_detail ? `${v.size_detail} · ` : ""}
                      {!v ? "Tidak tersedia" : n === 0 ? "Habis" : `Stok ${n}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <p
          className={`flex items-center gap-2 text-sm font-semibold ${
            status.tone === "ok" ? "text-slate-700" : status.tone === "low" ? "text-stock-low" : "text-muted"
          }`}
        >
          <span className="size-2 rounded-full bg-current" aria-hidden="true" />
          {status.text}
        </p>

        <div className="flex gap-3">
          {/* Jumlah: minimal 1, maksimal sebanyak stok */}
          <div className="flex h-[52px] items-center rounded-full border border-line-strong bg-paper">
            <button
              type="button"
              aria-label="Kurangi jumlah"
              disabled={qty <= 1}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex size-11 items-center justify-center text-lg disabled:text-disabled"
            >
              −
            </button>
            <span className="w-8 text-center font-semibold" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              aria-label="Tambah jumlah"
              disabled={qty >= stock}
              onClick={() => setQty((q) => Math.min(stock, q + 1))}
              className="flex size-11 items-center justify-center text-lg disabled:text-disabled"
            >
              +
            </button>
          </div>
          <Button className="flex-1" disabled={stock <= 0} loading={adding} onClick={addToCart}>
            {stock <= 0 ? "Stok habis" : "Tambah ke Keranjang"}
          </Button>
          <WishlistButton productId={productId} productName={name} variant="detail" />
        </div>
        {notice && (
          <p
            role="status"
            className={`flex flex-wrap items-center justify-between gap-2 rounded-input px-4 py-3 text-sm ${
              notice.tone === "ok" ? "bg-sky-tint text-slate-900" : "bg-error-bg text-error"
            }`}
          >
            {notice.text}
            {notice.tone === "ok" && (
              <Link href="/keranjang" className="font-semibold text-slate-700 underline">
                Lihat keranjang
              </Link>
            )}
          </p>
        )}

        <Button
          href={`${whatsappUrl}?text=${waText}`}
          variant="outline"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ChatIcon size={18} /> Pesan via WhatsApp
        </Button>

        {children}
      </div>
    </div>
  );
}
