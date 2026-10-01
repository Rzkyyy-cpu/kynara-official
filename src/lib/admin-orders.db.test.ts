import { randomUUID } from "node:crypto";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/types/database";

// Tes fungsi database admin (Fase 7A): admin_update_order, admin_resolve_payment_issue, admin_dashboard.
// Jalankan dengan: npm run test:db. Data tes berawalan "zz-tes" dan dihapus lagi di akhir.
// Fungsi dipanggil sebagai user yang LOGIN (kunci publik + sesi), sama seperti dari website,
// supaya pengecekan is_admin() benar-benar diuji.

try {
  process.loadEnvFile(".env.local");
} catch {
  // tidak ada .env.local: pakai env yang sudah ada
}

const url = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.TEST_SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY;
const publishable = process.env.TEST_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const tag = `zz-tes-adm-${Date.now().toString(36)}`;
const PRICE = 40_000;
const STOCK = 5;
const ADDRESS = {
  label: "Rumah",
  recipient_name: "Pembeli Tes",
  phone: "081234567890",
  province: "Jawa Barat",
  city: "Kota Bandung",
  district: "Coblong",
  postal_code: "40132",
  street: "Jl. Tes No. 1",
  landmark: null,
};

describe.skipIf(!url || !secret || !publishable)("admin pesanan (database sungguhan)", () => {
  let db: SupabaseClient<Database>; // server (service_role)
  let admin: SupabaseClient<Database>; // admin yang login
  let buyer: SupabaseClient<Database>; // pembeli biasa yang login
  let buyerId = "";
  const userIds: string[] = [];
  let productId = "";
  let variantId = "";

  async function login(role: "admin" | "user") {
    const email = `${tag}-${role}-${randomUUID().slice(0, 6)}@example.com`;
    const password = randomUUID();
    const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    userIds.push(data.user.id);
    if (role === "admin") {
      const { error: roleError } = await db.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
      if (roleError) throw roleError;
    }
    const client = createClient<Database>(url!, publishable!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;
    return { client, id: data.user.id };
  }

  // Pesanan 2 pcs lewat create_order (stok berkurang 2)
  async function makeOrder(status: "menunggu_pembayaran" | "diproses" = "menunggu_pembayaran") {
    const { data: cart, error } = await db.from("carts").upsert({ user_id: buyerId }, { onConflict: "user_id" }).select("id").single();
    if (error) throw error;
    await db.from("cart_items").delete().eq("cart_id", cart.id);
    await db.from("cart_items").insert({ cart_id: cart.id, variant_id: variantId, quantity: 2 });
    const { data, error: orderError } = await db.rpc("create_order", {
      p_user_id: buyerId,
      p_shipping_address: ADDRESS,
      p_courier: "jne",
      p_courier_service: "JNE Reguler",
      p_shipping_cost: 10_000,
    });
    if (orderError) throw orderError;
    const order = data as { id: string; order_number: string; total: number };
    if (status === "diproses") {
      // Tiruan "pembayaran diterima" (apply_payment_status ikut menambah sold_count)
      await db.from("orders").update({ status: "diproses", paid_at: new Date().toISOString() }).eq("id", order.id);
      await db.from("products").update({ sold_count: 2 }).eq("id", productId);
    }
    return order;
  }

  async function variantStock() {
    const { data } = await db.from("product_variants").select("stock").eq("id", variantId).single();
    return data!.stock;
  }

  async function history(orderId: string) {
    const { data } = await db.from("order_status_history").select("status, note").eq("order_id", orderId).order("id");
    return data!;
  }

  beforeAll(async () => {
    db = createClient<Database>(url!, secret!, { auth: { persistSession: false, autoRefreshToken: false } });
    console.info(`[test:db] memakai ${process.env.TEST_SUPABASE_URL ? "project TES" : "project UTAMA"}, data berawalan ${tag}`);

    const { data: category, error: catError } = await db.from("categories").select("id").limit(1).single();
    if (catError) throw catError;
    const { data: product, error: pError } = await db
      .from("products")
      .insert({ category_id: category.id, name: "zz-tes Admin", slug: tag, material: "Tes", weight_gram: 100 })
      .select("id")
      .single();
    if (pError) throw pError;
    productId = product.id;
    const { data: variant, error: vError } = await db
      .from("product_variants")
      .insert({ product_id: productId, color_name: "Tes", color_hex: "#000000", sku: tag.toUpperCase(), price: PRICE, stock: STOCK })
      .select("id")
      .single();
    if (vError) throw vError;
    variantId = variant.id;

    admin = (await login("admin")).client;
    const b = await login("user");
    buyer = b.client;
    buyerId = b.id;
  });

  beforeEach(async () => {
    await db.from("product_variants").update({ stock: STOCK }).eq("id", variantId);
    await db.from("products").update({ sold_count: 0 }).eq("id", productId);
  });

  afterAll(async () => {
    if (!db) return;
    if (userIds.length) await db.from("orders").delete().in("user_id", userIds);
    if (productId) await db.from("products").delete().eq("id", productId);
    for (const id of userIds) await db.auth.admin.deleteUser(id);
  });

  it("pembeli biasa ditolak: tidak bisa ubah status, tandai masalah, atau baca ringkasan", async () => {
    const order = await makeOrder();

    const update = await buyer.rpc("admin_update_order", { p_order_number: order.order_number, p_status: "dibatalkan" });
    expect(update.error?.message).toContain("BUKAN_ADMIN");
    const resolve = await buyer.rpc("admin_resolve_payment_issue", { p_order_number: order.order_number });
    expect(resolve.error?.message).toContain("BUKAN_ADMIN");
    const dash = await buyer.rpc("admin_dashboard", { p_period: "30" });
    expect(dash.error?.message).toContain("BUKAN_ADMIN");

    // Ubah langsung ke tabel juga ditolak (hak update sudah dicabut)
    const direct = await buyer.from("orders").update({ status: "dibatalkan" }).eq("id", order.id);
    expect(direct.error).not.toBeNull();

    const { data } = await db.from("orders").select("status").eq("id", order.id).single();
    expect(data!.status).toBe("menunggu_pembayaran");
    expect(await variantStock()).toBe(STOCK - 2);
  });

  it("admin pun tidak bisa mengubah kolom pesanan langsung, harus lewat fungsi", async () => {
    const order = await makeOrder();
    const { error } = await admin.from("orders").update({ status: "dibatalkan" }).eq("id", order.id);
    expect(error).not.toBeNull();
    expect(await variantStock()).toBe(STOCK - 2);
  });

  it("batalkan pesanan menunggu: stok kembali, VA yang menunggu ditutup, dicatat DIBATALKAN_ADMIN", async () => {
    const order = await makeOrder();
    const paymentId = `${tag}-va-${randomUUID().slice(0, 6)}`;
    await db.from("payments").insert({
      order_id: order.id,
      provider_payment_id: paymentId,
      method: "va",
      channel_code: "BCA",
      amount: order.total,
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    });
    expect(await variantStock()).toBe(STOCK - 2);

    const { data, error } = await admin.rpc("admin_update_order", { p_order_number: order.order_number, p_status: "dibatalkan" });
    expect(error).toBeNull();
    expect(data).toEqual({ status: "dibatalkan", closed_payments: [paymentId] });

    expect(await variantStock()).toBe(STOCK);
    const { data: pay } = await db.from("payments").select("status").eq("provider_payment_id", paymentId).single();
    expect(pay!.status).toBe("CANCELED");
    expect(await history(order.id)).toContainEqual({ status: "dibatalkan", note: "DIBATALKAN_ADMIN" });

    // Dibatalkan dua kali tidak mengembalikan stok dua kali
    const again = await admin.rpc("admin_update_order", { p_order_number: order.order_number, p_status: "dibatalkan" });
    expect(again.error?.message).toContain("PERPINDAHAN_TIDAK_BOLEH");
    expect(await variantStock()).toBe(STOCK);
  });

  it("alur kirim: resi wajib, tidak bisa mundur, lalu selesai", async () => {
    const order = await makeOrder("diproses");
    const n = order.order_number;

    const noResi = await admin.rpc("admin_update_order", { p_order_number: n, p_status: "dikirim" });
    expect(noResi.error?.message).toContain("RESI_WAJIB");
    const badResi = await admin.rpc("admin_update_order", { p_order_number: n, p_status: "dikirim", p_tracking: "<script>" });
    expect(badResi.error?.message).toContain("RESI_TIDAK_VALID");

    const shipped = await admin.rpc("admin_update_order", { p_order_number: n, p_status: "dikirim", p_tracking: " JNE0123456781 " });
    expect(shipped.error).toBeNull();

    // Koreksi resi saat dikirim boleh, mengosongkan tidak boleh
    expect((await admin.rpc("admin_update_order", { p_order_number: n, p_status: "dikirim", p_tracking: "JNE0123456782" })).error).toBeNull();
    expect((await admin.rpc("admin_update_order", { p_order_number: n, p_status: "dikirim", p_tracking: "" })).error?.message).toContain("RESI_WAJIB");

    const back = await admin.rpc("admin_update_order", { p_order_number: n, p_status: "diproses" });
    expect(back.error?.message).toContain("PERPINDAHAN_TIDAK_BOLEH");

    expect((await admin.rpc("admin_update_order", { p_order_number: n, p_status: "selesai" })).error).toBeNull();
    const { data } = await db.from("orders").select("status, tracking_number").eq("id", order.id).single();
    expect(data).toEqual({ status: "selesai", tracking_number: "JNE0123456782" });
  });

  it("admin tidak bisa menandai lunas: menunggu -> diproses ditolak", async () => {
    const order = await makeOrder();
    const { error } = await admin.rpc("admin_update_order", { p_order_number: order.order_number, p_status: "diproses" });
    expect(error?.message).toContain("PERPINDAHAN_TIDAK_BOLEH");
  });

  it("batalkan pesanan lunas: stok & terlaris kembali, dicatat PERLU_REFUND, lalu ditandai ditangani", async () => {
    const order = await makeOrder("diproses");
    const { error } = await admin.rpc("admin_update_order", { p_order_number: order.order_number, p_status: "dibatalkan" });
    expect(error).toBeNull();

    expect(await variantStock()).toBe(STOCK);
    const { data: product } = await db.from("products").select("sold_count").eq("id", productId).single();
    expect(product!.sold_count).toBe(0);
    expect(await history(order.id)).toContainEqual({ status: "dibatalkan", note: "PERLU_REFUND" });

    expect((await admin.rpc("admin_resolve_payment_issue", { p_order_number: order.order_number })).error).toBeNull();
    expect((await history(order.id)).at(-1)).toEqual({ status: "dibatalkan", note: "MASALAH_BAYAR_DITANGANI" });
  });

  it("ringkasan untuk admin: angka lengkap, periode salah ditolak", async () => {
    const { data, error } = await admin.rpc("admin_dashboard", { p_period: "7" });
    expect(error).toBeNull();
    const d = data as Record<string, unknown>;
    expect(d).toMatchObject({ period: "7" });
    for (const key of ["sales", "orders", "prev_sales", "today_sales", "month_sales", "status_counts", "low_stock", "top_products", "recent_orders"]) {
      expect(d).toHaveProperty(key);
    }
    expect(d.daily).toHaveLength(7);

    const bad = await admin.rpc("admin_dashboard", { p_period: "365" });
    expect(bad.error?.message).toContain("PERIODE_TIDAK_VALID");
  });
});
