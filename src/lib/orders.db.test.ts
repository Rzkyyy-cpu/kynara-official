import { randomUUID } from "node:crypto";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/types/database";

// Tes fungsi database create_order: pengurangan stok atomik & harga dari database.
// Jalankan dengan: npm run test:db
//
// Project yang dipakai: TEST_SUPABASE_URL + TEST_SUPABASE_SECRET_KEY kalau diisi (project khusus tes),
// kalau kosong memakai project utama. Semua data tes berawalan "zz-tes" dan dihapus lagi di akhir.
// CATATAN: sebelum toko jualan sungguhan, WAJIB pindah ke project tes terpisah.

try {
  process.loadEnvFile(".env.local");
} catch {
  // tidak ada .env.local (mis. di CI): pakai env yang sudah ada
}

const url = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.TEST_SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY;
const publishable = process.env.TEST_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const tag = `zz-tes-${Date.now().toString(36)}`;
const PRICE = 50_000;
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

describe.skipIf(!url || !secret)("create_order (database sungguhan)", () => {
  let db: SupabaseClient<Database>;
  const userIds: string[] = [];
  let productId = "";
  let variantId = "";

  async function makeUser() {
    const { data, error } = await db.auth.admin.createUser({
      email: `${tag}-${randomUUID().slice(0, 8)}@example.com`,
      password: randomUUID(),
      email_confirm: true,
    });
    if (error) throw error;
    userIds.push(data.user.id);
    return data.user.id;
  }

  async function fillCart(userId: string, quantity: number) {
    const { data: cart, error } = await db.from("carts").upsert({ user_id: userId }, { onConflict: "user_id" }).select("id").single();
    if (error) throw error;
    await db.from("cart_items").delete().eq("cart_id", cart.id);
    const { error: itemError } = await db.from("cart_items").insert({ cart_id: cart.id, variant_id: variantId, quantity });
    if (itemError) throw itemError;
    return cart.id;
  }

  async function setVariant(fields: { stock?: number; price?: number }) {
    const { error } = await db.from("product_variants").update(fields).eq("id", variantId);
    if (error) throw error;
  }

  async function stock() {
    const { data } = await db.from("product_variants").select("stock").eq("id", variantId).single();
    return data!.stock;
  }

  function order(userId: string, shipping = 10_000, expectedTotal: number | null = null) {
    return db.rpc("create_order", {
      p_user_id: userId,
      p_shipping_address: ADDRESS,
      p_courier: "jne",
      p_courier_service: "JNE Reguler",
      p_shipping_cost: shipping,
      ...(expectedTotal === null ? {} : { p_expected_total: expectedTotal }),
    });
  }

  beforeAll(async () => {
    db = createClient<Database>(url!, secret!, { auth: { persistSession: false, autoRefreshToken: false } });
    console.info(`[test:db] memakai ${process.env.TEST_SUPABASE_URL ? "project TES" : "project UTAMA"}, data berawalan ${tag}`);

    const { data: category, error: catError } = await db.from("categories").select("id").limit(1).single();
    if (catError) throw catError;
    const { data: product, error: pError } = await db
      .from("products")
      .insert({ category_id: category.id, name: "zz-tes Produk", slug: tag, material: "Tes", weight_gram: 100 })
      .select("id")
      .single();
    if (pError) throw pError;
    productId = product.id;
    const { data: variant, error: vError } = await db
      .from("product_variants")
      .insert({ product_id: productId, color_name: "Tes", color_hex: "#000000", sku: tag.toUpperCase(), price: PRICE, stock: 3 })
      .select("id")
      .single();
    if (vError) throw vError;
    variantId = variant.id;
  });

  beforeEach(async () => {
    await setVariant({ stock: 3, price: PRICE });
  });

  afterAll(async () => {
    if (!db) return;
    // Urutan penting: pesanan dulu (orders.user_id menahan penghapusan user), lalu produk, lalu user
    if (userIds.length) await db.from("orders").delete().in("user_id", userIds);
    if (productId) await db.from("products").delete().eq("id", productId);
    for (const id of userIds) await db.auth.admin.deleteUser(id);
  });

  it("membuat pesanan: stok berkurang, harga dari database, keranjang dikosongkan", async () => {
    const userId = await makeUser();
    const cartId = await fillCart(userId, 2);

    const { data, error } = await order(userId, 10_000, 2 * PRICE + 10_000);
    expect(error).toBeNull();
    const result = data as { id: string; order_number: string; total: number };
    expect(result.order_number).toMatch(/^KYN-\d{6}-\d{4,}$/);
    expect(result.total).toBe(2 * PRICE + 10_000);

    expect(await stock()).toBe(1);

    const { data: saved } = await db.from("orders").select("*, order_items (*)").eq("id", result.id).single();
    expect(saved!.status).toBe("menunggu_pembayaran");
    expect(saved!.subtotal).toBe(2 * PRICE);
    expect(saved!.total_weight_gram).toBe(200);
    expect(saved!.order_items).toHaveLength(1);
    expect(saved!.order_items[0]).toMatchObject({ price: PRICE, quantity: 2, variant_label: "Tes · All size" });
    const hours = (new Date(saved!.expires_at!).getTime() - Date.now()) / 3_600_000;
    expect(hours).toBeGreaterThan(23.9);
    expect(hours).toBeLessThanOrEqual(24);

    const { count } = await db.from("cart_items").select("id", { count: "exact", head: true }).eq("cart_id", cartId);
    expect(count).toBe(0);
  });

  it("stok kurang: pesanan ditolak dan TIDAK ADA yang berubah", async () => {
    const userId = await makeUser();
    const cartId = await fillCart(userId, 5); // stok hanya 3

    const { error } = await order(userId);
    expect(error?.message).toContain("STOK_KURANG");
    expect(await stock()).toBe(3);

    const { count: orders } = await db.from("orders").select("id", { count: "exact", head: true }).eq("user_id", userId);
    expect(orders).toBe(0);
    const { count: items } = await db.from("cart_items").select("id", { count: "exact", head: true }).eq("cart_id", cartId);
    expect(items).toBe(1);
  });

  it("harga naik setelah masuk keranjang: yang ditagih harga baru, dan total lama ditolak", async () => {
    const userId = await makeUser();
    await fillCart(userId, 1);
    await setVariant({ price: 60_000 });

    const stale = await order(userId, 10_000, PRICE + 10_000); // total yang dilihat pembeli masih harga lama
    expect(stale.error?.message).toContain("TOTAL_BERUBAH");
    expect(await stock()).toBe(3);

    const fresh = await order(userId, 10_000, 60_000 + 10_000);
    expect(fresh.error).toBeNull();
    expect((fresh.data as { total: number }).total).toBe(70_000);
  });

  it("dua pembeli berebut stok terakhir: hanya satu yang berhasil", async () => {
    await setVariant({ stock: 1 });
    const [a, b] = await Promise.all([makeUser(), makeUser()]);
    await Promise.all([fillCart(a, 1), fillCart(b, 1)]);

    const results = await Promise.all([order(a), order(b)]);
    const ok = results.filter((r) => !r.error);
    const failed = results.filter((r) => r.error);
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(failed[0].error?.message).toContain("STOK_KURANG");
    expect(await stock()).toBe(0);
  });

  it.skipIf(!publishable)("tidak bisa dipanggil langsung dari browser (kunci publik)", async () => {
    const userId = await makeUser();
    await fillCart(userId, 1);
    const browser = createClient<Database>(url!, publishable!, { auth: { persistSession: false } });
    const { error } = await browser.rpc("create_order", {
      p_user_id: userId,
      p_shipping_address: ADDRESS,
      p_courier: "jne",
      p_courier_service: "JNE Reguler",
      p_shipping_cost: 0,
    });
    expect(error).not.toBeNull();
    expect(await stock()).toBe(3);
  });
});
