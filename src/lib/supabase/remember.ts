// "Ingat saya di perangkat ini".
// Cookie sesi Supabase bawaannya berumur 400 hari (tetap login walau browser ditutup).
// Kalau pengguna TIDAK mencentang "Ingat saya", kita simpan penanda kyn-remember=0,
// lalu setiap kali cookie sesi ditulis, umurnya dihapus. Cookie tanpa umur = "cookie sesi browser",
// yang otomatis hilang saat browser ditutup.

export const REMEMBER_COOKIE = "kyn-remember";

type Options = { maxAge?: number; expires?: Date; [key: string]: unknown };

export function applyRemember<T extends Options>(options: T, remember: boolean): T {
  // maxAge 0 = perintah menghapus cookie (logout), jangan diubah
  if (remember || options.maxAge === 0) return options;
  const rest = { ...options };
  delete rest.maxAge;
  delete rest.expires;
  return rest;
}
