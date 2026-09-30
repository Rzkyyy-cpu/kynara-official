"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChatIcon, ChevronDownIcon, CloseIcon, SearchIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { type NavCategory, categoryHref, mainMenu } from "@/lib/navigation";
import { whatsappUrl } from "@/lib/site";

// Menu samping untuk HP (mobile-belanja/02-menu-drawer).
export function MobileDrawer({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: NavCategory[];
}) {
  const [koleksiOpen, setKoleksiOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    // Kunci scroll halaman di belakang drawer, fokuskan tombol tutup, dan tutup dengan Esc
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const [beranda, ...restMenu] = mainMenu;
  const itemCls =
    "flex min-h-[52px] w-full items-center justify-between px-5 text-[17px] font-semibold text-ink";

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Latar gelap; klik untuk menutup */}
      <button type="button" aria-label="Tutup menu" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-ink/50" />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="absolute inset-y-0 left-0 flex w-[330px] max-w-[85vw] flex-col overflow-y-auto bg-paper shadow-[12px_0_40px_rgba(43,43,43,0.18)]"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line pr-2 pl-5">
          <span className="font-serif text-[26px] font-medium">kynara</span>
          <button
            ref={closeRef}
            type="button"
            aria-label="Tutup menu"
            onClick={onClose}
            className="flex size-11 items-center justify-center"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Pencarian: dikirim ke halaman Koleksi sebagai ?q=... (halamannya dibuat di Fase 2) */}
        <form action="/koleksi" onSubmit={onClose} className="mx-5 my-4">
          <label className="flex h-12 items-center gap-2.5 rounded-full border border-line-strong px-4 text-muted focus-within:border-slate">
            <SearchIcon size={20} />
            <input
              type="search"
              name="q"
              aria-label="Cari produk"
              placeholder="Cari pashmina, bergo…"
              className="w-full bg-transparent text-[15px] text-ink outline-none"
            />
          </label>
        </form>

        <nav aria-label="Menu utama" className="flex flex-col">
          <Link href={beranda.href} onClick={onClose} className={itemCls}>
            {beranda.label}
          </Link>
          <button
            type="button"
            aria-expanded={koleksiOpen}
            onClick={() => setKoleksiOpen((o) => !o)}
            className={`${itemCls} ${koleksiOpen ? "text-slate-700" : ""}`}
          >
            Koleksi <ChevronDownIcon className={koleksiOpen ? "rotate-180" : ""} />
          </button>
          {koleksiOpen && (
            <div className="flex flex-col pb-2">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={categoryHref(c.slug)}
                  onClick={onClose}
                  className="flex min-h-11 items-center pr-5 pl-9 text-[15px] text-ink-soft"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
          {restMenu.map((m) => (
            <Link key={m.href} href={m.href} onClick={onClose} className={itemCls}>
              {m.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-line px-5 pt-4 pb-5">
          <div className="grid grid-cols-2 gap-2.5">
            <Button href="/masuk" variant="outline" size="md" onClick={onClose}>
              Masuk
            </Button>
            <Button href="/daftar" size="md" onClick={onClose}>
              Daftar
            </Button>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-2.5 text-sm font-semibold text-slate-700"
          >
            <ChatIcon size={20} /> Butuh bantuan? Chat WhatsApp
          </a>
        </div>
      </aside>
    </div>
  );
}
