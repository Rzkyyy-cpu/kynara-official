import "server-only";

import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

// Koneksi dengan SECRET KEY (peran service_role): melewati RLS.
// Hanya untuk tugas server yang memang tidak boleh dilakukan pengunjung, misalnya mencatat rate limit.
// "server-only" menjamin file ini tidak pernah ikut terkirim ke browser.
export function createAdminClient() {
  const { url } = supabaseEnv();
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY belum diisi di .env.local");
  return createClient<Database>(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
