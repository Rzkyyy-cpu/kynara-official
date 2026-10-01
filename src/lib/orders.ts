import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

// Query pesanan milik user yang login. RLS orders/order_items memastikan hanya pesanan
// miliknya yang terbaca; filter user_id tetap ditulis supaya maksud query jelas.

export type OrderStatus = Database["public"]["Enums"]["order_status"];

const ORDER_COLUMNS = `id, order_number, status, subtotal, shipping_cost, total, total_weight_gram,
  courier, courier_service, tracking_number, shipping_address, expires_at, created_at,
  paid_at, payment_method,
  items:order_items (id, product_name, variant_label, price, quantity, variant:product_variants (color_hex))`;

// Detail satu pesanan juga memuat riwayat status (timeline) dan percobaan bayar (VA/QR)
const ORDER_DETAIL_COLUMNS = `${ORDER_COLUMNS}, history:order_status_history (status, note, created_at),
  payments (provider_payment_id, method, channel_code, va_number, qr_string, payment_url, amount, status, expires_at, created_at)`;

export async function getMyOrders(userId: string, status?: OrderStatus) {
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(`Gagal memuat pesanan: ${error.message}`);
  return data;
}

export async function getMyOrder(userId: string, orderNumber: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_DETAIL_COLUMNS)
    .eq("user_id", userId)
    .eq("order_number", orderNumber)
    .order("created_at", { referencedTable: "order_status_history", ascending: true })
    .order("created_at", { referencedTable: "payments", ascending: false })
    .maybeSingle();
  if (error) throw new Error(`Gagal memuat pesanan: ${error.message}`);
  return data;
}

export type MyOrder = Awaited<ReturnType<typeof getMyOrders>>[number];
export type MyOrderDetail = NonNullable<Awaited<ReturnType<typeof getMyOrder>>>;
