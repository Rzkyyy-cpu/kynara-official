"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/supabase/env";
import { REMEMBER_COOKIE, applyRemember } from "@/lib/supabase/remember";
import type { Database } from "@/types/database";

// Koneksi Supabase di BROWSER (status login di navbar, tombol wishlist).
// Membaca cookie sesi yang sama dengan server. Tetap tunduk pada RLS.

function readCookies() {
  if (!document.cookie) return [];
  return document.cookie.split("; ").map((pair) => {
    const i = pair.indexOf("=");
    return { name: pair.slice(0, i), value: decodeURIComponent(pair.slice(i + 1)) };
  });
}

type CookieOpts = { path?: string; maxAge?: number; sameSite?: string | boolean; secure?: boolean };

function writeCookie(name: string, value: string, o: CookieOpts) {
  let str = `${name}=${encodeURIComponent(value)}; Path=${o.path ?? "/"}; SameSite=${o.sameSite === "strict" ? "Strict" : "Lax"}`;
  if (o.maxAge !== undefined) str += `; Max-Age=${o.maxAge}`;
  if (o.secure || location.protocol === "https:") str += "; Secure";
  document.cookie = str;
}

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

// Satu koneksi dipakai bersama di seluruh halaman (bukan dibuat ulang tiap komponen).
export function createClient() {
  if (client) return client;
  const { url, key } = supabaseEnv();
  client = createBrowserClient<Database>(url, key, {
    cookies: {
      getAll: readCookies,
      setAll(cookiesToSet) {
        const remember = !readCookies().some((c) => c.name === REMEMBER_COOKIE && c.value === "0");
        cookiesToSet.forEach(({ name, value, options }) =>
          writeCookie(name, value, applyRemember(options as CookieOpts, remember)),
        );
      },
    },
  });
  return client;
}
