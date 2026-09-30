import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CartThumb } from "@/components/cart/CartThumb";
import { Alert } from "@/components/form/Alert";
import { ChevronLeftIcon } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import type { AddressSnapshot } from "@/lib/checkout";
import { formatAddress, formatPhone, formatRupiah } from "@/lib/format";
import { ORDER_STATUS, formatDateTime } from "@/lib/order-status";
import { getMyOrder } from "@/lib/orders";

export const metadata: Metadata = { title: "Detail pesanan — kynara" };

// Detail satu pesanan (versi ringkas Fase 4). Timeline status lengkap & tombol bayar dibuat di Fase 5.
export default async function DetailPesananPage({ params, searchParams }: PageProps<"/akun/pesanan/[nomor]">) {
  const [{ nomor }, sp] = await Promise.all([params, searchParams]);
  if (!/^KYN-\d{6}-\d{4,}$/.test(nomor)) notFound();

  const user = await requireUser(`/akun/pesanan/${nomor}`);
  const order = await getMyOrder(user.id, nomor);
  if (!order) notFound();

  const status = ORDER_STATUS[order.status];
  const address = order.shipping_address as AddressSnapshot;
  const waiting = order.status === "menunggu_pembayaran";

  return (
    <>
      <Link href="/akun/pesanan" className="flex min-h-11 items-center gap-1.5 text-sm font-semibold text-slate-700">
        <ChevronLeftIcon size={16} /> Riwayat pesanan
      </Link>

      {sp.baru === "1" && <Alert tone="success">Pesanan berhasil dibuat. Terima kasih sudah belanja di kynara!</Alert>}

      <section className="flex flex-col gap-4 lg:gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h1 className="font-serif text-2xl/8 font-medium lg:text-[40px]/[48px]">{order.order_number}</h1>
            <span className="text-sm text-muted">Dibuat {formatDateTime(order.created_at)}</span>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${status?.cls ?? ""}`}>
            {status?.label ?? order.status}
          </span>
        </div>

        {waiting && order.expires_at && (
          <div className="flex flex-col gap-1 rounded-2xl bg-status-bayar-bg px-4 py-3.5 text-sm/[21px] text-status-bayar lg:px-6">
            <strong>Selesaikan pembayaran sebelum {formatDateTime(order.expires_at)} WIB</strong>
            <span>
              Stok sudah kami simpan untukmu. Kalau belum dibayar sampai batas waktu, pesanan otomatis dibatalkan. Pembayaran
              online (transfer bank, e-wallet, QRIS) segera tersedia di halaman ini.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
          <div className="rounded-2xl border border-line bg-paper px-4 lg:px-6">
            {order.items.map((it) => (
              <div key={it.id} className="flex items-center gap-4 border-b border-line py-4 last:border-0">
                <CartThumb imageUrl={null} tone={it.variant?.color_hex ?? "#EFE1E2"} alt="" className="w-14" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[15px] font-semibold">{it.product_name}</span>
                  <span className="text-[13px] text-muted">
                    {it.variant_label} · {formatRupiah(it.price)} × {it.quantity}
                  </span>
                </div>
                <span className="text-[15px] font-semibold">{formatRupiah(it.price * it.quantity)}</span>
              </div>
            ))}
          </div>

          <aside className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-4 text-sm lg:p-6">
            <div className="flex flex-col gap-1">
              <span className="text-eyebrow font-bold text-slate-700 uppercase">Dikirim ke · {address.label}</span>
              <span className="font-semibold">
                {address.recipient_name} · {formatPhone(address.phone)}
              </span>
              <span className="text-muted">{formatAddress(address)}</span>
              {order.courier_service && <span className="text-muted">Kurir: {order.courier_service}</span>}
            </div>
            <div className="flex flex-col gap-2 border-t border-line pt-4 text-[15px]">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatRupiah(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Ongkos kirim ({order.total_weight_gram} gram)</span>
                <span>{formatRupiah(order.shipping_cost)}</span>
              </div>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-4">
              <span className="text-base font-bold">Total</span>
              <span className="text-xl font-bold">{formatRupiah(order.total)}</span>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
