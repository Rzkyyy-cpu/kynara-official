import { randomUUID } from "node:crypto";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/types/database";

// Tes aturan katalog admin (Fase 7B) di database sungguhan: npm run test:db.
// Dipanggil sebagai user LOGIN (kunci publik + sesi). Data tes berawalan "zz-tes" dan dihapus di akhir.

try {
  process.loadEnvFile(".env.local");
} catch {
  // tidak ada .env.local: pakai env yang sudah ada
}

const url = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.TEST_SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY;
const publishable = process.env.TEST_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const tag = `zz-tes-kat-${Date.now().toString(36)}`;
// PNG 1x1 yang sah
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

describe.skipIf(!url || !secret || !publishable)("admin katalog (database sungguhan)", () => {
  let db: SupabaseClient<Database>;
  let admin: SupabaseClient<Database>;
  let buyer: SupabaseClient<Database>;
  let buyerId = "";
  let categoryId = "";
  const userIds: string[] = [];
  const productIds: string[] = [];
  const files: string[] = [];

  async function login(role: "admin" | "user") {
    const email = `${tag}-${role}@example.com`;
    const password = randomUUID();
    const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    userIds.push(data.user.id);
    if (role === "admin") await db.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
    const client = createClient<Database>(url!, publishable!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;
    return { client, id: data.user.id };
  }

  const variant = (color: string, size: string, stock: number, extra: Record<string, unknown> = {}) => ({
    color_name: color,
    color_hex: "#9DAE9B",
    size_name: size,
    sku: `${tag}-${color}-${size}-${randomUUID().slice(0, 4)}`.toUpperCase(), // SKU unik di seluruh toko
    price: 79_000,
    stock,
    stock_before: stock,
    is_active: true,
    ...extra,
  });

  async function saveProduct(client: SupabaseClient<Database>, product: Record<string, unknown>) {
    const res = await client.rpc("admin_save_product", { p_product: product as never });
    if (!res.error && res.data) productIds.push(res.data);
    return res;
  }

  async function variants(productId: string) {
    const { data } = await db.from("product_variants").select("id, color_name, size_name, stock, is_active, sort_order").eq("product_id", productId).order("sort_order");
    return data!;
  }

  beforeAll(async () => {
    db = createClient<Database>(url!, secret!, { auth: { persistSession: false, autoRefreshToken: false } });
    console.info(`[test:db] memakai ${process.env.TEST_SUPABASE_URL ? "project TES" : "project UTAMA"}, data berawalan ${tag}`);
    const { data: cat } = await db.from("categories").select("id").eq("show_on_home", false).limit(1).maybeSingle();
    const { data: anyCat } = await db.from("categories").select("id").limit(1).single();
    categoryId = (cat ?? anyCat)!.id;
    admin = (await login("admin")).client;
    const b = await login("user");
    buyer = b.client;
    buyerId = b.id;
  });

  afterAll(async () => {
    if (!db) return;
    if (files.length) await db.storage.from("katalog").remove(files);
    await db.from("banners").delete().like("title", `${tag}%`);
    await db.from("categories").delete().like("slug", `${tag}%`);
    if (userIds.length) await db.from("orders").delete().in("user_id", userIds);
    if (productIds.length) await db.from("products").delete().in("id", productIds);
    for (const id of userIds) await db.auth.admin.deleteUser(id);
  });

  it("maks. 6 kategori di beranda dijaga database", async () => {
    const { count } = await db.from("categories").select("id", { count: "exact", head: true }).eq("show_on_home", true);
    // Isi beranda sampai 6 dengan kategori tes (kalau perlu), lalu yang ke-7 harus ditolak
    for (let i = count ?? 0; i < 6; i++) {
      const { error } = await admin.from("categories").insert({ name: `zz ${i}`, slug: `${tag}-isi-${i}`, show_on_home: true });
      expect(error).toBeNull();
    }
    const seventh = await admin.from("categories").insert({ name: "zz 7", slug: `${tag}-tujuh`, show_on_home: true });
    expect(seventh.error?.message).toContain("BERANDA_PENUH");
    const hidden = await admin.from("categories").insert({ name: "zz 7", slug: `${tag}-tujuh`, show_on_home: false });
    expect(hidden.error).toBeNull();
    const turnOn = await admin.from("categories").update({ show_on_home: true }).eq("slug", `${tag}-tujuh`);
    expect(turnOn.error?.message).toContain("BERANDA_PENUH");
  });

  it("maks. 3 banner tayang; draf tidak dihitung; pembeli tidak bisa menulis", async () => {
    const { count } = await db.from("banners").select("id", { count: "exact", head: true }).eq("is_published", true);
    const banner = (n: number, published: boolean) => ({ title: `${tag} ${n}`, cta_text: "Belanja", cta_href: "/koleksi", is_published: published });
    for (let i = count ?? 0; i < 3; i++) expect((await admin.from("banners").insert(banner(i, true))).error).toBeNull();
    expect((await admin.from("banners").insert(banner(9, true))).error?.message).toContain("BANNER_PENUH");
    expect((await admin.from("banners").insert(banner(9, false))).error).toBeNull();

    // Tautan ke situs luar ditolak
    const external = await admin.from("banners").insert({ ...banner(8, false), cta_href: "https://situs-lain.com" });
    expect(external.error).not.toBeNull();
    // Pembeli tidak bisa membuat banner
    expect((await buyer.from("banners").insert(banner(7, false))).error).not.toBeNull();
    // Pengunjung hanya melihat yang tayang
    const anon = createClient<Database>(url!, publishable!, { auth: { persistSession: false } });
    const { data } = await anon.from("banners").select("title, is_published").like("title", `${tag}%`);
    expect(data!.every((b) => b.is_published)).toBe(true);
  });

  it("simpan produk baru: produk, varian, dan foto tersimpan sekaligus; pembeli ditolak", async () => {
    const product = {
      category_id: categoryId,
      name: "zz-tes Produk Admin",
      slug: `${tag}-produk`,
      material: "Airflow",
      weight_gram: 150,
      is_active: false,
      variants: [variant("Sage", "Standar", 10), variant("Lilac", "Jumbo", 3)],
      images: [{ url: "https://contoh/a.webp", alt: "a" }],
    };
    expect((await saveProduct(buyer, product)).error?.message).toContain("BUKAN_ADMIN");

    const { data: id, error } = await saveProduct(admin, product);
    expect(error).toBeNull();
    const vs = await variants(id!);
    expect(vs.map((v) => [v.color_name, v.stock, v.sort_order])).toEqual([["Sage", 10, 0], ["Lilac", 3, 1]]);

    // Gagal di tengah (SKU kembar) = tidak ada yang tersimpan
    const a = variant("A", "X", 1);
    const dup = await saveProduct(admin, { ...product, slug: `${tag}-kembar`, variants: [a, { ...variant("B", "Y", 1), sku: a.sku }] });
    expect(dup.error).not.toBeNull();
    const { count } = await db.from("products").select("id", { count: "exact", head: true }).eq("slug", `${tag}-kembar`);
    expect(count).toBe(0);
  });

  it("stok disimpan sebagai selisih: pembelian saat admin mengedit tidak hilang", async () => {
    const { data: id } = await saveProduct(admin, {
      category_id: categoryId, name: "zz-tes Stok", slug: `${tag}-stok`, material: "Voal", weight_gram: 100, is_active: true,
      variants: [variant("Sage", "All size", 10)], images: [],
    });
    const [v] = await variants(id!);
    // Admin membuka form saat stok 10. Sementara itu ada pembelian 1 pcs (stok jadi 9).
    await db.from("product_variants").update({ stock: 9 }).eq("id", v.id);
    // Admin mengetik 15 lalu menyimpan
    const { error } = await saveProduct(admin, {
      id, category_id: categoryId, name: "zz-tes Stok", material: "Voal", weight_gram: 100, is_active: true,
      variants: [{ ...variant("Sage", "All size", 15), id: v.id, stock_before: 10 }], images: [],
    });
    expect(error).toBeNull();
    expect((await variants(id!))[0].stock).toBe(14);

    // Stok tidak boleh jadi minus
    const minus = await saveProduct(admin, {
      id, category_id: categoryId, name: "zz-tes Stok", material: "Voal", weight_gram: 100, is_active: true,
      variants: [{ ...variant("Sage", "All size", 0), id: v.id, stock_before: 20 }], images: [],
    });
    expect(minus.error).not.toBeNull();
    expect((await variants(id!))[0].stock).toBe(14);
  });

  it("varian yang pernah dipesan dinonaktifkan, produknya tidak bisa dihapus", async () => {
    const { data: id } = await saveProduct(admin, {
      category_id: categoryId, name: "zz-tes Dipesan", slug: `${tag}-dipesan`, material: "Voal", weight_gram: 100, is_active: true,
      variants: [variant("Sage", "All size", 5), variant("Mocha", "All size", 5)], images: [],
    });
    const [sage, mocha] = await variants(id!);
    // Pembeli memesan Sage
    const { data: cart } = await db.from("carts").upsert({ user_id: buyerId }, { onConflict: "user_id" }).select("id").single();
    await db.from("cart_items").insert({ cart_id: cart!.id, variant_id: sage.id, quantity: 1 });
    const order = await db.rpc("create_order", {
      p_user_id: buyerId,
      p_shipping_address: { label: "Rumah", recipient_name: "Tes", phone: "081234567890", province: "Jawa Barat", city: "Kota Bandung", district: "Coblong", postal_code: "40132", street: "Jl. Tes No. 1", landmark: null },
      p_courier: "jne", p_courier_service: "JNE Reguler", p_shipping_cost: 10_000,
    });
    expect(order.error).toBeNull();

    // Admin membuang kedua varian dari form, menambah varian baru
    const { error } = await saveProduct(admin, {
      id, category_id: categoryId, name: "zz-tes Dipesan", material: "Voal", weight_gram: 100, is_active: true,
      variants: [variant("Arang", "All size", 2)], images: [],
    });
    expect(error).toBeNull();
    const after = await variants(id!);
    expect(after.find((v) => v.id === sage.id)?.is_active).toBe(false); // pernah dipesan: dinonaktifkan
    expect(after.find((v) => v.id === mocha.id)).toBeUndefined(); // belum pernah dipesan: dihapus
    expect(after.some((v) => v.color_name === "Arang")).toBe(true);

    const del = await admin.from("products").delete().eq("id", id!);
    expect(del.error?.message).toContain("PRODUK_PERNAH_DIPESAN");
  });

  it("Storage: hanya admin yang bisa unggah; tipe & ukuran dibatasi bucket; foto bisa dilihat publik", async () => {
    const path = `tes/${tag}.png`;
    const asBuyer = await buyer.storage.from("katalog").upload(`tes/${tag}-b.png`, PNG, { contentType: "image/png" });
    expect(asBuyer.error).not.toBeNull();

    const ok = await admin.storage.from("katalog").upload(path, PNG, { contentType: "image/png" });
    expect(ok.error).toBeNull();
    files.push(path);
    const publicUrl = admin.storage.from("katalog").getPublicUrl(path).data.publicUrl;
    expect((await fetch(publicUrl)).status).toBe(200);

    const html = await admin.storage.from("katalog").upload(`tes/${tag}.html`, Buffer.from("<script>alert(1)</script>"), { contentType: "text/html" });
    expect(html.error).not.toBeNull();
    const big = await admin.storage.from("katalog").upload(`tes/${tag}-besar.png`, Buffer.alloc(2_200_000), { contentType: "image/png" });
    expect(big.error).not.toBeNull();

    // Pembeli tidak bisa menghapus foto admin
    await buyer.storage.from("katalog").remove([path]);
    expect((await fetch(publicUrl)).status).toBe(200);
  });

  // Fase 8A: policy "for all" dipecah jadi insert/update/delete. Hak akses harus tetap sama.
  it("policy katalog per operasi: admin bisa ubah, pembeli tidak bisa tambah/ubah/hapus", async () => {
    const slug = `${tag}-policy`;
    expect((await admin.from("categories").insert({ name: "zz policy", slug })).error).toBeNull();
    const renamed = await admin.from("categories").update({ name: "zz policy 2" }).eq("slug", slug).select("id");
    expect(renamed.data).toHaveLength(1);

    // Pembeli: insert ditolak, update & delete tidak mengenai baris apa pun (RLS menyaring diam-diam)
    expect((await buyer.from("categories").insert({ name: "zz", slug: `${tag}-pembeli` })).error).not.toBeNull();
    expect((await buyer.from("categories").update({ name: "dibobol" }).eq("slug", slug).select("id")).data ?? []).toHaveLength(0);
    expect((await buyer.from("categories").delete().eq("slug", slug).select("id")).data ?? []).toHaveLength(0);
    // Hanya menyasar produk tes (project utama dipakai bersama data asli)
    expect(productIds.length).toBeGreaterThan(0);
    expect((await buyer.from("products").update({ name: "dibobol" }).in("id", productIds).select("id")).data ?? []).toHaveLength(0);
    expect((await buyer.from("product_variants").update({ price: 1 }).in("product_id", productIds).select("id")).data ?? []).toHaveLength(0);
    expect((await buyer.from("product_images").delete().in("product_id", productIds).select("id")).data ?? []).toHaveLength(0);

    const { data: still } = await db.from("categories").select("name").eq("slug", slug).single();
    expect(still!.name).toBe("zz policy 2");
  });
});
