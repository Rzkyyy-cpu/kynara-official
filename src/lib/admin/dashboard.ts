import "server-only";

import type { OrderStatus } from "@/lib/admin/order-rules";
import { createClient } from "@/lib/supabase/server";
import type { Period } from "@/lib/validation/admin";

// Angka ringkasan admin. Semua dihitung fungsi database admin_dashboard, jadi yang dikirim
// ke server Next.js hanya hasil akhirnya (bukan seluruh data pesanan).

export type Dashboard = {
  period: Period;
  from: string; // tanggal awal periode (WIB), "2026-09-02"
  to: string;
  sales: number;
  orders: number;
  prev_sales: number;
  prev_orders: number;
  today_sales: number;
  today_orders: number;
  month_sales: number;
  month_orders: number;
  daily: { date: string; sales: number }[];
  status_counts: Partial<Record<OrderStatus, number>>;
  low_stock_count: number;
  low_stock: { product_id: string; product_name: string; color_name: string; size_name: string; stock: number }[];
  top_products: { product_id: string | null; name: string; qty: number; image_url: string | null }[];
  recent_orders: { order_number: string; buyer: string | null; total: number; status: OrderStatus; created_at: string }[];
};

export async function getDashboard(period: Period): Promise<Dashboard> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_dashboard", { p_period: period });
  if (error) throw new Error(`Gagal memuat ringkasan: ${error.message}`);
  return data as unknown as Dashboard;
}
