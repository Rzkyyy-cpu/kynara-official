import type { Metadata } from "next";
import { Avatar } from "@/components/account/AccountHeader";
import { SideNav } from "@/components/account/AccountNav";
import { Container } from "@/components/ui/Container";
import { getProfile } from "@/lib/account";
import { requireUser } from "@/lib/auth";
import { initials } from "@/lib/format";

export const metadata: Metadata = { title: "Akun — kynara", robots: { index: false } };

// Layout semua halaman /akun/*.
// requireUser = pengecekan login LAPIS KEDUA di server (lapis pertama: proxy.ts).
// Halaman ini membaca cookie, jadi otomatis dirender per permintaan (tidak di-cache).
export default async function AkunLayout({ children }: LayoutProps<"/akun">) {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const name = profile?.full_name || user.email || "";

  return (
    <Container className="grid grid-cols-1 gap-12 pt-5 pb-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:pt-12 lg:pb-24">
      <aside className="hidden flex-col gap-6 lg:flex">
        <div className="flex items-center gap-3">
          <Avatar initials={initials(profile?.full_name, user.email ?? "")} />
          <div className="flex min-w-0 flex-col">
            <strong className="truncate text-base">{name}</strong>
            <span className="truncate text-[13px] text-muted">{user.email}</span>
          </div>
        </div>
        <SideNav />
      </aside>
      <div className="flex min-w-0 flex-col gap-5 lg:gap-6">{children}</div>
    </Container>
  );
}
