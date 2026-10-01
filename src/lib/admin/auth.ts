import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Pengecekan admin di SERVER (lapis kedua setelah proxy.ts; lapis ketiga = RLS & fungsi database).
// Peran dibaca dari tabel profiles lewat is_admin(), bukan dari data di browser.

export const getAdmin = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_admin");
  return data === true ? user : null;
});

// Untuk halaman: bukan admin = 404, supaya halaman admin terlihat seperti tidak ada
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) notFound();
  return admin;
}
