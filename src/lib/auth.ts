import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Pengecekan login di SERVER (lapis kedua setelah proxy.ts).
// getUser() menanyakan langsung ke server Supabase Auth, jadi token palsu/dicabut pasti ketahuan.
// cache() = dalam satu request, pemanggilan berulang (layout + halaman) hanya bertanya sekali.
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

export async function requireUser(next = "/akun") {
  const user = await getUser();
  if (!user) redirect(`/masuk?next=${encodeURIComponent(next)}`);
  return user;
}

// Alamat situs untuk link di email & redirect Google.
// Diambil dari request (supaya benar di localhost, preview, dan production), dengan cadangan dari env.
// Aman walau header bisa dipalsukan: Supabase hanya mau redirect ke URL yang didaftarkan
// di dashboard (Authentication > URL Configuration), selain itu dialihkan ke Site URL.
export async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
