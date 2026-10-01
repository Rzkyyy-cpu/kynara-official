"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdmin } from "@/lib/admin/auth";
import { catalogError } from "@/lib/admin/errors";
import { removeStorageFiles } from "@/lib/admin/storage";
import { createClient } from "@/lib/supabase/server";
import { type BannerInput, bannerSchema } from "@/lib/validation/admin-catalog";

// Aksi admin untuk banner beranda (admin-desktop/06). Batas 3 banner tayang dijaga trigger database.

type Result = { ok: true; id?: string } | { ok: false; error: string };
const NOT_ADMIN: Result = { ok: false, error: "Sesi admin berakhir. Silakan masuk lagi." };
const uuid = z.uuid();

export async function saveBanner(input: BannerInput): Promise<Result> {
  if (!(await getAdmin())) return NOT_ADMIN;
  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, ...fields } = parsed.data;
  const row = { ...fields, subtitle: fields.subtitle || null };
  const supabase = await createClient();

  if (id) {
    const { data: old } = await supabase.from("banners").select("image_desktop_url, image_mobile_url").eq("id", id).maybeSingle();
    const { error } = await supabase.from("banners").update(row).eq("id", id);
    if (error) return { ok: false, error: catalogError(error.message) };
    await removeStorageFiles([old?.image_desktop_url, old?.image_mobile_url].filter((u) => u && u !== row.image_desktop_url && u !== row.image_mobile_url));
    revalidatePath("/", "layout");
    return { ok: true, id };
  }

  const { data: last } = await supabase.from("banners").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase
    .from("banners")
    .insert({ ...row, sort_order: (last?.sort_order ?? 0) + 1 })
    .select("id")
    .single();
  if (error) return { ok: false, error: catalogError(error.message) };
  revalidatePath("/", "layout");
  return { ok: true, id: data.id };
}

export async function reorderBanners(ids: string[]): Promise<Result> {
  if (!(await getAdmin())) return NOT_ADMIN;
  if (!z.array(uuid).max(100).safeParse(ids).success) return { ok: false, error: "Urutan tidak valid." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_reorder_banners", { p_ids: ids });
  if (error) return { ok: false, error: catalogError(error.message) };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteBanner(id: string): Promise<Result> {
  if (!(await getAdmin())) return NOT_ADMIN;
  if (!uuid.safeParse(id).success) return { ok: false, error: "Banner tidak valid." };
  const supabase = await createClient();
  const { data: old } = await supabase.from("banners").select("image_desktop_url, image_mobile_url").eq("id", id).maybeSingle();
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) return { ok: false, error: catalogError(error.message) };
  await removeStorageFiles([old?.image_desktop_url, old?.image_mobile_url]);
  revalidatePath("/", "layout");
  return { ok: true };
}
