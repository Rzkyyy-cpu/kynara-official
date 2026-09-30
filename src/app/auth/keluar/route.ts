import { type NextRequest, NextResponse } from "next/server";
import { REMEMBER_COOKIE } from "@/lib/supabase/remember";
import { createClient } from "@/lib/supabase/server";

// Keluar (logout). Sengaja hanya menerima POST (dari <form method="post">):
// kalau GET, situs lain bisa memasang <img src="/auth/keluar"> untuk mengeluarkan pengguna diam-diam.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut(); // menghapus cookie sesi & mencabut token di server Supabase
  const res = NextResponse.redirect(new URL("/", request.nextUrl.origin), { status: 303 });
  res.cookies.delete(REMEMBER_COOKIE);
  return res;
}
