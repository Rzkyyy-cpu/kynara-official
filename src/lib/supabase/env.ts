// Alamat project & publishable key Supabase. Keduanya bukan rahasia (awalan NEXT_PUBLIC_),
// karena keamanan data dijaga oleh RLS di database, bukan oleh kunci ini.
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum diisi di .env.local",
    );
  }
  return { url, key };
}
