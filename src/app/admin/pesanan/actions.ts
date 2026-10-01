"use server";

import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/admin/auth";
import { type OrderStatus, adminOrderError } from "@/lib/admin/order-rules";
import { cancelPayment } from "@/lib/komerce-payment/client";
import { createClient } from "@/lib/supabase/server";
import { type UpdateOrderInput, orderNumberSchema, updateOrderSchema } from "@/lib/validation/admin";

// Aksi admin untuk pesanan. Setiap aksi:
//  1. memastikan pemanggilnya admin (getAdmin, lapis server),
//  2. memvalidasi input dengan Zod,
//  3. memanggil fungsi database yang MENGECEK ADMIN LAGI dan memegang aturan statusnya.

export type ActionResult = { ok: true; status?: OrderStatus } | { ok: false; error: string };

const NOT_ADMIN: ActionResult = { ok: false, error: "Sesi admin berakhir. Silakan masuk lagi." };

export async function updateOrderStatus(input: UpdateOrderInput): Promise<ActionResult> {
  if (!(await getAdmin())) return NOT_ADMIN;
  const parsed = updateOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { nomor, status, resi } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_update_order", {
    p_order_number: nomor,
    p_status: status,
    p_tracking: resi,
  });
  if (error) {
    const message = adminOrderError(error.message);
    if (message.startsWith("Gagal")) console.error("admin_update_order:", error.message);
    return { ok: false, error: message };
  }

  // VA yang masih menunggu ditutup juga di Komerce, supaya pembeli tidak bisa membayar pesanan batal.
  // Kalau gagal ditutup lalu tetap dibayar, apply_payment_status mencatatnya sebagai pembayaran terlambat.
  const result = data as { status: OrderStatus; closed_payments: string[] };
  for (const paymentId of result.closed_payments) {
    try {
      await cancelPayment(paymentId, "Pesanan dibatalkan oleh toko");
    } catch (e) {
      console.error(`tutup VA ${paymentId}:`, e instanceof Error ? e.message : e);
    }
  }

  // Pembatalan mengembalikan stok, jadi katalog toko ikut diperbarui
  revalidatePath(result.status === "dibatalkan" ? "/" : "/admin", "layout");
  return { ok: true, status: result.status };
}

export async function resolvePaymentIssue(nomor: string): Promise<ActionResult> {
  if (!(await getAdmin())) return NOT_ADMIN;
  if (!orderNumberSchema.safeParse(nomor).success) return { ok: false, error: "Nomor pesanan tidak valid." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_resolve_payment_issue", { p_order_number: nomor });
  if (error) {
    console.error("admin_resolve_payment_issue:", error.message);
    return { ok: false, error: adminOrderError(error.message) };
  }
  revalidatePath(`/admin/pesanan/${nomor}`);
  return { ok: true };
}
