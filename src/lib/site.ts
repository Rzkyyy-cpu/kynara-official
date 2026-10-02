// Info kontak toko. Nilai null = belum diisi (lihat "Yang masih harus diisi" di design-handoff/README.md).
// Selama null, yang tampil adalah placeholder dalam kurung siku seperti di desain.

export const site = {
  name: "kynara",
  tagline:
    "Kerudung dan busana muslimah dengan bahan pilihan dan jahitan rapi, untuk dipakai setiap hari.",
  whatsapp: "6281460912579" as string | null, // format internasional tanpa +, contoh "6281234567890"
  instagram: null as string | null, // tanpa @
  tiktok: null as string | null, // tanpa @
  jamLayanan: null as string | null, // contoh "Senin–Sabtu, 09.00–17.00 WIB"
  hariRetur: 1 as number | null,
};

// Nomor untuk ditampilkan: "6281460912579" -> "0814-6091-2579" (lebih mudah dibaca orang Indonesia)
export const whatsappDisplay = site.whatsapp
  ? `0${site.whatsapp.slice(2)}`.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3")
  : "[NOMOR WHATSAPP]";

export const whatsappUrl =site.whatsapp ? `https://wa.me/${site.whatsapp}` : "https://wa.me/";
export const instagramUrl = `https://instagram.com/${site.instagram ?? ""}`;
export const tiktokUrl = `https://tiktok.com/${site.tiktok ? `@${site.tiktok}` : ""}`;

// Alamat lengkap situs untuk sitemap, robots.txt, Open Graph, dan URL kanonik.
// Mesin pencari & WhatsApp butuh URL utuh (https://...), bukan "/produk/x".
// Urutan: NEXT_PUBLIC_SITE_URL -> domain produksi bawaan Vercel -> localhost.
// Sengaja tidak membaca header request, supaya halaman katalog tetap bisa di-cache.
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined;
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || vercelUrl || "http://localhost:3000").replace(/\/+$/, "");
