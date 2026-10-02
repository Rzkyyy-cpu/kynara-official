import type { NextConfig } from "next";

// Foto produk/kategori/banner disimpan di Supabase Storage (bucket publik).
// next/image hanya mau mengoptimasi gambar dari alamat yang didaftarkan di sini.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;

// Header keamanan = "aturan rumah" yang dibacakan ke browser di setiap halaman.
// Browser yang menegakkannya; server kita cukup mengirim.
const securityHeaders = [
  // Situs lain tidak boleh memasang halaman kita di dalam <iframe> (mencegah clickjacking:
  // tombol "Bayar" kita ditumpuk tak terlihat di bawah tombol jebakan situs lain).
  { key: "X-Frame-Options", value: "DENY" },
  // CSP minimal: sama dengan di atas untuk browser modern, plus larang plugin (<object>) dan
  // penggantian <base> (yang bisa membelokkan semua link relatif ke situs lain).
  // Sengaja belum membatasi script: CSP script penuh butuh nonce per request, yang membuat
  // semua halaman tidak bisa di-cache (lebih lambat). Dicatat di docs/audit-keamanan.md.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
  // File dibaca sesuai tipe yang kita kirim, browser tidak boleh "menebak" (mis. teks dianggap script).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Situs tujuan link keluar hanya melihat domain kita, bukan alamat lengkap (yang bisa berisi nomor pesanan).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Fitur perangkat yang tidak dipakai toko dimatikan.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Selalu pakai HTTPS selama 2 tahun (diabaikan browser saat membuka http://localhost).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
