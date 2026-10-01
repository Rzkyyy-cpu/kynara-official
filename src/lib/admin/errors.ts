// Pesan error database katalog -> kalimat untuk admin.
// Kode dari fungsi/trigger (raise exception) dan nama constraint (unik, check, foreign key).

const MESSAGES: [string, string][] = [
  ["BUKAN_ADMIN", "Sesi admin berakhir. Silakan masuk lagi."],
  ["BERANDA_PENUH", "Beranda hanya menampilkan 6 kategori. Matikan salah satu dulu sebelum menambah yang lain."],
  ["BANNER_PENUH", "Maksimal 3 banner tayang. Jadikan draf atau beri tanggal selesai pada banner lain dulu."],
  ["PRODUK_PERNAH_DIPESAN", "Produk ini sudah pernah dipesan, jadi tidak bisa dihapus. Sembunyikan saja dari toko."],
  ["VARIAN_KOSONG", "Tambahkan minimal satu varian aktif."],
  ["PRODUK_TIDAK_ADA", "Produk tidak ditemukan. Mungkin sudah dihapus."],
  ["VARIAN_TIDAK_VALID", "Data varian berubah. Muat ulang halaman, ya."],
  ["product_variants_sku_key", "SKU sudah dipakai varian lain. Ganti SKU-nya."],
  ["product_variants_product_id_color_name_size_name_key", "Ada varian dengan warna dan ukuran yang sama."],
  ["product_variants_stock_check", "Stok jadi minus karena ada pesanan masuk saat kamu mengedit. Muat ulang halaman, ya."],
  ["products_slug_key", "Alamat (slug) produk sudah dipakai."],
  ["categories_slug_key", "Slug kategori sudah dipakai kategori lain."],
  ["products_category_id_fkey", "Kategori ini masih punya produk. Pindahkan produknya ke kategori lain dulu."],
];

export function catalogError(message: string): string {
  return MESSAGES.find(([code]) => message.includes(code))?.[1] ?? "Gagal menyimpan. Coba lagi sebentar lagi.";
}
