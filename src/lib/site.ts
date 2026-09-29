// Info kontak toko. Nilai null = belum diisi (lihat "Yang masih harus diisi" di design-handoff/README.md).
// Selama null, yang tampil adalah placeholder dalam kurung siku seperti di desain.

export const site = {
  name: "kynara",
  tagline:
    "Kerudung dan busana muslimah dengan bahan pilihan dan jahitan rapi, untuk dipakai setiap hari.",
  whatsapp: null as string | null, // format internasional tanpa +, contoh "6281234567890"
  instagram: null as string | null, // tanpa @
  tiktok: null as string | null, // tanpa @
  jamLayanan: null as string | null, // contoh "Senin–Sabtu, 09.00–17.00 WIB"
  hariRetur: null as number | null,
};

export const whatsappUrl = site.whatsapp ? `https://wa.me/${site.whatsapp}` : "https://wa.me/";
export const instagramUrl = `https://instagram.com/${site.instagram ?? ""}`;
export const tiktokUrl = `https://tiktok.com/${site.tiktok ? `@${site.tiktok}` : ""}`;
