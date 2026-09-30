"use client";

// "use client" = komponen ini berjalan di browser, karena butuh state (dropdown & drawer terbuka/tertutup).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRightIcon, BagIcon, ChevronDownIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/icons";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { Container } from "@/components/ui/Container";
import { type NavCategory, categoryHref, mainMenu } from "@/lib/navigation";

export function Navbar({ cartCount, categories }: { cartCount: number; categories: NavCategory[] }) {
  const pathname = usePathname();
  const [koleksiOpen, setKoleksiOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Tutup dropdown Koleksi saat klik di luar navbar atau tekan Esc
  useEffect(() => {
    if (!koleksiOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setKoleksiOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setKoleksiOpen(false);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [koleksiOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const koleksiActive = koleksiOpen || pathname.startsWith("/koleksi");
  const [beranda, ...restMenu] = mainMenu;

  // Garis bawah biru untuk menu aktif (inset shadow, seperti di desain)
  const menuCls = (active: boolean) =>
    `inline-flex h-11 items-center gap-1 px-3.5 text-[15px] font-medium ${
      active ? "text-ink shadow-[inset_0_-2px_0_var(--color-slate)]" : "text-ink-soft hover:text-ink"
    }`;

  return (
    <header ref={headerRef} className="sticky top-0 z-30 border-b border-line bg-bg">
      {/* Jarak tepi di HP lebih kecil dari Container biasa karena ikon sudah punya area sentuh 44px */}
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-1 pr-2 pl-1.5 lg:h-20 lg:gap-14 lg:px-20">
        {/* Hamburger (HP saja) */}
        <button
          type="button"
          aria-label="Buka menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
          className="flex size-11 items-center justify-center rounded-full lg:hidden"
        >
          <MenuIcon size={24} />
        </button>

        <Link href="/" className="font-serif text-[26px] font-medium tracking-[0.01em] lg:text-[30px]">
          kynara
        </Link>

        {/* Menu utama (desktop saja) */}
        <nav aria-label="Menu utama" className="hidden items-center gap-1 lg:flex">
          <Link href={beranda.href} className={menuCls(isActive(beranda.href))}>
            {beranda.label}
          </Link>
          <button
            type="button"
            aria-expanded={koleksiOpen}
            aria-haspopup="true"
            onClick={() => setKoleksiOpen((o) => !o)}
            className={menuCls(koleksiActive)}
          >
            Koleksi <ChevronDownIcon size={16} className={koleksiOpen ? "rotate-180" : ""} />
          </button>
          {restMenu.map((m) => (
            <Link key={m.href} href={m.href} className={menuCls(isActive(m.href))}>
              {m.label}
            </Link>
          ))}
        </nav>

        {/* Ikon kanan */}
        <div className="ml-auto flex items-center gap-0.5 lg:gap-1">
          <Link href="/koleksi" aria-label="Cari produk" className="flex size-11 items-center justify-center rounded-full">
            <SearchIcon />
          </Link>
          <Link
            href="/akun"
            aria-label="Akun saya"
            className="hidden size-11 items-center justify-center rounded-full lg:flex"
          >
            <UserIcon />
          </Link>
          <Link
            href="/keranjang"
            aria-label={`Keranjang, ${cartCount} produk`}
            className="relative flex size-11 items-center justify-center rounded-full"
          >
            <BagIcon />
            {cartCount > 0 && (
              <span className="absolute top-1 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-slate-600 px-[5px] text-[11px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Dropdown Koleksi (desktop) */}
      {koleksiOpen && (
        <div className="absolute inset-x-0 top-full hidden border-b border-line bg-paper shadow-[0_24px_48px_rgba(43,43,43,0.08)] lg:block">
          <Container className="grid grid-cols-3 gap-8 pt-9 pb-10">
            <div className="col-span-2 flex flex-col gap-5">
              <span className="text-eyebrow font-semibold text-slate-700 uppercase">Koleksi</span>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={categoryHref(c.slug)}
                    onClick={() => setKoleksiOpen(false)}
                    className="flex flex-col gap-0.5 rounded-input px-3.5 py-3 hover:bg-bg"
                  >
                    <span className="text-base font-semibold">{c.name}</span>
                    <span className="text-[13px] text-muted">{c.description}</span>
                  </Link>
                ))}
                <Link
                  href="/koleksi"
                  onClick={() => setKoleksiOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-3 text-[15px] font-semibold text-slate-700"
                >
                  Lihat semua koleksi <ArrowRightIcon size={16} />
                </Link>
              </div>
            </div>
            <Link href="/koleksi" onClick={() => setKoleksiOpen(false)} className="flex flex-col gap-3">
              <div className="relative h-60 overflow-hidden rounded-input bg-[#B9C4B2]" />
              <span className="font-serif text-xl font-medium">Koleksi terbaru</span>
              <span className="text-sm font-semibold text-slate-700">Belanja sekarang</span>
            </Link>
          </Container>
        </div>
      )}

      <MobileDrawer open={drawerOpen} onClose={closeDrawer} categories={categories} />
    </header>
  );
}
