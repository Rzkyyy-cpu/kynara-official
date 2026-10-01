import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseEnv } from "@/lib/supabase/env";
import { REMEMBER_COOKIE, applyRemember } from "@/lib/supabase/remember";

// PROXY (di Next.js lama bernama "middleware") = satpam di pintu.
// Berjalan SEBELUM halaman dirender, untuk:
//   1. Memperbarui "gelang" sesi login (token) yang hampir kedaluwarsa, lalu menyimpannya lagi ke cookie.
//   2. Menolak pengunjung tanpa sesi yang mencoba membuka /akun, /checkout, atau /admin, diarahkan ke /masuk.
//      /admin juga menolak user yang login tapi bukan admin.
//   3. Mengarahkan user yang sudah login keluar dari halaman /masuk dan /daftar.
// Ini pengecekan CEPAT, bukan satu-satunya penjaga: halaman akun mengecek ulang di server
// (requireUser), dan database menjaga lewat RLS.

const AUTH_PAGES = ["/masuk", "/daftar"];

export async function proxy(request: NextRequest) {
  const { url, key } = supabaseEnv();
  const remember = request.cookies.get(REMEMBER_COOKIE)?.value !== "0";
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        // Cookie baru ditulis ke request (supaya halaman melihat token terbaru) DAN ke response (untuk browser)
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, applyRemember(options, remember)),
        );
        // Header anti-cache dari Supabase: halaman berisi sesi tidak boleh disimpan CDN
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // getClaims memeriksa tanda tangan token (bukan sekadar membaca cookie), dan memperbaruinya kalau perlu.
  // Jangan menaruh kode lain di antara createServerClient dan baris ini.
  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  const redirectTo = (path: string) => {
    const res = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach((c) => res.cookies.set(c)); // bawa cookie sesi yang baru diperbarui
    return res;
  };

  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  if (!loggedIn && (isAdminPath || pathname.startsWith("/akun") || pathname.startsWith("/checkout"))) {
    return redirectTo(`/masuk?next=${encodeURIComponent(pathname + search)}`);
  }
  // Halaman admin: login saja tidak cukup, role harus admin. is_admin() dibaca dari tabel profiles
  // di database (bukan dari cookie), jadi tidak bisa dipalsukan dari browser.
  // Lapis berikutnya: requireAdmin() di layout/aksi admin, lalu RLS & fungsi database.
  if (isAdminPath) {
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (isAdmin !== true) return redirectTo("/");
  }
  if (loggedIn && AUTH_PAGES.includes(pathname)) {
    return redirectTo("/akun");
  }
  return response;
}

// Proxy hanya dijalankan di halaman yang butuh sesi. Halaman katalog tidak ikut,
// supaya tetap cepat dan bisa di-cache (status login di navbar dibaca di browser).
export const config = {
  matcher: ["/admin", "/admin/:path*", "/akun/:path*", "/checkout", "/masuk", "/daftar", "/lupa-password", "/reset-password"],
};
