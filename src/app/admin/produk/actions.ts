"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdmin } from "@/lib/admin/auth";
import { catalogError } from "@/lib/admin/errors";
import { removeStorageFiles } from "@/lib/admin/storage";
import { createClient } from "@/lib/supabase/server";
import { type ProductInput, productSchema, slugify } from "@/lib/validation/admin-catalog";

// Aksi admin untuk produk. Pola sama dengan aksi pesanan: cek admin -> validasi Zod ->
// tulis lewat koneksi bersesi (RLS + pengecekan admin di fungsi database).

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };
type Result = { ok: true } | { ok: false; error: string };

const NOT_ADMIN = { ok: false as const, error: "Sesi admin berakhir. Silakan masuk lagi." };

export async function saveProduct(input: ProductInput): Promise<SaveResult> {
  if (!(await getAdmin())) return NOT_ADMIN;
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const p = parsed.data;
  const supabase = await createClient();

  // Produk baru: slug dari nama, ditambah angka kalau sudah dipakai (pashmina-sekar, pashmina-sekar-2, ...)
  let slug: string | undefined;
  if (!p.id) {
    const base = slugify(p.name) || "produk";
    const { data: taken } = await supabase.from("products").select("slug").like("slug", `${base}%`);
    const used = new Set((taken ?? []).map((t) => t.slug));
    slug = base;
    for (let i = 2; used.has(slug); i++) slug = `${base}-${i}`;
  }

  // Foto lama, untuk menghapus file yang dibuang setelah simpan berhasil
  const { data: oldImages } = p.id ? await supabase.from("product_images").select("url").eq("product_id", p.id) : { data: [] };

  const { data: id, error } = await supabase.rpc("admin_save_product", { p_product: { ...p, slug } });
  if (error || !id) {
    const message = catalogError(error?.message ?? "");
    if (message.startsWith("Gagal")) console.error("admin_save_product:", error?.message);
    return { ok: false, error: message };
  }

  const kept = new Set(p.images.map((i) => i.url));
  await removeStorageFiles((oldImages ?? []).map((i) => i.url).filter((u) => !kept.has(u)));

  revalidatePath("/", "layout"); // katalog toko ikut diperbarui
  return { ok: true, id };
}

export async function setProductActive(id: string, active: boolean): Promise<Result> {
  if (!(await getAdmin())) return NOT_ADMIN;
  if (!z.uuid().safeParse(id).success || !z.boolean().safeParse(active).success) return { ok: false, error: "Produk tidak valid." };
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ is_active: active }).eq("id", id);
  if (error) return { ok: false, error: catalogError(error.message) };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<Result> {
  if (!(await getAdmin())) return NOT_ADMIN;
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Produk tidak valid." };
  const supabase = await createClient();
  const { data: images } = await supabase.from("product_images").select("url").eq("product_id", id);
  // Trigger database menolak kalau produk pernah dipesan (PRODUK_PERNAH_DIPESAN)
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: catalogError(error.message) };
  await removeStorageFiles((images ?? []).map((i) => i.url));
  revalidatePath("/", "layout");
  return { ok: true };
}
