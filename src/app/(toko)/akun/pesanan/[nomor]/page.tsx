import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CartThumb } from "@/components/cart/CartThumb";
import { Alert } from "@/components/form/Alert";
import { ChatIcon, ChevronLeftIcon } from "@/components/icons";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { type ActivePayment, PaymentCard } from "@/components/order/PaymentCard";
import { requireUser } from "@/lib/auth";
import type { AddressSnapshot } from "@/lib/checkout";
import { formatAddress, formatPhone, formatRupiah } from "@/lib/format";
import { getPaymentMethods } from "@/lib/komerce-payment/client";
import { paymentLabel, vaExpirySeconds } from "@/lib/komerce-payment/status";
import { ORDER_HEADLINE, formatDateTime, orderTimeline, paymentIssue } from "@/lib/order-status";
import { getMyOrder } from "@/lib/orders";
import { qrPath } from "@/lib/qr";
import { whatsappUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Status pesanan — kynara" };

// Halaman status pesanan (desktop-akun-checkout/10, mobile-akun-checkout/11).
export default async function DetailPesananPage({ params, searchParams }: PageProps<"/akun/pesanan/[nomor]">) {
  const [{ nomor }, sp] = await Promise.all([params, searchParams]);
  if (!/^KYN-\d{6}-\d{4,}$/.test(nomor)) notFound();

  const user = await requireUser(`/akun/pesanan/${nomor}`);
  const order = await getMyOrder(user.id, nomor);
  if (!order) notFound();

  const [headLabel, headline, subline, headColor] = ORDER_HEADLINE[order.status] ?? ORDER_HEADLINE.menunggu_pembayaran;
  const steps = orderTimeline(order);
  const address = order.shipping_address as AddressSnapshot;
  const waiting = order.status === "menunggu_pembayaran";

  // VA/QR terbaru yang masih menunggu dibayar (QR yang baru kedaluwarsa tetap tampil supaya bisa dibuat ulang)
  const latest = waiting ? order.payments.find((p) => p.status === "PENDING") : undefined;
  const active: ActivePayment | null = latest
    ? {
        method: latest.method === "qris" ? "qris" : "va",
        channel: latest.channel_code,
        vaNumber: latest.va_number,
        qr: latest.qr_string ? qrPath(latest.qr_string) : null,
        paymentUrl: latest.payment_url,
        expiresAt: latest.expires_at,
      }
    : null;
  // Metode yang tampil: pembayaran yang lunas, kalau belum ada, VA/QR yang sedang aktif
  const shown = order.payments.find((p) => p.status === "PAID") ?? latest;
  const method = shown ? paymentLabel(shown.method, shown.channel_code) : order.payment_method;
  const methods = waiting ? await getPaymentMethods() : [];
  const askUrl = `${whatsappUrl}?text=${encodeURIComponent(`Halo kynara, saya mau tanya soal pesanan ${order.order_number}`)}`;

  const askButton = (className: string) => (
    <a
      href={askUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`h-12 items-center justify-center gap-2 rounded-full border border-ink px-6 text-[15px] font-semibold whitespace-nowrap text-ink hover:bg-paper ${className}`}
    >
      <ChatIcon size={18} /> Tanya soal pesanan ini
    </a>
  );

  return (
    <>
      <Link href="/akun/pesanan" className="flex min-h-11 items-center gap-1.5 text-sm font-semibold text-slate-700">
        <ChevronLeftIcon size={16} /> Riwayat pesanan
      </Link>

      {sp.baru === "1" && <Alert tone="success">Pesanan berhasil dibuat. Terima kasih sudah belanja di kynara!</Alert>}
      {paymentIssue(order.history) === "late" && (
        <Alert tone="error">
          Pembayaranmu masuk setelah batas waktu, jadi pesanan tidak diproses otomatis. Tenang, tim kami akan menghubungimu
          lewat WhatsApp untuk memproses pesanan atau mengembalikan dana.
        </Alert>
      )}
      {paymentIssue(order.history) === "duplicate" && (
        <Alert tone="error">
          Kami menerima lebih dari satu pembayaran untuk pesanan ini. Tim kami akan menghubungimu lewat WhatsApp untuk
          mengembalikan kelebihannya.
        </Alert>
      )}

      {/* Judul: HP = nomor pesanan, desktop = status besar */}
      <div className="flex flex-col lg:hidden">
        <h1 className="text-lg font-bold">{order.order_number}</h1>
        <span className="text-xs text-muted">Dipesan {formatDateTime(order.created_at)}</span>
      </div>
      <div className="hidden items-end justify-between gap-6 lg:flex">
        <div className="flex flex-col gap-1.5">
          <span className={`text-xs font-bold tracking-[0.1em] uppercase ${headColor}`}>{headLabel}</span>
          <h1 className="font-serif text-[40px]/[48px] font-medium">{headline}</h1>
          <span className="text-[15px] text-muted">
            {order.order_number} · Dipesan {formatDateTime(order.created_at)} · {subline}
          </span>
        </div>
        {askButton("inline-flex shrink-0")}
      </div>

      {/* Timeline: HP di dalam kartu bersama judul status, desktop berdiri sendiri */}
      <section className="flex flex-col gap-[18px] rounded-2xl border border-line bg-paper p-5 lg:hidden">
        <div className="flex flex-col gap-1">
          <span className={`text-xs font-bold tracking-[0.08em] uppercase ${headColor}`}>{headLabel}</span>
          <h2 className="font-serif text-2xl/8 font-medium">{headline}</h2>
          <p className="text-sm/[21px] text-muted">{subline}.</p>
        </div>
        <OrderTimeline steps={steps} />
      </section>
      <div className="hidden lg:block">
        <OrderTimeline steps={steps} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
        <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
          {waiting && order.expires_at && (
            <PaymentCard
              orderNumber={order.order_number}
              orderExpiresAt={order.expires_at}
              total={order.total}
              active={active}
              methods={methods.map(({ type, code }) => ({ type, code }))}
              vaDisabledReason={
                vaExpirySeconds(order.expires_at) === null ? "Sisa waktu bayar kurang dari 1 jam. Pakai QRIS, ya." : null
              }
              initialError={sp.bayar === "gagal" ? "Kode pembayaran belum berhasil dibuat. Pilih metode lalu coba lagi, ya." : null}
            />
          )}

          {order.tracking_number && (
            <section className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-5 lg:p-7">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-bold lg:text-[17px]">Lacak pengiriman</span>
                <span className="text-sm text-muted">{order.courier_service}</span>
              </div>
              <span className="text-[13px] font-semibold">Nomor resi</span>
              <strong className="text-lg tracking-[0.04em] break-all select-all">{order.tracking_number}</strong>
            </section>
          )}

          <section className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-5 lg:gap-4 lg:p-7">
            <span className="text-[15px] font-bold lg:text-[17px]">Produk</span>
            {order.items.map((it) => (
              <div key={it.id} className="grid grid-cols-[48px_1fr_auto] items-center gap-3 lg:grid-cols-[64px_1fr_auto] lg:gap-4">
                <CartThumb imageUrl={null} tone={it.variant?.color_hex ?? "#EFE1E2"} alt="" className="w-12 lg:w-16" />
                <span className="flex min-w-0 flex-col lg:gap-0.5">
                  <span className="text-sm font-semibold lg:text-[15px]">{it.product_name}</span>
                  <span className="text-xs text-muted lg:text-[13px]">
                    {it.variant_label} · ×{it.quantity}
                  </span>
                </span>
                <span className="text-sm lg:text-[15px]">{formatRupiah(it.price * it.quantity)}</span>
              </div>
            ))}
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:gap-6">
          <section className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-5 text-sm lg:p-7">
            <span className="text-[15px] font-bold lg:text-[17px]">Pembayaran</span>
            <div className="flex justify-between gap-3">
              <span className="text-muted">Metode</span>
              <span className="text-right">{method ?? (waiting ? "Belum dipilih" : "-")}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted">Subtotal</span>
              <span>{formatRupiah(order.subtotal)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted">Ongkos kirim{order.courier_service ? ` · ${order.courier_service}` : ""}</span>
              <span>{formatRupiah(order.shipping_cost)}</span>
            </div>
            <div className="h-px bg-line" />
            <div className="flex justify-between gap-3 text-[15px] font-bold lg:text-[17px]">
              <span>Total</span>
              <span>{formatRupiah(order.total)}</span>
            </div>
          </section>

          <section className="flex flex-col gap-1.5 rounded-2xl border border-line bg-paper p-5 lg:p-7">
            <span className="mb-1.5 text-[15px] font-bold lg:text-[17px]">Alamat pengiriman</span>
            <span className="text-sm font-semibold lg:text-[15px]">
              {address.recipient_name} · {formatPhone(address.phone)}
            </span>
            <span className="text-sm/[21px] text-muted">{formatAddress(address)}</span>
          </section>

          {askButton("flex lg:hidden")}
        </aside>
      </div>
    </>
  );
}
