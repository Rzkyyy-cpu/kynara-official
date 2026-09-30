import { CartThumb } from "@/components/cart/CartThumb";
import { Button } from "@/components/ui/Button";
import { formatRupiah } from "@/lib/format";
import { ORDER_STATUS, formatDateTime } from "@/lib/order-status";
import type { MyOrder } from "@/lib/orders";

// Kartu satu pesanan di Riwayat pesanan (desktop-akun-checkout/04).
export function OrderCard({ order }: { order: MyOrder }) {
  const status = ORDER_STATUS[order.status];
  const first = order.items[0];
  const more = order.items.length - 1;
  const href = `/akun/pesanan/${order.order_number}`;

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-paper px-4 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-3.5 lg:py-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
          <strong className="text-sm lg:text-base">{order.order_number}</strong>
          <span className="text-[13px] text-muted lg:text-[15px]">{formatDateTime(order.created_at)}</span>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold lg:text-sm ${status?.cls ?? ""}`}>
          {status?.label ?? order.status}
        </span>
      </header>

      <div className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:gap-6 lg:py-5">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <CartThumb
            imageUrl={null}
            tone={first?.variant?.color_hex ?? "#EFE1E2"}
            alt=""
            className="w-14 lg:w-16"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[15px] font-semibold lg:text-base">{first?.product_name}</span>
            <span className="text-[13px] text-muted lg:text-sm">
              {more > 0 ? `+${more} produk lainnya` : `${first?.quantity ?? 0} produk`}
            </span>
            {order.status === "menunggu_pembayaran" && order.expires_at && (
              <span className="text-[13px] font-semibold text-status-bayar lg:text-sm">
                Bayar sebelum {formatDateTime(order.expires_at, false)}
              </span>
            )}
            {order.tracking_number && (
              <span className="text-[13px] font-semibold text-status-bayar lg:text-sm">Resi {order.tracking_number}</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 lg:gap-10">
          <div className="flex flex-col">
            <span className="text-xs text-muted lg:text-sm">Total</span>
            <strong className="text-base lg:text-lg">{formatRupiah(order.total)}</strong>
          </div>
          <Button href={href} variant="outline" size="md">
            Lihat detail
          </Button>
        </div>
      </div>
    </article>
  );
}
