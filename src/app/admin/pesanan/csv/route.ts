import type { NextRequest } from "next/server";
import { getAdmin } from "@/lib/admin/auth";
import { toCsv } from "@/lib/admin/csv";
import { listOrdersForExport } from "@/lib/admin/orders";
import type { AddressSnapshot } from "@/lib/checkout";
import { ORDER_STATUS, formatDateTime } from "@/lib/order-status";
import { orderFiltersSchema } from "@/lib/validation/admin";

// Unduh CSV pesanan sesuai filter yang sedang aktif (admin-desktop/02, tombol "Unduh CSV").
// Route handler tidak lewat layout admin, jadi hak admin dicek ulang di sini.
export async function GET(request: NextRequest) {
  if (!(await getAdmin())) return new Response("Not found", { status: 404 });

  const f = orderFiltersSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const orders = await listOrdersForExport(f);

  const csv = toCsv(
    ["No. pesanan", "Tanggal", "Status", "Pembeli", "No. HP", "Kota", "Provinsi", "Kurir", "Nomor resi", "Subtotal", "Ongkir", "Total", "Metode bayar", "Dibayar"],
    orders.map((o) => {
      const a = o.shipping_address as AddressSnapshot;
      return [
        o.order_number,
        formatDateTime(o.created_at),
        ORDER_STATUS[o.status]?.label ?? o.status,
        a.recipient_name,
        a.phone,
        a.city,
        a.province,
        o.courier_service,
        o.tracking_number,
        o.subtotal,
        o.shipping_cost,
        o.total,
        o.payment_method,
        o.paid_at ? formatDateTime(o.paid_at) : null,
      ];
    }),
  );

  const stamp = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta" }).format(new Date()); // 2026-10-01
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kynara-pesanan-${stamp}.csv"`,
      "Cache-Control": "private, no-store", // berisi data pribadi pembeli
    },
  });
}
