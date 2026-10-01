"use client";

import { useState } from "react";
import { IMAGE_RULES, IMAGE_TYPES, type ImageKind, imageProblem } from "@/lib/admin/images";
import { createClient } from "@/lib/supabase/client";

// Unggah foto LANGSUNG dari browser ke Supabase Storage.
// Analogi: kurir mengantar paket langsung ke gudang (Storage), bukan lewat kantor kita (server Next.js).
// Server kita hanya mencatat alamat raknya (URL) saat form disimpan. Lebih cepat, dan server Vercel
// gratis tidak perlu menampung file 2 MB. Yang boleh menaruh barang di gudang: hanya admin (policy Storage).

function readSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

export function useImageUpload(kind: ImageKind) {
  const [uploading, setUploading] = useState(0); // jumlah file yang sedang diunggah

  async function upload(file: File): Promise<UploadResult> {
    const early = imageProblem(file, kind);
    if (early) return { ok: false, error: early };
    const size = await readSize(file);
    if (!size) return { ok: false, error: "File bukan gambar yang bisa dibuka." };
    const problem = imageProblem(file, kind, size);
    if (problem) return { ok: false, error: problem };

    setUploading((n) => n + 1);
    try {
      const supabase = createClient();
      // Nama acak: tidak menimpa foto lain dan tidak bisa ditebak
      const path = `${IMAGE_RULES[kind].folder}/${crypto.randomUUID()}.${IMAGE_TYPES[file.type]}`;
      const { error } = await supabase.storage.from("katalog").upload(path, file, {
        contentType: file.type,
        cacheControl: "31536000", // file tidak pernah diubah (nama baru tiap unggah), boleh di-cache lama
      });
      if (error) return { ok: false, error: "Gagal mengunggah. Cek koneksi lalu coba lagi." };
      return { ok: true, url: supabase.storage.from("katalog").getPublicUrl(path).data.publicUrl };
    } finally {
      setUploading((n) => n - 1);
    }
  }

  return { upload, uploading: uploading > 0 };
}
