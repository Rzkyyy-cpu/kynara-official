import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar } from "@/components/admin/FilterBar";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { ToastProvider } from "@/components/admin/Toast";
import { PageHeader, PageLink, PaidBadge, cardCls, tdCls, thCls } from "@/components/admin/ui";
import { DownloadIcon, EyeIcon } from "@/components/icons";
import { ORDERS_PER_PAGE, countOrdersByTab, listOrders } from "@/lib/admin/orders";
import type { AddressSnapshot } from "@/lib/checkout";
import { formatRupiah } from "@/lib/format";
import { formatDateTime } from "@/lib/order-status";
import {
  COURIER_FILTERS,
  ORDER_RANGES,
  ORDER_TABS,
  type OrderFilters as Filters,
  type OrderTab,
  orderFiltersSchema,
} from "@/lib/validation/admin";

export const metadata: Metadata = { title: "Pesanan — Admin kynara" };

// URL dengan filter sekarang + perubahan (nilai bawaan tidak ditulis supaya URL pendek)
function hrefWith(f: Filters, patch: Partial<Filters>, base = "/admin/pesanan") {
  const next = { ...f, ...patch };
  const p = new URLSearchParams();
  if (next.status !== "semua") p.set("status", next.status);
  if (next.q) p.set("q", next.q);
  if (next.rentang !== "30") p.set("rentang", next.rentang);
  if (next.kurir !== "semua") p.set("kurir", next.kurir);
  if (next.hal > 1) p.set("hal", String(next.hal));
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}

// Kelola pesanan (admin-desktop/02)
export default async function AdminPesananPage({ searchParams }: PageProps<"/admin/pesanan">) {
  const f = orderFiltersSchema.parse(await searchParams);
  const [{ rows, total }, counts] = await Promise.all([listOrders(f), countOrdersByTab(f)]);
  const first = total === 0 ? 0 : (f.hal - 1) * ORDERS_PER_PAGE + 1;
  const last = Math.min(f.hal * ORDERS_PER_PAGE, total);

  return (
    <ToastProvider>
      <PageHeader
        title="Pesanan"
        subtitle='Ubah status langsung dari tabel. Status "Dikirim" wajib diisi nomor resi.'
        action={
          <a
            href={hrefWith(f, { hal: 1 }, "/admin/pesanan/csv")}
            download
            className="inline-flex h-10 items-center gap-2 self-start rounded-full border border-line-strong bg-paper px-4 text-sm font-semibold hover:border-ink"
          >
            <DownloadIcon size={16} /> Unduh CSV
          </a>
        }
      />

      <nav aria-label="Filter status" className="-mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 [scrollbar-width:none] lg:mx-0 lg:px-0">
        {(Object.keys(ORDER_TABS) as OrderTab[]).map((tab) => {
          const active = tab === f.status;
          return (
            <Link
              key={tab}
              href={hrefWith(f, { status: tab, hal: 1 })}
              aria-current={active ? "page" : undefined}
              className={`flex h-11 shrink-0 items-center gap-2 px-3.5 text-sm font-semibold whitespace-nowrap ${
                active ? "text-ink shadow-[inset_0_-2px_0_var(--color-slate-700)]" : "text-muted hover:text-ink"
              }`}
            >
              {ORDER_TABS[tab]}
              <span className="flex h-5 min-w-[22px] items-center justify-center rounded-full bg-status-selesai-bg px-1.5 text-[11px]">
                {counts[tab]}
              </span>
            </Link>
          );
        })}
      </nav>

      <FilterBar
        q={f.q}
        placeholder="Cari no. pesanan atau nama pembeli"
        selects={[
          { name: "rentang", label: "Rentang tanggal", value: f.rentang, options: Object.entries(ORDER_RANGES) },
          { name: "kurir", label: "Kurir", value: f.kurir, options: Object.entries(COURIER_FILTERS) },
        ]}
        summary={`${total} pesanan`}
      />

      <div className={`${cardCls} overflow-hidden`}>
        {/* relative: teks sr-only (absolute) di dalam tabel ikut terpotong wadah ini, tidak melebarkan halaman di HP */}
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-[13px]">
            <thead className="bg-admin-thead">
              <tr className="border-b border-line">
                <th className={`${thCls} pl-4`}>No. pesanan</th>
                <th className={thCls}>Tanggal</th>
                <th className={thCls}>Pembeli</th>
                <th className={thCls}>Total</th>
                <th className={thCls}>Bayar</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Nomor resi</th>
                <th className={thCls}>
                  <span className="sr-only">Detail</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted">
                    {f.q || f.kurir !== "semua" || f.status !== "semua"
                      ? "Tidak ada pesanan yang cocok dengan filter ini."
                      : "Belum ada pesanan di rentang tanggal ini."}
                  </td>
                </tr>
              )}
              {rows.map((o) => {
                const address = o.shipping_address as AddressSnapshot;
                const itemCount = o.items[0]?.count ?? 0;
                return (
                  <tr key={o.id} className="border-b border-line-soft last:border-0">
                    <td className={`${tdCls} pl-4`}>
                      <Link href={`/admin/pesanan/${o.order_number}`} className="font-bold hover:underline">
                        {o.order_number}
                      </Link>
                      <div className="text-xs text-muted">{itemCount} produk</div>
                    </td>
                    <td className={`${tdCls} whitespace-nowrap`}>{formatDateTime(o.created_at, false)}</td>
                    <td className={tdCls}>
                      <div className="font-semibold">{address.recipient_name}</div>
                      <div className="text-xs text-muted">{address.city}</div>
                    </td>
                    <td className={`${tdCls} font-semibold whitespace-nowrap`}>{formatRupiah(o.total)}</td>
                    <td className={tdCls}>
                      <PaidBadge paid={Boolean(o.paid_at)} />
                    </td>
                    <OrderStatusControl
                      orderNumber={o.order_number}
                      status={o.status}
                      tracking={o.tracking_number}
                      paid={Boolean(o.paid_at)}
                      buyer={{ name: address.recipient_name, phone: address.phone }}
                    />
                    <td className={`${tdCls} w-[60px]`}>
                      <Link
                        href={`/admin/pesanan/${o.order_number}`}
                        aria-label={`Detail ${o.order_number}`}
                        className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-bg"
                      >
                        <EyeIcon size={18} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-t border-line-soft px-4 py-2 text-[13px]">
          <span className="text-muted">{total === 0 ? "Tidak ada pesanan" : `Menampilkan ${first}–${last} dari ${total}`}</span>
          <div className="flex gap-1.5">
            <PageLink href={f.hal > 1 ? hrefWith(f, { hal: f.hal - 1 }) : null}>Sebelumnya</PageLink>
            <PageLink href={last < total ? hrefWith(f, { hal: f.hal + 1 }) : null}>Berikutnya</PageLink>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
