import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/account/AccountHeader";
import { LogoutButton, TileNav } from "@/components/account/AccountNav";
import { OrderCard } from "@/components/account/OrderCard";
import { Alert } from "@/components/form/Alert";
import { BoxIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { getProfile } from "@/lib/account";
import { requireUser } from "@/lib/auth";
import { initials } from "@/lib/format";
import { type OrderStatus, getMyOrders } from "@/lib/orders";

export const metadata: Metadata = { title: "Riwayat pesanan — kynara" };

// Tab filter status. Nilai ?status= sama dengan enum order_status di database.
const TABS = [
  { label: "Semua", value: "" },
  { label: "Menunggu Bayar", value: "menunggu_pembayaran" },
  { label: "Diproses", value: "diproses" },
  { label: "Dikirim", value: "dikirim" },
  { label: "Selesai", value: "selesai" },
  { label: "Dibatalkan", value: "dibatalkan" },
];

export default async function PesananPage({ searchParams }: PageProps<"/akun/pesanan">) {
  const sp = await searchParams;
  const status = TABS.some((t) => t.value === sp.status) ? (sp.status as string) : "";
  const user = await requireUser("/akun/pesanan");
  const [profile, orders] = await Promise.all([
    getProfile(user.id),
    getMyOrders(user.id, (status || undefined) as OrderStatus | undefined),
  ]);

  const tabHref = (value: string) => (value ? `/akun/pesanan?status=${value}` : "/akun/pesanan");

  return (
    <>
      {/* Kepala akun versi HP: avatar, nama, tombol Ubah, lalu 4 kotak menu */}
      <section className="flex items-center gap-3.5 lg:hidden">
        <Avatar size="lg" initials={initials(profile?.full_name, user.email ?? "")} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h1 className="truncate text-lg font-bold">{profile?.full_name || "Akun saya"}</h1>
          <span className="truncate text-[13px] text-muted">{user.email}</span>
        </div>
        <Link href="/akun/profil" className="flex min-h-11 items-center text-[13px] font-semibold text-slate-700">
          Ubah
        </Link>
      </section>
      <div className="lg:hidden">
        <TileNav />
      </div>

      {sp.pesan === "password-diganti" && <Alert tone="success">Password baru tersimpan.</Alert>}

      <section className="flex flex-col gap-3.5 lg:gap-6">
        <h2 className="font-serif text-2xl/8 font-medium lg:text-[40px]/[48px]">Riwayat pesanan</h2>

        {/* HP: chip yang bisa digeser; desktop: tab bergaris bawah */}
        <nav
          aria-label="Filter status"
          className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] lg:mx-0 lg:gap-1 lg:border-b lg:border-line lg:px-0"
        >
          {TABS.map((t) => {
            const active = t.value === status;
            return (
              <Link
                key={t.label}
                href={tabHref(t.value)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-[13px] font-medium whitespace-nowrap lg:h-11 lg:rounded-none lg:border-0 lg:px-4 lg:text-[15px] ${
                  active
                    ? "border-ink bg-ink text-white lg:bg-transparent lg:font-semibold lg:text-ink lg:shadow-[inset_0_-2px_0_var(--color-slate)]"
                    : "border-line-strong bg-paper text-ink lg:bg-transparent lg:text-muted"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        {orders.length > 0 ? (
          <div className="flex flex-col gap-3 lg:gap-6">
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        ) : (
        <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-line bg-paper px-5 py-10 text-center lg:gap-3 lg:px-10 lg:py-16">
          <span className="flex size-16 items-center justify-center rounded-full bg-sky-tint text-slate-700 lg:size-[72px]">
            <BoxIcon size={30} />
          </span>
          <strong className="text-base lg:text-lg">
            {status ? "Belum ada pesanan di status ini" : "Belum ada pesanan"}
          </strong>
          <span className="text-sm/[21px] text-muted lg:text-[15px]">
            {status ? "Pesanan dengan status ini akan muncul di sini." : "Pesanan yang kamu buat akan muncul di sini."}
          </span>
          <Button href="/koleksi" size="md" className="mt-2">
            Mulai Belanja
          </Button>
        </div>
        )}
      </section>

      <LogoutButton className="h-12 w-full rounded-full border border-line-strong text-[15px] font-semibold text-error lg:hidden">
        Keluar
      </LogoutButton>
    </>
  );
}
