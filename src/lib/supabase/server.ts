import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "@/lib/supabase/env";
import { REMEMBER_COOKIE, applyRemember } from "@/lib/supabase/remember";
import type { Database } from "@/types/database";

// Koneksi Supabase yang MEMBAWA SESI LOGIN dari cookie.
// Dipakai di Server Component, Server Action, dan Route Handler.
// Query lewat koneksi ini berjalan sebagai user yang sedang login, jadi RLS "milik sendiri" berlaku.
// opts.remember dipakai saat login, karena pilihan "Ingat saya" baru saja dibuat di request yang sama.
export async function createClient(opts: { remember?: boolean } = {}) {
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();
  const remember = opts.remember ?? cookieStore.get(REMEMBER_COOKIE)?.value !== "0";

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, applyRemember(options, remember)),
          );
        } catch {
          // Server Component tidak boleh menulis cookie. Aman diabaikan,
          // karena proxy.ts sudah memperbarui sesi sebelum halaman dirender.
        }
      },
    },
  });
}
