import { randomUUID } from "node:crypto";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/types/database";

// Tes fungsi database pembayaran (Komerce): apply_payment_status (idempoten) & expire_overdue_orders.
// Tidak memanggil Komerce: baris payments dibuat langsung, lalu status "dari Komerce" disimulasikan.
// Jalankan dengan: npm run test:db  (lihat catatan project tes di orders.db.test.ts)

try {
  process.loadEnvFile(".env.local");
} catch {
  // tidak ada .env.local (mis. di CI): pakai env yang sudah ada
}

const url = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.TEST_SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY;
const publishable = process.env.TEST_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const tag = `zz-tes-bayar-${Date.now().toString(36)}`;
const PRICE = 50_000;
const SHIPPING = 10_000;
const TOTAL = 2 * PRICE + SHIPPING;
const ADDRESS = { label: "Rumah", recipient_name: "Pembeli Tes", phone: "081234567890", street: "Jl. Tes" };

describe.skipIf(!url || !secret)("pembayaran (database sungguhan)", () => {
  let db: SupabaseClient<Database>;
  let userId = "";
  let productId = "";
  let variantId = "";

  // Pesanan baru berisi 2 pcs (stok 5 -> 3)
  async function newOrder() {
    const { data: cart, error } = await db.from("carts").upsert({ user_id: userId }, { onConflict: "user_id" }).select("id").single();
    if (error) throw error;
    await db.from("cart_items").delete().eq("cart_id", cart.id);
    const { error: itemError } = await db.from("cart_items").insert({ cart_id: cart.id, variant_id: variantId, quantity: 2 });
    if (itemError) throw itemError;
    const { data, error: orderError } = await db.rpc("create_order", {
      p_user_id: userId,
      p_shipping_address: ADDRESS,
      p_courier: "jne",
      p_courier_service: "JNE Reguler",
      p_shipping_cost: SHIPPING,
    });
    if (orderError) throw orderError;
    return data as { id: string; order_number: string };
  }

  // Satu percobaan bayar (seperti yang disimpan server setelah Komerce membuat VA/QR)
  async function newPayment(orderId: string, method: "va" | "qris" = "va") {
    const id = `${tag}-${randomUUID().slice(0, 8)}`;
    const { error } = await db.from("payments").insert({
      order_id: orderId,
      provider_payment_id: id,
      method,
      channel_code: method === "va" ? "BCA" : null,
      va_number: method === "va" ? "8808000011112222" : null,
      amount: TOTAL,
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    });
    if (error) throw error;
    return id;
  }

  const apply = (paymentId: string, status: string, amount = TOTAL) =>
    db.rpc("apply_payment_status", { p_payment_id: paymentId, p_status: status, p_amount: amount });

  async function state(orderId: string) {
    const [{ data: order }, { data: variant }, { data: product }, { data: history }, { data: payments }] = await Promise.all([
      db.from("orders").select("status, paid_at, payment_method").eq("id", orderId).single(),
      db.from("product_variants").select("stock").eq("id", variantId).single(),
      db.from("products").select("sold_count").eq("id", productId).single(),
      db.from("order_status_history").select("status, note").eq("order_id", orderId).order("created_at"),
      db.from("payments").select("provider_payment_id, status").eq("order_id", orderId),
    ]);
    return { order: order!, stock: variant!.stock, sold: product!.sold_count, history: history ?? [], payments: payments ?? [] };
  }

  beforeAll(async () => {
    db = createClient<Database>(url!, secret!, { auth: { persistSession: false, autoRefreshToken: false } });
    console.info(`[test:db] memakai ${process.env.TEST_SUPABASE_URL ? "project TES" : "project UTAMA"}, data berawalan ${tag}`);

    const { data: user, error: userError } = await db.auth.admin.createUser({
      email: `${tag}@example.com`,
      password: randomUUID(),
      email_confirm: true,
    });
    if (userError) throw userError;
    userId = user.user.id;

    const { data: category } = await db.from("categories").select("id").limit(1).single();
    const { data: product, error: pError } = await db
      .from("products")
      .insert({ category_id: category!.id, name: "zz-tes Produk Bayar", slug: tag, material: "Tes", weight_gram: 100 })
      .select("id")
      .single();
    if (pError) throw pError;
    productId = product.id;
    const { data: variant, error: vError } = await db
      .from("product_variants")
      .insert({ product_id: productId, color_name: "Tes", color_hex: "#000000", sku: tag.toUpperCase(), price: PRICE, stock: 5 })
      .select("id")
      .single();
    if (vError) throw vError;
    variantId = variant.id;
  });

  beforeEach(async () => {
    await db.from("product_variants").update({ stock: 5 }).eq("id", variantId);
    await db.from("products").update({ sold_count: 0 }).eq("id", productId);
  });

  afterAll(async () => {
    if (!db) return;
    if (userId) await db.from("orders").delete().eq("user_id", userId); // payments ikut terhapus (cascade)
    if (productId) await db.from("products").delete().eq("id", productId);
    if (userId) await db.auth.admin.deleteUser(userId);
  });

  it("lunas: pesanan diproses & sold_count bertambah SEKALI walau callback dikirim dua kali bersamaan", async () => {
    const o = await newOrder();
    const pay = await newPayment(o.id);
    const results = await Promise.all([apply(pay, "PAID"), apply(pay, "PAID")]);
    expect(results.map((r) => r.error)).toEqual([null, null]);
    expect(results.map((r) => r.data).sort()).toEqual(["ignored", "paid"]);

    const s = await state(o.id);
    expect(s.order).toMatchObject({ status: "diproses", payment_method: "BCA Virtual Account" });
    expect(s.order.paid_at).not.toBeNull();
    expect(s.sold).toBe(2);
    expect(s.stock).toBe(3); // stok tetap terpotong
    expect(s.history.map((h) => h.status)).toEqual(["menunggu_pembayaran", "diproses"]);
  });

  it("QR kedaluwarsa TIDAK membatalkan pesanan; QR baru tetap bisa dibayar", async () => {
    const o = await newOrder();
    const qr1 = await newPayment(o.id, "qris");
    expect((await apply(qr1, "EXPIRED")).data).toBe("closed");
    expect((await apply(qr1, "EXPIRED")).data).toBe("ignored");

    let s = await state(o.id);
    expect(s.order.status).toBe("menunggu_pembayaran");
    expect(s.stock).toBe(3); // stok masih disimpan

    const qr2 = await newPayment(o.id, "qris");
    expect((await apply(qr2, "PAID")).data).toBe("paid");
    s = await state(o.id);
    expect(s.order).toMatchObject({ status: "diproses", payment_method: "QRIS" });
  });

  it("dibayar dua kali (VA lama & QR baru): yang kedua dicatat sebagai pembayaran ganda", async () => {
    const o = await newOrder();
    const va = await newPayment(o.id, "va");
    await db.from("payments").update({ status: "CANCELED" }).eq("provider_payment_id", va); // pembeli ganti metode
    const qr = await newPayment(o.id, "qris");

    expect((await apply(qr, "PAID")).data).toBe("paid");
    expect((await apply(va, "PAID")).data).toBe("duplicate_payment"); // VA terlanjur dibayar: uang tetap dicatat
    expect((await apply(va, "PAID")).data).toBe("ignored");

    const s = await state(o.id);
    expect(s.sold).toBe(2); // tetap sekali
    expect(s.history.filter((h) => h.note === "PEMBAYARAN_GANDA")).toHaveLength(1);
    expect(s.payments.every((p) => p.status === "PAID")).toBe(true);
  });

  it("menolak jumlah bayar yang tidak sama & pembayaran yang tidak dikenal", async () => {
    const o = await newOrder();
    const pay = await newPayment(o.id);
    const wrong = await apply(pay, "PAID", 1_000);
    expect(wrong.error?.message).toContain("JUMLAH_TIDAK_COCOK");
    expect((await state(o.id)).order.status).toBe("menunggu_pembayaran");

    const missing = await apply("KOMPAY-tidak-ada", "PAID");
    expect(missing.error?.message).toContain("PEMBAYARAN_TIDAK_ADA");
  });

  it("jaring pengaman: pesanan lewat batas bayar kedaluwarsa, stok kembali, VA ditutup, lalu bayar telat dicatat", async () => {
    const o = await newOrder();
    const fresh = await newOrder(); // belum lewat batas: tidak boleh ikut
    const va = await newPayment(o.id);
    await db.from("orders").update({ expires_at: new Date(Date.now() - 60 * 60_000).toISOString() }).eq("id", o.id);
    expect((await state(o.id)).stock).toBe(1);

    const { data, error } = await db.rpc("expire_overdue_orders");
    expect(error).toBeNull();
    expect(data).toBeGreaterThanOrEqual(1);

    let s = await state(o.id);
    expect(s.order.status).toBe("kedaluwarsa");
    expect(s.payments[0].status).toBe("EXPIRED");
    expect(s.stock).toBe(3); // hanya 2 pcs pesanan pertama yang kembali
    expect((await state(fresh.id)).order.status).toBe("menunggu_pembayaran");

    // VA ternyata tetap dibayar di detik terakhir
    expect((await apply(va, "PAID")).data).toBe("late_payment");
    s = await state(o.id);
    expect(s.order.status).toBe("kedaluwarsa"); // tidak berubah otomatis
    expect(s.sold).toBe(0);
    expect(s.history.filter((h) => h.note === "PEMBAYARAN_TERLAMBAT")).toHaveLength(1);
  });

  it.skipIf(!publishable)("tidak bisa diubah dari browser (kunci publik)", async () => {
    const o = await newOrder();
    const pay = await newPayment(o.id);
    const browser = createClient<Database>(url!, publishable!, { auth: { persistSession: false } });
    const { error } = await browser.rpc("apply_payment_status", { p_payment_id: pay, p_status: "PAID", p_amount: TOTAL });
    expect(error).not.toBeNull();
    const insert = await browser.from("payments").insert({ order_id: o.id, provider_payment_id: "x", method: "qris", amount: 1, expires_at: new Date().toISOString() });
    expect(insert.error).not.toBeNull();
    expect((await state(o.id)).order.status).toBe("menunggu_pembayaran");
  });
});
