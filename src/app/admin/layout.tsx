import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoutButton } from "@/components/account/AccountNav";
import { ExternalIcon, LogoutIcon } from "@/components/icons";
import { getProfile } from "@/lib/account";
import { requireAdmin } from "@/lib/admin/auth";
import { countOrdersToShip } from "@/lib/admin/orders";
import { initials } from "@/lib/format";

export const metadata: Metadata = { title: "Admin — kynara", robots: { index: false, follow: false } };

// Layout semua halaman /admin (admin-desktop, _komponen/sidebar-admin).
// requireAdmin = pengecekan admin LAPIS KEDUA di server (lapis pertama: proxy.ts). Bukan admin -> 404.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  const [profile, toShip] = await Promise.all([getProfile(user.id), countOrdersToShip()]);
  const name = profile?.full_name || user.email || "Admin";

  return (
    <div className="grid min-h-dvh grid-cols-1 grid-rows-[auto_1fr] bg-admin-bg lg:grid-cols-[248px_minmax(0,1fr)] lg:grid-rows-1">
      <aside data-latar="gelap" className="flex flex-col gap-4 bg-admin-side px-4 pt-4 pb-3 text-admin-side-ink lg:sticky lg:top-0 lg:h-dvh lg:gap-7 lg:py-6">
        <div className="flex items-center justify-between gap-3 lg:px-2">
          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="font-serif text-[28px] font-medium text-bg">kynara</span>
            <span className="text-[11px] font-bold tracking-[0.12em] text-footer-label uppercase">Admin</span>
          </Link>
          {/* HP: tombol toko & keluar di baris logo */}
          <div className="flex items-center gap-1 lg:hidden">
            <Link href="/" aria-label="Lihat toko" className="flex size-11 items-center justify-center">
              <ExternalIcon size={18} />
            </Link>
            <LogoutButton className="flex size-11 items-center justify-center">
              <LogoutIcon size={18} />
              <span className="sr-only">Keluar</span>
            </LogoutButton>
          </div>
        </div>

        <AdminNav toShip={toShip} />

        <div className="mt-auto hidden flex-col gap-3 lg:flex">
          <Link
            href="/"
            className="flex h-11 items-center gap-2.5 rounded-[10px] border border-white/25 px-3 text-sm font-semibold hover:bg-white/10"
          >
            <ExternalIcon size={18} /> Lihat toko
          </Link>
          <div className="flex items-center gap-2.5 p-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-600 text-[13px] font-bold text-white">
              {initials(profile?.full_name, user.email ?? "")}
            </span>
            <div className="flex min-w-0 grow flex-col">
              <span className="truncate text-[13px] font-semibold">{name}</span>
              <span className="text-xs text-footer-label">Admin</span>
            </div>
            <LogoutButton className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10">
              <LogoutIcon size={18} />
              <span className="sr-only">Keluar</span>
            </LogoutButton>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-col gap-5 px-4 py-6 lg:gap-6 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}
