// Konten statis toko: cerita brand, keunggulan, panduan bahan & ukuran, cara pesan, FAQ.
// Semua teks dikumpulkan di sini supaya mudah direvisi tanpa membongkar komponen,
// dan supaya beranda & halaman Panduan memakai sumber data yang sama.
// Nilai kontak dan hari retur diambil dari site.ts.

import { site } from "@/lib/site";

// DRAF — silakan direvisi pemilik toko
export const brandStory = {
  short:
    "kynara lahir dari keinginan sederhana: punya kerudung yang nyaman dipakai dari pagi sampai malam tanpa harus sering dibetulkan. Setiap produk kami pilih bahannya sendiri, dicoba dipakai seharian, dan dicek jahitannya satu per satu sebelum dikirim.",
  paragraphs: [
    "kynara dimulai dari hal yang sering kami alami sendiri: kerudung yang licin di dahi, bahan yang panas saat cuaca terik, atau ukuran yang tidak sesuai foto. Dari situ kami ingin membuat toko kecil yang jujur soal bahan dan ukuran.",
    "Kami bukan pabrik besar. Koleksi dipilih dalam jumlah terbatas, bahan dicoba dipakai seharian sebelum dijual, dan setiap potong dicek tepi jahitannya sebelum dikemas. Kalau ada yang kurang, kami lebih suka tidak menjualnya.",
    "Harapan kami sederhana: kamu bisa memilih kerudung dan busana dengan tenang, karena informasi bahan, ukuran, dan perawatannya tertulis jelas, dan kalau ada kendala, kami bisa dihubungi langsung lewat WhatsApp.",
  ],
};

export type Highlight = { icon: "leaf" | "scissors" | "ruler" | "truck"; title: string; text: string };

// Teks dari desain beranda (seksi "Tentang kynara")
export const highlights: Highlight[] = [
  {
    icon: "leaf",
    title: "Bahan pilihan",
    text: "Setiap bahan dicoba dulu: adem, tidak mudah kusut, dan nyaman dipakai seharian.",
  },
  { icon: "scissors", title: "Jahitan rapi", text: "Tepi dijahit halus dan dicek satu per satu sebelum dikemas." },
  {
    icon: "ruler",
    title: "Ukuran jelas",
    text: "Ukuran tertulis di setiap produk, lengkap dengan panduan cara mengukur.",
  },
  {
    icon: "truck",
    title: "Pengiriman aman",
    text: "Dikemas rapi dan dikirim ke seluruh Indonesia, lengkap dengan nomor resi.",
  },
];

// Level 1–3 dipakai untuk bar "Adem" dan "Mudah dibentuk" (desain: 3 bar kecil)
export type Material = { name: string; desc: string; adem: 1 | 2 | 3; bentuk: 1 | 2 | 3; fit: string };

export const materials: Material[] = [
  { name: "Voal", desc: "Tegak di dahi, tidak licin, sedikit tembus pandang", adem: 2, bentuk: 3, fit: "Harian, kuliah, kerja" },
  { name: "Airflow", desc: "Ringan, bertekstur kerut, tidak perlu disetrika", adem: 3, bentuk: 2, fit: "Cuaca panas, aktivitas luar" },
  { name: "Satin", desc: "Berkilau lembut, jatuh, agak licin", adem: 1, bentuk: 1, fit: "Pesta, kondangan, acara malam" },
  { name: "Ceruty", desc: "Tipis, ringan, jatuh mengalir", adem: 3, bentuk: 2, fit: "Pashmina, acara semi-formal" },
  { name: "Jersey", desc: "Melar, lembut, nyaman untuk bergerak", adem: 2, bentuk: 3, fit: "Bergo, olahraga, perjalanan" },
];

export const levelWord = (n: number) => (n === 3 ? "Tinggi" : n === 2 ? "Sedang" : "Rendah");

// Ukuran umum. Ukuran persis tiap produk tetap tertulis di halaman produknya.
export const sizeGuide = [
  { item: "Segi empat", size: "110 × 110 cm atau 115 × 115 cm", note: "115 cm lebih leluasa untuk model menutup dada" },
  { item: "Pashmina", size: "175 × 70 cm", note: "Cukup untuk dililit satu sampai dua kali" },
  { item: "Bergo / instan", size: "S, M, L", note: "Pilih dari panjang depan (dagu sampai ujung kain)" },
  { item: "Bawahan & dress", size: "S sampai XL", note: "Lihat tabel lingkar pinggang dan panjang di tiap produk" },
];

export const measureSteps = [
  "Siapkan meteran jahit (pita), bukan meteran besi.",
  "Untuk bawahan dan dress, ukur lingkar pinggang di bagian paling kecil dan panjang dari pinggang sampai mata kaki.",
  "Bandingkan dengan pakaian yang paling pas di lemarimu: bentangkan rata, lalu ukur dengan cara yang sama.",
  "Kalau ukuranmu di antara dua ukuran, pilih yang lebih besar, atau tanyakan dulu lewat WhatsApp.",
];

export const orderSteps = [
  { title: "Pilih produk", text: "Pilih warna dan ukuran di halaman produk, lalu tekan Tambah ke keranjang." },
  { title: "Masuk atau daftar", text: "Checkout memerlukan akun supaya status pesanan bisa dilacak kapan saja." },
  { title: "Isi alamat & kurir", text: "Pilih alamat pengiriman, lalu kurir. Ongkos kirim dihitung otomatis dari berat paket." },
  {
    title: "Bayar",
    text: "Selesaikan pembayaran dalam 24 jam. Lewat dari itu, pesanan dibatalkan otomatis dan stok dikembalikan.",
  },
  { title: "Pantau pesanan", text: "Status dan nomor resi bisa dilihat di Akun > Pesanan." },
];

const retur = site.hariRetur ?? "[X]";

export const faqs = [
  {
    q: "Apakah warna produk sama dengan foto?",
    a: "Kami memotret di cahaya alami supaya warnanya mendekati aslinya. Tetap bisa ada sedikit perbedaan karena pengaturan layar HP.",
  },
  {
    q: "Berapa lama pesanan dikirim?",
    a: "Pesanan yang sudah dibayar dikemas dan dikirim di hari kerja berikutnya. Perkiraan tiba tergantung kurir dan kota tujuan, dan tampil saat memilih kurir.",
  },
  {
    q: "Berapa lama batas waktu pembayaran?",
    a: "24 jam sejak pesanan dibuat. Setelah itu pesanan dibatalkan otomatis dan stok dikembalikan.",
  },
  {
    q: "Bagaimana cara melacak pesanan?",
    a: "Buka Akun > Pesanan, lalu pilih pesanannya. Nomor resi muncul setelah paket diserahkan ke kurir.",
  },
  {
    q: "Apakah bisa tukar atau retur?",
    a: `Bisa, untuk produk cacat atau salah kirim, maksimal ${retur} hari setelah paket diterima dengan menyertakan video unboxing. Detailnya ada di halaman Kebijakan Retur.`,
  },
  {
    q: "Bagaimana cara merawat kerudung supaya awet?",
    a: "Cuci dengan tangan memakai air dingin dan sabun lembut, jangan diperas kuat, lalu jemur di tempat teduh. Setrika dengan suhu rendah, kecuali airflow yang tidak perlu disetrika.",
  },
];
