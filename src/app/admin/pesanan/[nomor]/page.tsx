import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { ResolveIssueButton } from "@/components/admin/ResolveIssueButton";
import { ToastProvider } from "@/components/admin/Toast";
import { StatusBadge, cardCls } from "@/components/admin/ui";
import { Alert } from "@/components/form/Alert";
import { ChevronLeftIcon, WhatsAppIcon } from "@/components/icons";
import { getAdminOrder } from "@/lib/admin/orders";
import type { AddressSnapshot } from "@/lib/checkout";
import { formatAddress, formatPhone, formatRupiah, waNumber } from "@/lib/format";
import { paymentLabel } from "@/lib/komerce-payment/status";
import { ORDER_STATUS, formatDateTime, paymentIssue } from "@/lib/order-status";
import { orderNumberSchema } from "@/lib/validation/admin";

export const metadata: Metadata = { title: "Detail pesanan — Admin kynara" };

// Arti catatan di riwayat status (lihat migration pembayaran & admin)
const NOTES: Record<string, string> = {
  PEMBAYARAN_TERLAMBAT: "Uang masuk setelah pesanan kedaluwarsa/dibatalkan",
  PEMBAYARAN_GANDA: "Uang masuk dua kali",
  PERLU_REFUND: "Dibatalkan admin setelah lunas, perlu refund",
  DIBATALKAN_ADMIN: "Dibatalkan admin",
  MASALAH_BAYAR_DITANGANI: "Masalah pembayaran ditandai sudah ditangani",
};

const ISSUE_TEXT = {
  late: "Uang pembeli masuk setelah pesanan kedaluwarsa atau dibatalkan, dan stoknya sudah dilepas. Hubungi pembeli: kembalikan dana, atau proses manual kalau stok masih ada.",
  duplicate: "Pembeli membayar lebih dari sekali untuk pesanan ini. Kembalikan kelebihannya ke pembeli.",
  refund: "Pesanan ini dibatalkan setelah lunas. Kembalikan dana pembeli secara manual (transfer).",
};

const PAYMENT_STATUS: Record<string, string> = { PENDING: "Menunggu", PAID: "Lunas", EXPIRED: "Kedaluwarsa", CANCELED: "Ditutup" };

// Detail pesanan untuk admin (tombol mata di admin-desktop/02)
export default async function AdminPesananDetailPage({ params }: PageProps<"/admin/pesanan/[nomor]">) {
  const { nomor } = await params;
  if (!orderNumberSchema.safeParse(nomor).success) notFound();
  const order = await getAdminOrder(nomor);
  if (!order) notFound();

  const address = order.shipping_address as AddressSnapshot;
  const issue = paymentIssue(order.history);
  const wa = waNumber(address.phone);

  return (
    <ToastProvider>
      <Link href="/admin/pesanan" className="flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-slate-700">
        <ChevronLeftIcon size={16} /> Semua pesanan
      </Link>

      <header className="-mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-[28px]/9 font-medium lg:text-[32px]/10">{order.order_number}</h1>
        <StatusBadge status={order.status} />
        <span className="w-full text-sm text-muted">Dipesan {formatDateTime(order.created_at)}</span>
      </header>

      {issue && (
        <div className="flex flex-col gap-3">
          <Alert tone="error">{ISSUE_TEXT[issue]}</Alert>
          <ResolveIssueButton orderNumber={order.order_number} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <section className={`${cardCls} p-4 lg:p-6`}>
            <h2 className="mb-3 text-base font-bold">Barang ({order.items.length})</h2>
            <ul className="flex flex-col">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-start justify-between gap-4 border-b border-line-soft py-3 text-sm last:border-0">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1 size-3 shrink-0 rounded-full border border-line"
                      style={{ background: it.variant?.color_hex ?? "transparent" }}
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="font-semibold">{it.product_name}</span>
                      <span className="text-xs text-muted">
                        {it.variant_label}
                        {it.variant?.sku && ` · ${it.variant.sku}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span className="font-semibold">{formatRupiah(it.price * it.quantity)}</span>
                    <span className="text-xs text-muted">
                      {it.quantity} × {formatRupiah(it.price)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatRupiah(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">
                  Ongkir {order.courier_service} · {(order.total_weight_gram / 1000).toLocaleString("id-ID")} kg
                </dt>
                <dd>{formatRupiah(order.shipping_cost)}</dd>
              </div>
              <div className="flex justify-between text-base font-bold">
                <dt>Total</dt>
                <dd>{formatRupiah(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className={`${cardCls} p-4 lg:p-6`}>
            <h2 className="mb-3 text-base font-bold">Percobaan bayar</h2>
            {order.payments.length === 0 ? (
              <p className="text-sm text-muted">Pembeli belum membuat VA atau QRIS.</p>
            ) : (
              <ul className="flex flex-col">
                {order.payments.map((p) => (
                  <li key={p.provider_payment_id} className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-line-soft py-2.5 text-sm last:border-0">
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {paymentLabel(p.method, p.channel_code)}
                        {p.va_number && <span className="font-normal text-muted"> · {p.va_number}</span>}
                      </span>
                      <span className="text-xs text-muted">
                        Dibuat {formatDateTime(p.created_at)}
                        {p.paid_at && ` · dibayar ${formatDateTime(p.paid_at)}`}
                      </span>
                    </div>
                    <span className={`text-[13px] font-bold ${p.status === "PAID" ? "text-status-kirim" : "text-muted"}`}>
                      {PAYMENT_STATUS[p.status] ?? p.status} · {formatRupiah(p.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${cardCls} p-4 lg:p-6`}>
            <h2 className="mb-3 text-base font-bold">Riwayat status</h2>
            <ol className="flex flex-col gap-2.5 text-sm">
              {order.history.map((h) => (
                <li key={h.id} className="flex flex-wrap gap-x-3">
                  <span className="w-[150px] shrink-0 text-muted">{formatDateTime(h.created_at)}</span>
                  <span className="font-semibold">{ORDER_STATUS[h.status]?.label ?? h.status}</span>
                  {h.note && <span className="w-full text-[13px] text-error sm:w-auto">{NOTES[h.note] ?? h.note}</span>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <section className={`${cardCls} flex flex-col gap-3 p-4 lg:p-6`}>
            <h2 className="text-base font-bold">Ubah status</h2>
            <OrderStatusControl
              layout="stack"
              orderNumber={order.order_number}
              status={order.status}
              tracking={order.tracking_number}
              paid={Boolean(order.paid_at)}
              buyer={{ name: address.recipient_name, phone: address.phone }}
            />
            {order.paid_at && (
              <p className="text-[13px] text-muted">
                Dibayar {formatDateTime(order.paid_at)} via {order.payment_method}
              </p>
            )}
          </section>

          <section className={`${cardCls} flex flex-col gap-2 p-4 text-sm lg:p-6`}>
            <h2 className="text-base font-bold">Pengiriman</h2>
            <p>
              <strong>{address.recipient_name}</strong> · {formatPhone(address.phone)}
            </p>
            <p className="text-muted">{formatAddress(address)}</p>
            {address.landmark && <p className="text-muted">Patokan: {address.landmark}</p>}
            <p>Kurir: {order.courier_service ?? "-"}</p>
            {wa && (
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-2 self-start text-sm font-semibold text-slate-700"
              >
                <WhatsAppIcon size={18} /> Chat pembeli
              </a>
            )}
          </section>
        </div>
      </div>
    </ToastProvider>
  );
}
