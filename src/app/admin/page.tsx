import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PeriodSelect } from "@/components/admin/PeriodSelect";
import { SalesChart } from "@/components/admin/SalesChart";
import { PageHeader, StatusBadge, cardCls, tdCls, thCls } from "@/components/admin/ui";
import { changeLabel } from "@/lib/admin/chart";
import { getDashboard } from "@/lib/admin/dashboard";
import { formatRupiah, formatRupiahShort } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/order-status";
import { PERIODS, periodSchema } from "@/lib/validation/admin";

export const metadata: Metadata = { title: "Ringkasan — Admin kynara" };

const pesanan = (status: string) => `/admin/pesanan?status=${status}&rentang=semua`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const dateLabel = (iso: string, year = false) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}${year ? ` ${y}` : ""}`;
};

// Ringkasan admin (admin-desktop/01). Semua angka dari fungsi database admin_dashboard.
export default async function AdminRingkasanPage({ searchParams }: PageProps<"/admin">) {
  const period = periodSchema.parse((await searchParams).periode);
  const d = await getDashboard(period);

  const today = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date());
  const avg = d.orders ? Math.round(d.sales / d.orders) : 0;
  const prevAvg = d.prev_orders ? Math.round(d.prev_sales / d.prev_orders) : 0;
  const salesChange = changeLabel(d.sales, d.prev_sales);
  const avgChange = changeLabel(avg, prevAvg);
  const orderDiff = d.orders - d.prev_orders;
  const toShip = d.status_counts.diproses ?? 0;
  const waiting = d.status_counts.menunggu_pembayaran ?? 0;
  const toneCls = { up: "font-semibold text-slate-900", down: "font-semibold text-error", flat: "text-muted" };

  return (
    <>
      <PageHeader title="Ringkasan" subtitle={today} action={<PeriodSelect value={period} />} />

      {/* Penjualan hari ini & bulan ini selalu tampil, apa pun periode yang dipilih */}
      <p className="-mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted">
        <span>
          Hari ini: <strong className="text-ink">{formatRupiah(d.today_sales)}</strong> ({d.today_orders} pesanan)
        </span>
        <span>
          Bulan ini: <strong className="text-ink">{formatRupiah(d.month_sales)}</strong> ({d.month_orders} pesanan)
        </span>
      </p>

      <section aria-label={`Angka ${PERIODS[period].toLowerCase()}`} className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <div className={`${cardCls} flex flex-col gap-2 p-4 lg:p-5`}>
          <span className="text-[13px] font-semibold text-muted">Penjualan</span>
          <span className="text-2xl font-bold tracking-[-0.01em] lg:text-[28px]">{formatRupiahShort(d.sales)}</span>
          <span className={`text-[13px] ${toneCls[salesChange.tone]}`}>{salesChange.text}</span>
        </div>
        <div className={`${cardCls} flex flex-col gap-2 p-4 lg:p-5`}>
          <span className="text-[13px] font-semibold text-muted">Pesanan dibayar</span>
          <span className="text-2xl font-bold tracking-[-0.01em] lg:text-[28px]">{d.orders}</span>
          <span className={`text-[13px] ${orderDiff > 0 ? toneCls.up : orderDiff < 0 ? toneCls.down : toneCls.flat}`}>
            {orderDiff === 0 ? "Sama dengan periode lalu" : `${orderDiff > 0 ? "▲" : "▼"} ${Math.abs(orderDiff)} pesanan`}
          </span>
        </div>
        <div className={`${cardCls} flex flex-col gap-2 p-4 lg:p-5`}>
          <span className="text-[13px] font-semibold text-muted">Rata-rata per pesanan</span>
          <span className="text-2xl font-bold tracking-[-0.01em] lg:text-[28px]">{formatRupiahShort(avg)}</span>
          <span className={`text-[13px] ${toneCls[avgChange.tone]}`}>{avgChange.text}</span>
        </div>
        <Link
          href={pesanan("diproses")}
          className="flex flex-col gap-2 rounded-card border border-pay-line bg-pay-bg p-4 hover:border-status-bayar lg:p-5"
        >
          <span className="text-[13px] font-semibold text-status-bayar">Perlu dikirim</span>
          <span className="text-2xl font-bold tracking-[-0.01em] lg:text-[28px]">{toShip}</span>
          <span className="text-[13px] font-semibold text-status-bayar">Lihat pesanan →</span>
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <figure className={`${cardCls} m-0 flex min-w-0 flex-col gap-4 p-4 lg:p-6`}>
          <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-base font-bold">Penjualan harian</span>
            <span className="text-[13px] text-muted">
              {dateLabel(d.daily[0].date)} – {dateLabel(d.to, true)}
            </span>
          </figcaption>
          <SalesChart daily={d.daily} />
        </figure>

        <section className={`${cardCls} flex flex-col gap-2 p-4 lg:p-6`}>
          <h2 className="mb-1 text-base font-bold">Perlu tindakan</h2>
          <TodoLink href={pesanan("diproses")} count={toShip} cls="bg-status-proses-bg text-status-proses">
            Pesanan diproses, belum ada resi
          </TodoLink>
          <TodoLink href={pesanan("menunggu_pembayaran")} count={waiting} cls="bg-status-bayar-bg text-status-bayar">
            Menunggu pembayaran
          </TodoLink>
          {/* Link ke halaman produk menyusul di Fase 7B */}
          <div className="flex min-h-14 items-center gap-3 border-b border-line-soft px-1 text-sm">
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blush px-2 text-xs font-bold text-stock-critical">
              {d.low_stock_count}
            </span>
            <span className="grow">Varian stok menipis (≤5)</span>
          </div>
          {d.low_stock.length > 0 && (
            <ul className="flex flex-col gap-1.5 pt-2 text-[13px]">
              {d.low_stock.map((v) => (
                <li key={`${v.product_id}-${v.color_name}-${v.size_name}`} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">
                    {v.product_name} · {v.color_name}
                    {v.size_name !== "All size" && ` · ${v.size_name}`}
                  </span>
                  <strong className="shrink-0 text-stock-critical">{v.stock === 0 ? "Habis" : `Sisa ${v.stock}`}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>

      {/* Jumlah pesanan per status (sepanjang waktu) */}
      <section aria-label="Pesanan per status" className="flex flex-wrap gap-2">
        {Object.keys(ORDER_STATUS).map((s) => (
          <Link
            key={s}
            href={pesanan(s === "kedaluwarsa" || s === "dibatalkan" ? "batal" : s)}
            className={`inline-flex h-8 items-center gap-2 rounded-full px-3 text-[13px] font-semibold ${ORDER_STATUS[s].cls}`}
          >
            {ORDER_STATUS[s].label}
            <span className="font-bold">{d.status_counts[s as keyof typeof d.status_counts] ?? 0}</span>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className={`${cardCls} min-w-0 px-3 pt-2 pb-3`}>
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <h2 className="text-base font-bold">Pesanan terbaru</h2>
            <Link href="/admin/pesanan" className="text-[13px] font-semibold text-slate-700">
              Lihat semua
            </Link>
          </div>
          {d.recent_orders.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted">Belum ada pesanan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className={thCls}>No. pesanan</th>
                    <th className={thCls}>Pembeli</th>
                    <th className={thCls}>Total</th>
                    <th className={thCls}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recent_orders.map((o) => (
                    <tr key={o.order_number} className="h-14 border-b border-line-soft last:border-0">
                      <td className={`${tdCls} font-semibold whitespace-nowrap`}>
                        <Link href={`/admin/pesanan/${o.order_number}`} className="hover:underline">
                          {o.order_number}
                        </Link>
                      </td>
                      <td className={tdCls}>{o.buyer}</td>
                      <td className={tdCls}>{formatRupiah(o.total)}</td>
                      <td className={tdCls}>
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={`${cardCls} flex flex-col gap-1 px-4 py-5 lg:px-6`}>
          <h2 className="mb-2 text-base font-bold">Produk terlaris</h2>
          {d.top_products.length === 0 ? (
            <p className="py-4 text-sm text-muted">Belum ada penjualan di periode ini.</p>
          ) : (
            <ol>
              {d.top_products.map((t, i) => (
                <li
                  key={t.product_id ?? t.name}
                  className="grid min-h-[52px] grid-cols-[20px_36px_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-line-soft py-1 last:border-0"
                >
                  <span className="text-[13px] font-bold text-muted">{i + 1}</span>
                  <span className="relative aspect-[4/5] w-9 overflow-hidden rounded-md bg-line">
                    {t.image_url && <Image src={t.image_url} alt="" fill sizes="36px" className="object-cover" />}
                  </span>
                  <span className="text-sm font-semibold">{t.name}</span>
                  <span className="text-[13px] text-muted">{t.qty} terjual</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </>
  );
}

function TodoLink({ href, count, cls, children }: { href: string; count: number; cls: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 border-b border-line-soft px-1 text-sm hover:bg-bg">
      <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold ${cls}`}>{count}</span>
      <span className="grow">{children}</span>
      <span aria-hidden="true">›</span>
    </Link>
  );
}
