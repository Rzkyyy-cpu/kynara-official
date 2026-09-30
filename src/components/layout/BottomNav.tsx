"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { BagIcon, GridIcon, HomeIcon, UserIcon } from "@/components/icons";

// Navigasi bawah untuk HP. Hanya pelengkap: menu lengkap tetap ada di navbar atas.
const items = [
  { label: "Beranda", href: "/", Icon: HomeIcon },
  { label: "Koleksi", href: "/koleksi", Icon: GridIcon },
  { label: "Keranjang", href: "/keranjang", Icon: BagIcon },
  { label: "Akun", href: "/akun", Icon: UserIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const { count: cartCount } = useCart();

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed inset-x-0 bottom-0 z-20 grid h-16 grid-cols-4 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {items.map(({ label, href, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative flex flex-col items-center justify-center gap-[3px] text-[11px] ${
              active ? "font-bold text-slate-700" : "font-medium text-muted"
            }`}
          >
            <Icon />
            {label}
            {href === "/keranjang" && cartCount > 0 && (
              <span className="absolute top-2 left-[54%] flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-600 px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
