"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Menu admin (_komponen/sidebar-admin). Desktop: daftar vertikal di sidebar gelap.
// HP: baris menu yang bisa digeser ke samping (desain admin hanya desktop, ini versi mobile-first-nya).
// Produk, Kategori, dan Banner dikerjakan di Fase 7B; sementara ditampilkan nonaktif.

const items = [
  { label: "Ringkasan", href: "/admin", exact: true },
  { label: "Pesanan", href: "/admin/pesanan", badge: true },
  { label: "Produk", href: "/admin/produk", soon: true },
  { label: "Kategori", href: "/admin/kategori", soon: true },
  { label: "Banner beranda", href: "/admin/banner", soon: true },
];

export function AdminNav({ toShip }: { toShip: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu admin" className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
      {items.map(({ label, href, exact, badge, soon }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        const cls = `flex h-11 shrink-0 items-center gap-3 rounded-[10px] px-3 text-sm ${
          active ? "bg-bg font-bold text-ink" : "font-medium text-admin-side-ink"
        }`;
        const content = (
          <>
            <span aria-hidden="true" className={`size-2 rounded-[2px] ${active ? "bg-slate-700" : "bg-admin-side-ink/35"}`} />
            <span className="grow whitespace-nowrap">{label}</span>
            {badge && toShip > 0 && (
              <span
                aria-label={`${toShip} perlu dikirim`}
                className="flex h-5 min-w-[22px] items-center justify-center rounded-full bg-star px-1.5 text-[11px] font-bold text-ink"
              >
                {toShip}
              </span>
            )}
            {soon && <span className="text-[11px] text-footer-label">Segera</span>}
          </>
        );
        return soon ? (
          <span key={href} aria-disabled="true" className={`${cls} opacity-60`}>
            {content}
          </span>
        ) : (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`${cls} ${active ? "" : "hover:bg-white/10"}`}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
