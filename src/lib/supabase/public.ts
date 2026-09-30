import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

// Koneksi Supabase untuk data PUBLIK (katalog: kategori, produk, varian).
// Memakai publishable key tanpa sesi login, jadi yang berlaku adalah aturan RLS untuk "anon".
// Sengaja tidak membaca cookie, supaya halaman katalog tetap bisa di-cache (lihat revalidate di layout).
// Koneksi yang membawa sesi login ada di server.ts (server) dan client.ts (browser).
export function createPublicClient() {
  const { url, key } = supabaseEnv();
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
