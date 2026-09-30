"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoxIcon, HeartIcon, LogoutIcon, PinIcon, UserIcon } from "@/components/icons";

// Menu akun. Dua bentuk sesuai desain:
//  - SideNav: sidebar kiri di desktop (Riwayat pesanan, Wishlist, Profil & alamat, Keluar)
//  - TileNav: 4 kotak ikon di HP (Pesanan, Wishlist, Alamat, Profil)

const side = [
  { label: "Riwayat pesanan", href: "/akun/pesanan", Icon: BoxIcon },
  { label: "Wishlist", href: "/akun/wishlist", Icon: HeartIcon },
  { label: "Profil & alamat", href: "/akun/profil", Icon: UserIcon, also: "/akun/alamat" },
];

const tiles = [
  { label: "Pesanan", href: "/akun/pesanan", Icon: BoxIcon },
  { label: "Wishlist", href: "/akun/wishlist", Icon: HeartIcon },
  { label: "Alamat", href: "/akun/alamat", Icon: PinIcon },
  { label: "Profil", href: "/akun/profil", Icon: UserIcon },
];

// Logout lewat POST (lihat src/app/auth/keluar/route.ts)
export function LogoutButton({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <form action="/auth/keluar" method="post">
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}

export function SideNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu akun" className="flex flex-col gap-1">
      {side.map(({ label, href, Icon, also }) => {
        const active = pathname.startsWith(href) || (also !== undefined && pathname.startsWith(also));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex h-12 items-center gap-3 rounded-input px-4 text-[15px] ${
              active ? "bg-sky-tint font-bold text-status-kirim" : "font-medium text-ink hover:bg-paper"
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
      <LogoutButton className="flex h-12 w-full items-center gap-3 rounded-input px-4 text-[15px] font-medium text-error hover:bg-paper">
        <LogoutIcon size={20} />
        Keluar
      </LogoutButton>
    </nav>
  );
}

export function TileNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu akun" className="grid grid-cols-4 gap-2">
      {tiles.map(({ label, href, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex h-[84px] flex-col items-center justify-center gap-1.5 rounded-card border text-xs font-semibold ${
              active ? "border-sky-tint bg-sky-tint text-status-kirim" : "border-line bg-paper text-ink"
            }`}
          >
            <Icon size={22} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
