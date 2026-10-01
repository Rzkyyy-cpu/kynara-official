"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdmin } from "@/lib/admin/auth";
import { catalogError } from "@/lib/admin/errors";
import { removeStorageFiles } from "@/lib/admin/storage";
import { createClient } from "@/lib/supabase/server";
import { type CategoryInput, categorySchema } from "@/lib/validation/admin-catalog";

// Aksi admin untuk kategori (admin-desktop/05). Batas 6 kategori di beranda dijaga trigger database.

type Result = { ok: true } | { ok: false; error: string };
const NOT_ADMIN: Result = { ok: false, error: "Sesi admin berakhir. Silakan masuk lagi." };
const uuid = z.uuid();

export async function saveCategory(input: CategoryInput): Promise<Result> {
  if (!(await getAdmin())) return NOT_ADMIN;
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, ...fields } = parsed.data;
  const supabase = await createClient();
  const row = { ...fields, description: fields.description || null };

  if (id) {
    const { data: old } = await supabase.from("categories").select("image_url").eq("id", id).maybeSingle();
    const { error } = await supabase.from("categories").update(row).eq("id", id);
    if (error) return { ok: false, error: catalogError(error.message) };
    if (old?.image_url && old.image_url !== row.image_url) await removeStorageFiles([old.image_url]);
  } else {
    // Kategori baru masuk paling bawah, tidak langsung tampil di beranda
    const { data: last } = await supabase.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { error } = await supabase.from("categories").insert({ ...row, sort_order: (last?.sort_order ?? 0) + 1, show_on_home: false });
    if (error) return { ok: false, error: catalogError(error.message) };
  }
  revalidatePath("/", "layout"); // menu Koleksi & beranda
  return { ok: true };
}

export async function setCategoryOnHome(id: string, show: boolean): Promise<Result> {
  if (!(await getAdmin())) return NOT_ADMIN;
  if (!uuid.safeParse(id).success) return { ok: false, error: "Kategori tidak valid." };
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update({ show_on_home: show }).eq("id", id);
  if (error) return { ok: false, error: catalogError(error.message) };
  revalidatePath("/", "layout");
  return { ok: true };
}

// Urutan baru = daftar semua id dari atas ke bawah
export async function reorderCategories(ids: string[]): Promise<Result> {
  if (!(await getAdmin())) return NOT_ADMIN;
  if (!z.array(uuid).max(100).safeParse(ids).success) return { ok: false, error: "Urutan tidak valid." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_reorder_categories", { p_ids: ids });
  if (error) return { ok: false, error: catalogError(error.message) };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<Result> {
  if (!(await getAdmin())) return NOT_ADMIN;
  if (!uuid.safeParse(id).success) return { ok: false, error: "Kategori tidak valid." };
  const supabase = await createClient();
  const { data: old } = await supabase.from("categories").select("image_url").eq("id", id).maybeSingle();
  // Foreign key menolak kalau kategori masih punya produk
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: catalogError(error.message) };
  await removeStorageFiles([old?.image_url]);
  revalidatePath("/", "layout");
  return { ok: true };
}
