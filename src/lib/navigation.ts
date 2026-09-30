// Daftar menu untuk Navbar, Drawer, BottomNav, dan Footer.
// Kategori diambil dari tabel categories di layout.tsx, lalu dikirim ke komponen sebagai props.

export type NavCategory = { name: string; slug: string; description: string | null };

export const categoryHref = (slug: string) => `/koleksi?kategori=${slug}`;

export const mainMenu = [
  { label: "Beranda", href: "/" },
  { label: "Panduan", href: "/panduan" },
  { label: "Tentang Kami", href: "/tentang" },
] as const;

export const helpLinks = [
  { label: "Panduan Ukuran", href: "/panduan#ukuran" },
  { label: "Panduan Bahan", href: "/panduan#bahan" },
  { label: "Cara Pemesanan", href: "/panduan#cara-pesan" },
  { label: "Lacak Pesanan", href: "/akun/pesanan" },
  { label: "Kebijakan Retur", href: "/kebijakan-retur" },
  { label: "Pertanyaan Umum", href: "/panduan#faq" },
] as const;
