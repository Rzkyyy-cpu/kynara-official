"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type LoadedCart, loadCart } from "@/app/(toko)/keranjang/actions";
import { useAuth } from "@/components/auth/AuthProvider";
import { CartThumb } from "@/components/cart/CartThumb";
import { useCart } from "@/components/cart/CartProvider";
import { QtyStepper } from "@/components/cart/QtyStepper";
import { Alert } from "@/components/form/Alert";
import { BagIcon, ChatIcon, ChevronLeftIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import type { CartItemView } from "@/lib/cart/server";
import { calcTotals } from "@/lib/cart/totals";
import { formatRupiah } from "@/lib/format";
import { whatsappUrl } from "@/lib/site";

// Halaman Keranjang (desktop-belanja/04 & mobile-belanja/06).
// Isi keranjang (id + jumlah) dari CartProvider; harga & stok selalu diambil ulang dari server (loadCart).

type Row = { variantId: string; quantity: number; item: CartItemView | undefined };

const variantText = (it: CartItemView) => `${it.colorName} · ${it.sizeDetail ?? it.sizeName}`;

export function CartView() {
  const cart = useCart();
  const [loaded, setLoaded] = useState<LoadedCart | null>(null);
  const [failed, setFailed] = useState(false);
  const [notices, setNotices] = useState<string[]>([]);

  // Ambil ulang detail hanya saat DAFTAR varian berubah (bukan setiap jumlah berubah)
  const idsKey = cart.lines
    .map((l) => l.variantId)
    .sort()
    .join(",");

  useEffect(() => {
    if (!cart.ready) return;
    let cancelled = false;
    loadCart(cart.lines)
      .then((res) => {
        if (cancelled) return;
        if (!res) {
          setFailed(true);
          return;
        }
        setFailed(false);
        setLoaded(res);
        // Stok berkurang sejak barang dimasukkan: jumlah disesuaikan otomatis dan pembeli diberi tahu
        const msgs: string[] = [];
        for (const issue of res.issues) {
          const it = res.items[issue.variantId];
          if (issue.kind === "reduced" && it) {
            msgs.push(`Stok ${it.productName} (${variantText(it)}) tinggal ${issue.to}. Jumlahnya kami sesuaikan.`);
            void cart.setQuantity(issue.variantId, issue.to, it.stock);
          }
        }
        setNotices(msgs);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
    // cart.lines & cart.setQuantity sengaja tidak ikut: cukup dipicu saat daftar varian berubah
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.ready, idsKey]);

  if (!cart.ready || (!loaded && !failed && cart.lines.length > 0)) return <CartSkeleton />;

  if (cart.lines.length === 0) return <EmptyCart />;

  if (failed || !loaded) {
    return (
      <Container className="py-10">
        <Alert tone="error">Keranjang gagal dimuat. Periksa koneksi internet, lalu muat ulang halaman.</Alert>
      </Container>
    );
  }

  const rows: Row[] = cart.lines.map((l) => ({ ...l, item: loaded.items[l.variantId] }));
  const available = rows.filter((r): r is Row & { item: CartItemView } => !!r.item && r.item.stock > 0);
  const hasUnavailable = available.length < rows.length;
  const totals = calcTotals(available.map((r) => ({ price: r.item.price, quantity: r.quantity, weightGram: r.item.weightGram })));

  const waText = encodeURIComponent(
    [
      "Halo kynara, saya mau pesan:",
      ...available.map((r) => `- ${r.item.productName} (${variantText(r.item)}) × ${r.quantity}`),
      `Subtotal: ${formatRupiah(totals.subtotal)}`,
    ].join("\n"),
  );
  const waHref = `${whatsappUrl}?text=${waText}`;
  const canCheckout = available.length > 0 && !hasUnavailable;

  return (
    <>
      <Container className="grid grid-cols-1 gap-4 pt-5 pb-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-12 lg:pt-12">
        <div className="flex flex-col gap-4 lg:gap-6">
          <div className="flex items-baseline gap-2.5 lg:gap-4">
            <h1 className="font-serif text-[30px]/[38px] font-medium lg:text-[44px]/[52px]">Keranjang</h1>
            <span className="text-sm text-muted lg:text-base">{totals.itemCount} produk</span>
          </div>

          {notices.map((n) => (
            <Alert key={n} tone="error">
              {n}
            </Alert>
          ))}
          {hasUnavailable && (
            <Alert tone="error">Ada produk yang stoknya habis. Hapus dulu dari keranjang untuk melanjutkan checkout.</Alert>
          )}

          <div className="rounded-2xl border border-line bg-paper px-4 lg:px-7">
            {/* Judul kolom (desktop) */}
            <div className="hidden h-[52px] grid-cols-[minmax(0,1fr)_150px_150px_44px] items-center gap-6 border-b border-line text-xs font-semibold tracking-[0.08em] text-ink-soft uppercase lg:grid">
              <span>Produk</span>
              <span>Jumlah</span>
              <span className="text-right">Subtotal</span>
              <span />
            </div>

            {rows.map((r) => (
              <CartRow key={r.variantId} row={r} />
            ))}

            <Link
              href="/koleksi"
              className="flex min-h-[52px] items-center gap-1.5 text-sm font-semibold text-slate-700 lg:min-h-16 lg:text-[15px]"
            >
              <PlusIcon size={16} className="lg:hidden" />
              <ChevronLeftIcon size={16} className="hidden lg:block" />
              <span className="lg:hidden">Tambah produk lain</span>
              <span className="hidden lg:inline">Lanjut belanja</span>
            </Link>
          </div>

          {/* Ringkasan (HP) */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-paper p-4 text-sm lg:hidden">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{formatRupiah(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Ongkos kirim</span>
              <span className="text-muted">Dihitung saat checkout</span>
            </div>
          </div>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-slate-700 lg:hidden"
          >
            <ChatIcon size={18} /> Lebih nyaman pesan via WhatsApp?
          </a>
        </div>

        {/* Ringkasan (desktop) */}
        <aside className="sticky top-[104px] mt-[76px] hidden flex-col gap-5 rounded-2xl border border-line bg-paper p-7 lg:flex">
          <h2 className="text-lg font-bold">Ringkasan belanja</h2>
          <div className="flex flex-col gap-3 text-[15px]">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal ({totals.itemCount} produk)</span>
              <span>{formatRupiah(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Ongkos kirim</span>
              <span className="text-muted">Dihitung saat checkout</span>
            </div>
          </div>
          <div className="h-px bg-line" />
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-2xl font-bold">{formatRupiah(totals.subtotal)}</span>
          </div>
          <CheckoutButton enabled={canCheckout} fullWidth>
            Lanjut ke Checkout
          </CheckoutButton>
          <Button href={waHref} variant="outline" fullWidth target="_blank" rel="noopener noreferrer">
            <ChatIcon size={20} /> Pesan via WhatsApp
          </Button>
          <p className="text-center text-[13px]/5 text-muted">Bayar dengan transfer bank, e-wallet, atau QRIS.</p>
        </aside>
      </Container>

      {/* Bar total + Checkout (HP), menempel di atas bottom nav */}
      <div className="sticky bottom-16 z-20 flex items-center justify-between gap-3 border-t border-line bg-paper px-5 py-3 lg:hidden">
        <div className="flex flex-col">
          <span className="text-xs text-muted">Total</span>
          <span className="text-lg font-bold">{formatRupiah(totals.subtotal)}</span>
        </div>
        <CheckoutButton enabled={canCheckout} className="max-w-[210px] flex-1">
          Checkout
        </CheckoutButton>
      </div>
    </>
  );
}

function CheckoutButton({
  enabled,
  children,
  ...rest
}: { enabled: boolean; children: React.ReactNode; fullWidth?: boolean; className?: string }) {
  // Tamu diminta masuk dulu, lalu kembali ke KERANJANG (bukan langsung checkout), karena keranjang tamu
  // di browser baru digabung ke database oleh CartProvider di halaman toko.
  const { user } = useAuth();
  return enabled ? (
    <Button href={user ? "/checkout" : "/masuk?next=/keranjang"} {...rest}>
      {children}
    </Button>
  ) : (
    <Button disabled {...rest}>
      {children}
    </Button>
  );
}

function CartRow({ row }: { row: Row }) {
  const cart = useCart();
  const it = row.item;
  const soldOut = !it || it.stock <= 0;
  const name = it?.productName ?? "Produk tidak tersedia";
  const remove = (
    <button
      type="button"
      aria-label={`Hapus ${name}`}
      onClick={() => cart.remove(row.variantId)}
      className="-mt-2 -mr-2 flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-bg lg:m-0 lg:size-11"
    >
      <TrashIcon size={20} />
    </button>
  );
  const sub = it ? formatRupiah(it.price * row.quantity) : "–";
  const stepper = soldOut ? (
    <span className="text-sm font-semibold text-stock-low">Stok habis</span>
  ) : (
    <QtyStepper
      value={row.quantity}
      max={it.stock}
      label={name}
      onChange={(q) => cart.setQuantity(row.variantId, q, it.stock)}
      className="lg:w-[136px]"
    />
  );

  return (
    <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-3.5 border-b border-line py-4 lg:grid-cols-[minmax(0,1fr)_150px_150px_44px] lg:items-center lg:gap-6 lg:py-5">
      {/* Foto + nama */}
      <div className="contents lg:flex lg:items-center lg:gap-5">
        <CartThumb
          imageUrl={it?.imageUrl ?? null}
          tone={it?.colorHex ?? "#EFE1E2"}
          alt={name}
          className={`w-20 lg:w-24 ${soldOut ? "opacity-50" : ""}`}
        />
        <div className="flex min-w-0 flex-col gap-1 lg:gap-1.5">
          <div className="flex justify-between gap-2">
            {it ? (
              <Link href={`/produk/${it.productSlug}`} className="text-sm/5 font-semibold text-ink lg:text-base">
                {it.productName}
              </Link>
            ) : (
              <span className="text-sm/5 font-semibold text-muted lg:text-base">{name}</span>
            )}
            <span className="lg:hidden">{remove}</span>
          </div>
          {it && <span className="text-[13px] text-muted lg:text-sm">{variantText(it)}</span>}
          {it && <span className="hidden text-sm lg:block">{formatRupiah(it.price)}</span>}
          {/* Jumlah + subtotal (HP) */}
          <div className="mt-1.5 flex items-center justify-between lg:hidden">
            {stepper}
            <span className="text-[15px] font-bold">{sub}</span>
          </div>
        </div>
      </div>
      <div className="hidden lg:block">{stepper}</div>
      <span className="hidden text-right font-bold lg:block">{sub}</span>
      <span className="hidden lg:block">{remove}</span>
    </div>
  );
}

function EmptyCart() {
  return (
    <section className="flex flex-col items-center gap-3.5 px-8 py-24 text-center lg:gap-4 lg:py-30">
      <span className="flex size-[88px] items-center justify-center rounded-full bg-sky-tint text-slate-700 lg:size-24">
        <BagIcon size={40} />
      </span>
      <h1 className="font-serif text-[26px]/[34px] font-medium lg:text-4xl/[44px]">Keranjangmu masih kosong</h1>
      <p className="max-w-[420px] text-[15px]/6 text-muted lg:text-base/[26px]">
        Simpan dulu produk yang kamu suka di sini, lalu checkout kapan pun kamu siap.
      </p>
      <Button href="/koleksi" className="mt-2 w-full lg:w-auto">
        Mulai Belanja
      </Button>
    </section>
  );
}

export function CartSkeleton() {
  return (
    <Container className="grid grid-cols-1 gap-4 pt-5 pb-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12 lg:pt-12">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-48" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3.5">
            <Skeleton className="aspect-[4/5] w-20 rounded-photo lg:w-24" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="mt-2 h-11 w-32 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="hidden h-80 rounded-2xl lg:block" />
    </Container>
  );
}
