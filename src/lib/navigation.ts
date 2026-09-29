// Daftar menu & kategori untuk Navbar, Drawer, BottomNav, dan Footer.
// SEMENTARA: kategori masih statis. Di Fase 2 diganti dengan data dari tabel categories.

export type Category = { name: string; slug: string; desc: string };

export const categories: Category[] = [
  { name: "Hijab Segi Empat", slug: "hijab-segi-empat", desc: "Voal, katun, satin" },
  { name: "Pashmina", slug: "pashmina", desc: "Airflow, ceruty, satin" },
  { name: "Instan / Bergo", slug: "instan-bergo", desc: "Siap pakai, tanpa peniti" },
  { name: "Outer", slug: "outer", desc: "Cardigan, kimono, blazer" },
  { name: "Bawahan", slug: "bawahan", desc: "Rok plisket, kulot, celana" },
  { name: "Dress", slug: "dress", desc: "Gamis dan dress harian" },
  { name: "Aksesoris", slug: "aksesoris", desc: "Ciput, inner, bros, peniti" },
];

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

// SEMENTARA: angka contoh untuk mengecek tampilan badge. Diganti isi keranjang asli di Fase 4.
export const DEMO_CART_COUNT = 3;
