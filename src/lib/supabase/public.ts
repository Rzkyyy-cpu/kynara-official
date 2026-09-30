import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Koneksi Supabase untuk data PUBLIK (katalog: kategori, produk, varian).
// Memakai publishable key tanpa sesi login, jadi yang berlaku adalah aturan RLS untuk "anon".
// Koneksi yang membawa sesi login (cookie) dibuat terpisah di Fase 3.
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum diisi di .env.local",
    );
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
