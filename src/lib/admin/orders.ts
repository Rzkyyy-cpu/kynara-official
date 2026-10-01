import "server-only";

import type { OrderFilters, OrderTab } from "@/lib/validation/admin";
import { ORDER_TABS } from "@/lib/validation/admin";
import { createClient } from "@/lib/supabase/server";

// Query pesanan untuk halaman admin. Memakai koneksi bersesi (bukan kunci server),
// jadi RLS tetap berlaku: hanya admin yang bisa membaca pesanan semua pembeli.

export const ORDERS_PER_PAGE = 20;

const LIST_COLUMNS = `id, order_number, status, total, courier, courier_service, tracking_number,
  shipping_address, created_at, paid_at, items:order_items (count)`;

// Bentuk minimal query builder Supabase yang dipakai filter di bawah
type Filterable<T> = {
  eq(column: string, value: string): T;
  in(column: string, values: string[]): T;
  gte(column: string, value: string): T;
  or(filters: string): T;
};

function applyFilters<T extends Filterable<T>>(query: T, f: OrderFilters, tab: OrderTab): T {
  let q = query;
  if (tab === "batal") q = q.in("status", ["dibatalkan", "kedaluwarsa"]);
  else if (tab !== "semua") q = q.eq("status", tab);
  if (f.rentang !== "semua") {
    q = q.gte("created_at", new Date(Date.now() - Number(f.rentang) * 86_400_000).toISOString());
  }
  if (f.kurir !== "semua") q = q.eq("courier", f.kurir);
  if (f.q) {
    // q sudah divalidasi Zod (tanpa koma, kurung, kutip), jadi aman disusun ke filter "or"
    q = q.or(`order_number.ilike."*${f.q}*",shipping_address->>recipient_name.ilike."*${f.q}*"`);
  }
  return q;
}

export async function listOrders(f: OrderFilters) {
  const supabase = await createClient();
  const from = (f.hal - 1) * ORDERS_PER_PAGE;
  const { data, error, count } = await applyFilters(
    supabase.from("orders").select(LIST_COLUMNS, { count: "exact" }),
    f,
    f.status,
  )
    .order("created_at", { ascending: false })
    .range(from, from + ORDERS_PER_PAGE - 1);
  if (error) throw new Error(`Gagal memuat pesanan: ${error.message}`);
  return { rows: data, total: count ?? 0 };
}
export type AdminOrderRow = Awaited<ReturnType<typeof listOrders>>["rows"][number];

// Jumlah per tab (filter cari/tanggal/kurir tetap berlaku), dihitung paralel tanpa mengambil baris
export async function countOrdersByTab(f: OrderFilters): Promise<Record<OrderTab, number>> {
  const supabase = await createClient();
  const tabs = Object.keys(ORDER_TABS) as OrderTab[];
  const results = await Promise.all(
    tabs.map((tab) => applyFilters(supabase.from("orders").select("id", { count: "exact", head: true }), f, tab)),
  );
  return Object.fromEntries(tabs.map((tab, i) => [tab, results[i].count ?? 0])) as Record<OrderTab, number>;
}

// Untuk Unduh CSV: semua pesanan yang cocok dengan filter (dibatasi 5.000 baris)
export async function listOrdersForExport(f: OrderFilters) {
  const supabase = await createClient();
  const { data, error } = await applyFilters(
    supabase
      .from("orders")
      .select("order_number, status, subtotal, shipping_cost, total, courier_service, tracking_number, shipping_address, payment_method, created_at, paid_at"),
    f,
    f.status,
  )
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(`Gagal memuat pesanan: ${error.message}`);
  return data;
}

// Badge "Pesanan" di sidebar = pesanan lunas yang belum dikirim
export async function countOrdersToShip() {
  const supabase = await createClient();
  const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "diproses");
  return count ?? 0;
}

export async function getAdminOrder(orderNumber: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, subtotal, shipping_cost, total, total_weight_gram, courier, courier_service,
      tracking_number, shipping_address, payment_method, expires_at, created_at, paid_at,
      items:order_items (id, product_name, variant_label, price, quantity, variant:product_variants (color_hex, sku)),
      history:order_status_history (id, status, note, created_at),
      payments (provider_payment_id, method, channel_code, va_number, amount, status, expires_at, paid_at, created_at)`,
    )
    .eq("order_number", orderNumber)
    .order("id", { referencedTable: "order_status_history", ascending: true })
    .order("created_at", { referencedTable: "payments", ascending: false })
    .maybeSingle();
  if (error) throw new Error(`Gagal memuat pesanan: ${error.message}`);
  return data;
}
export type AdminOrderDetail = NonNullable<Awaited<ReturnType<typeof getAdminOrder>>>;
