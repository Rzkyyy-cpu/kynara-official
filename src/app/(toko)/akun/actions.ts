"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MAX_ADDRESSES } from "@/lib/account";
import { getUser } from "@/lib/auth";
import { type FormState, formValues, invalid } from "@/lib/form";
import { LIMITS, TOO_MANY, checkRateLimit } from "@/lib/rate-limit";
import { supabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { addressSchema, changePasswordSchema, profileSchema } from "@/lib/validation/account";
import { resolveRegion } from "@/lib/wilayah";

// Semua aksi di halaman Akun. Setiap aksi:
//  1. memastikan user login (getUser bertanya langsung ke Supabase Auth),
//  2. memvalidasi input dengan Zod,
//  3. menulis lewat koneksi bersesi, sehingga RLS tetap menjaga "hanya data milik sendiri".

const NOT_LOGGED_IN: FormState = { error: "Sesi login berakhir. Silakan masuk lagi." };
const GENERIC_ERROR = "Gagal menyimpan. Coba lagi sebentar lagi.";

// ---------- Profil ----------
export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return NOT_LOGGED_IN;

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { fullName, phone, birthDate } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone, birth_date: birthDate })
    .eq("id", user.id);
  if (error) {
    console.error("update profile:", error.message);
    return { error: GENERIC_ERROR, values: formValues(formData) };
  }
  // Nama juga disalin ke metadata akun, supaya navbar langsung menampilkan nama baru
  await supabase.auth.updateUser({ data: { full_name: fullName } });

  revalidatePath("/akun", "layout");
  return { success: "Perubahan profil tersimpan." };
}

// ---------- Ubah password ----------
export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user?.email) return NOT_LOGGED_IN;

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);

  if (!(await checkRateLimit(`change-pw:${user.id}`, LIMITS.changePassword))) return { error: TOO_MANY };

  // Cek password lama dengan login ulang di koneksi TERPISAH (tanpa cookie),
  // supaya sesi yang sedang dipakai tidak terganggu. Tujuannya: orang yang kebetulan
  // memegang HP yang masih login tidak bisa mengganti password tanpa tahu password lamanya.
  const { url, key } = supabaseEnv();
  const checker = createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: wrong } = await checker.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (wrong) return { fieldErrors: { currentPassword: "Password lama belum cocok." } };
  await checker.auth.signOut({ scope: "local" });

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "weak_password") {
      return { fieldErrors: { password: "Password terlalu mudah ditebak. Coba kombinasi lain." } };
    }
    console.error("change password:", error.code, error.message);
    return { error: GENERIC_ERROR };
  }
  return { success: "Password berhasil diperbarui." };
}

// ---------- Buku alamat ----------
export async function saveAddress(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return NOT_LOGGED_IN;

  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const a = parsed.data;
  const values = formValues(formData);

  // Kode wilayah -> nama resmi. Kode yang tidak cocok (dimanipulasi) ditolak.
  const region = resolveRegion(a.provinceCode, a.cityCode, a.districtCode);
  if (!region) return { fieldErrors: { districtCode: "Pilih ulang provinsi, kota, dan kecamatan." }, values };

  const supabase = await createClient();
  const { data: existing, error: listError } = await supabase
    .from("addresses")
    .select("id, is_default")
    .eq("user_id", user.id);
  if (listError) return { error: GENERIC_ERROR, values };

  if (!a.id && existing.length >= MAX_ADDRESSES) {
    return { error: `Maksimal ${MAX_ADDRESSES} alamat. Hapus alamat lama dulu, ya.`, values };
  }
  if (a.id && !existing.some((e) => e.id === a.id)) return { error: "Alamat tidak ditemukan.", values };

  // Alamat pertama otomatis jadi alamat utama
  const makeDefault = a.isDefault || existing.length === 0;
  if (makeDefault) {
    // Index database hanya mengizinkan SATU alamat utama, jadi yang lama dilepas dulu
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id).eq("is_default", true);
  }

  const row = {
    label: a.label,
    recipient_name: a.recipientName,
    phone: a.phone,
    province: region.province,
    city: region.city,
    district: region.district,
    postal_code: a.postalCode,
    street: a.street,
    landmark: a.landmark,
    // Wilayah berubah -> ID tujuan RajaOngkir lama tidak berlaku, dicari ulang di Fase 6
    rajaongkir_destination_id: null,
    ...(makeDefault ? { is_default: true } : {}),
  };

  const { error } = a.id
    ? await supabase.from("addresses").update(row).eq("id", a.id).eq("user_id", user.id)
    : await supabase.from("addresses").insert({ ...row, user_id: user.id });
  if (error) {
    console.error("save address:", error.message);
    return { error: GENERIC_ERROR, values };
  }

  revalidatePath("/akun", "layout");
  return { success: a.id ? "Alamat diperbarui." : "Alamat baru tersimpan." };
}

const idSchema = z.uuid();

export async function deleteAddress(id: string): Promise<{ ok: boolean }> {
  const user = await getUser();
  const parsed = idSchema.safeParse(id);
  if (!user || !parsed.success) return { ok: false };

  const supabase = await createClient();
  const { data: deleted, error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id)
    .select("is_default")
    .maybeSingle();
  if (error) return { ok: false };

  // Kalau yang dihapus alamat utama, alamat tertua berikutnya dijadikan utama
  if (deleted?.is_default) {
    const { data: next } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at")
      .limit(1)
      .maybeSingle();
    if (next) await supabase.from("addresses").update({ is_default: true }).eq("id", next.id);
  }
  revalidatePath("/akun", "layout");
  return { ok: true };
}

export async function setDefaultAddress(id: string): Promise<{ ok: boolean }> {
  const user = await getUser();
  const parsed = idSchema.safeParse(id);
  if (!user || !parsed.success) return { ok: false };

  const supabase = await createClient();
  await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id).eq("is_default", true);
  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", parsed.data)
    .eq("user_id", user.id);
  revalidatePath("/akun", "layout");
  return { ok: !error };
}

// ---------- Wishlist ----------
const wishlistSchema = z.object({ productId: z.uuid(), save: z.boolean() });

export async function toggleWishlist(productId: string, save: boolean): Promise<{ ok: boolean }> {
  const user = await getUser();
  const parsed = wishlistSchema.safeParse({ productId, save });
  if (!user || !parsed.success) return { ok: false };

  const supabase = await createClient();
  const { error } = parsed.data.save
    ? // upsert + ignoreDuplicates: menyimpan dua kali tidak dianggap error
      await supabase
        .from("wishlists")
        .upsert({ user_id: user.id, product_id: parsed.data.productId }, { ignoreDuplicates: true })
    : await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", parsed.data.productId);

  if (error) {
    console.error("wishlist:", error.message);
    return { ok: false };
  }
  revalidatePath("/akun/wishlist");
  return { ok: true };
}
