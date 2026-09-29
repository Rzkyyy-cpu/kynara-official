# Rencana Fase — Kynara Store

Setiap fase dikerjakan dengan urutan yang sama: tampilkan rencana, tunggu persetujuan, kerjakan, lalu berhenti untuk konfirmasi.
Aturan lengkap ada di `CLAUDE.md`.

---

## Fase 1 — Fondasi & layout

Baca CLAUDE.md dan isi folder /design-handoff dulu.

1. Buat proyek Next.js + TypeScript + Tailwind di folder ini (jangan buat subfolder baru).
2. Atur tailwind.config dengan palet warna dan font dari CLAUDE.md.
3. Buat komponen layout: Navbar atas sticky (logo, menu Beranda, Koleksi dengan dropdown kategori, Panduan, Tentang Kami, ikon cari, ikon keranjang dengan badge), drawer hamburger untuk mobile, bottom nav ringan di mobile, dan Footer.
4. Buat komponen dasar reusable: Button, ProductCard, Container.
5. Buat halaman Beranda kosong yang memakai layout ini.
6. Buat .env.example dan pastikan .env.local masuk .gitignore.

Tampilkan rencana file dulu, tunggu persetujuan, baru kerjakan. Setelah selesai, jelaskan cara menjalankan (npm run dev) dan apa yang harus dicek di browser.

## Fase 2 — Database & katalog

1. Rancang skema database Supabase: profiles (dengan role user/admin), categories, products, product_variants (warna, ukuran, stok, harga), product_images, addresses, carts, cart_items, orders, order_items, reviews, wishlists.
2. Tulis skema sebagai file migration SQL di folder /supabase/migrations, lengkap dengan RLS policy per tabel. Jelaskan tiap policy dengan bahasa sederhana.
3. Buat file seed dengan 6 kategori (Hijab Segi Empat, Pashmina, Instan/Bergo, Outer, Bawahan, Dress) dan 12 produk dummy dengan nama singkat maksimal 2 baris, harga, bahan, warna, dan stok.
4. Buat halaman Koleksi (filter kategori, harga, bahan, warna; sorting; pencarian; pagination) dan halaman Detail Produk (galeri, pilihan varian, stok per varian).
5. Hubungkan Beranda: grid kategori dan produk terbaru dari database.

Tampilkan skema dan rencana dulu, tunggu persetujuan sebelum menulis migration.

## Fase 3 — Auth & akun

1. Auth dengan Supabase: daftar, login email/password, login Google, lupa password.
2. Buat trigger agar profil otomatis dibuat saat user daftar, dengan role default "user".
3. Halaman Akun: profil, buku alamat (tambah/edit/hapus), riwayat pesanan (kosong dulu), wishlist.
4. Proteksi halaman yang butuh login memakai middleware.
5. Semua form pakai validasi Zod dan pesan error yang jelas dalam Bahasa Indonesia.

Jelaskan alur login dengan analogi sederhana sebelum menulis kode.

## Fase 4 — Keranjang & checkout

1. Keranjang: tamu memakai localStorage, user login memakai tabel carts di database. Saat tamu login, gabungkan keduanya.
2. Halaman Keranjang: ubah jumlah, hapus item, ringkasan harga, peringatan kalau stok berubah.
3. Checkout 3 langkah: alamat, kurir dan ongkir (pakai data tiruan dulu lewat modul /lib/shipping yang mudah diganti), lalu konfirmasi.
4. Buat pesanan lewat server action atau route handler. Server harus menghitung ulang harga dari database, bukan memakai harga dari browser.
5. Kurangi stok secara atomik saat pesanan dibuat. Status awal pesanan: menunggu pembayaran.
6. Tulis tes untuk fungsi hitung total dan pengurangan stok.

Setelah selesai, jelaskan kenapa harga tidak boleh dihitung di browser.

## Fase 5 — Pembayaran Midtrans

1. Integrasi Midtrans Snap mode sandbox: buat transaksi dari pesanan, buka popup pembayaran.
2. Buat endpoint webhook untuk notifikasi Midtrans. Verifikasi signature sebelum mengubah status pesanan. Tolak request yang signature-nya salah.
3. Update status pesanan: menunggu pembayaran, diproses, kedaluwarsa (stok dikembalikan), dibatalkan.
4. Halaman status pesanan dengan timeline.
5. Simpan Server Key dan Client Key di .env.local, jangan di kode.
6. Tulis tes untuk verifikasi signature.

Jelaskan apa itu webhook dengan analogi, dan cara mengujinya di sandbox (termasuk cara membuat URL lokal bisa dijangkau Midtrans).

## Fase 6 — Ongkos kirim

1. Rapikan /lib/shipping dengan interface yang jelas, sehingga provider bisa diganti tanpa mengubah halaman checkout.
2. Implementasi satu provider ongkir nyata. Sebelum memilih, cek syarat dan batas paket gratis terbaru, dan beri tahu pilihannya beserta alasannya.
3. Simpan berat per produk di database, hitung berat total keranjang, dan tampilkan pilihan kurir dan estimasi tiba.
4. Kalau API gagal atau kena batas, tampilkan pesan yang jelas dan sediakan fallback tarif flat.

## Fase 7 — Admin

1. Halaman /admin yang hanya bisa diakses role admin (cek di middleware dan di policy database, jangan hanya di tampilan).
2. Dashboard ringkasan: penjualan hari ini dan bulan ini, jumlah pesanan per status.
3. CRUD produk dan varian, upload foto ke Supabase Storage dengan batas ukuran dan tipe file.
4. Kelola pesanan: ubah status, input nomor resi.
5. Kelola kategori dan banner beranda.
6. Ikuti desain admin di /design-handoff.

Jelaskan cara menjadikan akun sendiri admin dengan aman.

## Fase 8 — Audit, SEO, performa

1. Audit keamanan seluruh proyek: cek RLS di semua tabel, cek tidak ada kunci rahasia di kode, cek semua endpoint punya validasi Zod dan pengecekan hak akses, tambahkan rate limit di login dan checkout. Buat laporan temuan dan perbaiki yang kritis.
2. SEO: title dan meta description unik per halaman, Open Graph, sitemap.xml, robots.txt, alt text di semua gambar.
3. Performa: next/image, lazy loading, target Lighthouse mobile di atas 85. Jalankan audit dan laporkan hasilnya.
4. Cek aksesibilitas dasar: kontras warna, label form, navigasi keyboard.
5. Buat README berisi cara menjalankan proyek dan daftar environment variable.
