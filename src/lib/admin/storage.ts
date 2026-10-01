import "server-only";

import { createClient } from "@/lib/supabase/server";
import { STORAGE_PREFIX } from "@/lib/validation/admin-catalog";

// Hapus file foto yang sudah tidak dipakai (diganti/dihapus dari produk, kategori, atau banner),
// supaya Storage gratis (1 GB) tidak penuh oleh foto yatim. Gagal hapus tidak menggagalkan simpan.
export async function removeStorageFiles(urls: (string | null | undefined)[]) {
  const paths = urls
    .filter((u): u is string => Boolean(u?.startsWith(STORAGE_PREFIX)))
    .map((u) => decodeURIComponent(u.slice(STORAGE_PREFIX.length)));
  if (paths.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase.storage.from("katalog").remove(paths);
  if (error) console.error("hapus foto:", error.message);
}
