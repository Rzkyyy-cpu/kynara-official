# Rencana Fase — Kynara Store

Setiap fase dikerjakan dengan urutan yang sama: tampilkan rencana, tunggu persetujuan, kerjakan, lalu berhenti untuk konfirmasi.
Aturan lengkap ada di `CLAUDE.md`.

**Status:** Fase 1 ✅ · Fase 2 ✅ · Fase 3 ✅ · Fase 4 ✅ · Fase 4B ✅ · Fase 5 berikutnya

Tugas di tiap fase adalah script asli. Bagian **"Penyesuaian (revisi 2026-09-30)"** tidak mengubah ketentuan.
Isinya catatan teknis dan urutan kerja supaya tidak ada pekerjaan yang harus dibongkar ulang di fase berikutnya.

---

## Fase 1 — Fondasi & layout ✅

Baca CLAUDE.md dan isi folder /design-handoff dulu.

1. Buat proyek Next.js + TypeScript + Tailwind di folder ini (jangan buat subfolder baru).
2. Atur tailwind.config dengan palet warna dan font dari CLAUDE.md.
3. Buat komponen layout: Navbar atas sticky (logo, menu Beranda, Koleksi dengan dropdown kategori, Panduan, Tentang Kami, ikon cari, ikon keranjang dengan badge), drawer hamburger untuk mobile, bottom nav ringan di mobile, dan Footer.
4. Buat komponen dasar reusable: Button, ProductCard, Container.
5. Buat halaman Beranda kosong yang memakai layout ini.
6. Buat .env.example dan pastikan .env.local masuk .gitignore.

Catatan pelaksanaan: Tailwind v4 tidak memakai tailwind.config, jadi token ditulis di `@theme` pada `src/app/globals.css`.

## Fase 2 — Database & katalog ✅

1. Rancang skema database Supabase: profiles (dengan role user/admin), categories, products, product_variants (warna, ukuran, stok, harga), product_images, addresses, carts, cart_items, orders, order_items, reviews, wishlists.
2. Tulis skema sebagai file migration SQL di folder /supabase/migrations, lengkap dengan RLS policy per tabel. Jelaskan tiap policy dengan bahasa sederhana.
3. Buat file seed dengan 7 kategori (Hijab Segi Empat, Pashmina, Instan/Bergo, Outer, Bawahan, Dress, Aksesoris) dan 12 produk dummy dengan nama singkat maksimal 2 baris, harga, bahan, warna, dan stok.
4. Buat halaman Koleksi (filter kategori, harga, bahan, warna; sorting; pencarian; pagination) dan halaman Detail Produk (galeri, pilihan varian, stok per varian).
5. Hubungkan Beranda: grid kategori dan produk terbaru dari database.

Catatan pelaksanaan: kolom `weight_gram` (berat produk) sudah dibuat di fase ini, jadi Fase 6 tidak perlu migration berat lagi.

---

## Fase 3 — Auth & akun ✅

1. Auth dengan Supabase: daftar, login email/password, login Google, lupa password.
2. Buat trigger agar profil otomatis dibuat saat user daftar, dengan role default "user".
3. Halaman Akun: profil, buku alamat (tambah/edit/hapus), riwayat pesanan (kosong dulu), wishlist.
4. Proteksi halaman yang butuh login memakai middleware.
5. Semua form pakai validasi Zod dan pesan error yang jelas dalam Bahasa Indonesia.

Jelaskan alur login dengan analogi sederhana sebelum menulis kode.

**Penyesuaian (revisi 2026-09-30):**
- **Middleware = `src/proxy.ts`.** Di Next.js 16, middleware berganti nama menjadi proxy. Fungsinya sama: memperbarui sesi login dan menolak halaman terproteksi. Pengecekan hak akses tetap diulang di server dan dijaga RLS, jadi proxy bukan satu-satunya penjaga.
- **Rate limit login dipasang di fase ini** (aturan CLAUDE.md), bukan menunggu Fase 8. Penghitungnya disimpan di tabel Postgres, jadi tidak perlu layanan tambahan.
- **Email transaksional:** SMTP bawaan Supabase sangat terbatas dan hanya mengirim ke anggota tim project. Supaya email verifikasi dan reset password sampai ke pembeli sungguhan, pasang SMTP gratis (mis. Resend). *Butuh akun dari kalian.*
- **Login Google** butuh OAuth Client di Google Cloud Console. *Kalian yang membuat, saya pandu langkahnya.*
- **Tentukan dulu penyedia ongkir (riset tugas 2 Fase 6)** sebelum membuat form alamat. Beberapa penyedia butuh ID wilayah (kecamatan/kode pos), jadi form alamat langsung dibuat sesuai format itu dan tidak perlu diubah lagi di Fase 6.
- Tombol hati (wishlist) di kartu dan detail produk disambungkan ke tabel `wishlists`.
- Tambah kolom nama tampilan di `reviews`, karena `profiles` dikunci RLS dan nama pengulas tidak bisa dibaca publik.
- **Siapkan Vitest** (library tes) di fase ini, untuk validasi form. Fase 4 dan 5 memakainya untuk tes wajib.

## Fase 4 — Keranjang & checkout ✅

1. Keranjang: tamu memakai localStorage, user login memakai tabel carts di database. Saat tamu login, gabungkan keduanya.
2. Halaman Keranjang: ubah jumlah, hapus item, ringkasan harga, peringatan kalau stok berubah.
3. Checkout 3 langkah: alamat, kurir dan ongkir (pakai data tiruan dulu lewat modul /lib/shipping yang mudah diganti), lalu konfirmasi.
4. Buat pesanan lewat server action atau route handler. Server harus menghitung ulang harga dari database, bukan memakai harga dari browser.
5. Kurangi stok secara atomik saat pesanan dibuat. Status awal pesanan: menunggu pembayaran.
6. Tulis tes untuk fungsi hitung total dan pengurangan stok.

Setelah selesai, jelaskan kenapa harga tidak boleh dihitung di browser.

**Penyesuaian (revisi 2026-09-30):**
- **Pembuatan pesanan dilakukan dalam satu fungsi database (RPC `create_order`).** Isinya: hitung ulang harga dari tabel varian, kurangi stok dengan `stock = stock - qty WHERE stock >= qty`, simpan pesanan dan itemnya. Semua berjalan dalam satu transaksi, jadi kalau satu item gagal, semuanya dibatalkan. Server action hanya memanggil fungsi ini.
- **Interface `/lib/shipping` dibuat final di fase ini** (tipe input dan output, fungsi `getRates`), dengan provider tiruan. Tugas 1 Fase 6 tinggal dicek, bukan ditulis ulang.
- Set `expires_at` pesanan (mis. 24 jam) supaya Fase 5 bisa mengembalikan stok pesanan yang kedaluwarsa.
- **Rate limit checkout** dipasang di fase ini.
- **Tes pengurangan stok** butuh database sungguhan. Karena tidak memakai Docker, buat **project Supabase kedua (gratis) khusus tes**, supaya tes tidak pernah menyentuh data production.
- Kolom "Kode voucher" di desain belum masuk script, jadi ditampilkan nonaktif atau disembunyikan dulu.

Catatan pelaksanaan:
- Project Supabase tes belum dibuat, jadi `npm run test:db` sementara memakai project utama (data berawalan `zz-tes`, dihapus lagi di akhir tes). **Sebelum toko jualan sungguhan, isi `TEST_SUPABASE_*` di `.env.local` dengan project khusus tes.**
- Langkah 3 checkout berupa Konfirmasi. Pilihan metode pembayaran diputuskan di Fase 5 (daftar sesuai desain atau langsung popup Snap).
- Voucher, asuransi pengiriman, dan "Catatan untuk penjual" disembunyikan karena belum masuk script.

## Fase 4B — Halaman statis & deploy awal *(tambahan)* ✅

Bukan ketentuan baru, tapi langkah yang belum tercantum di script. Dibutuhkan portofolio dan Fase 5.
1. Halaman Panduan, Tentang Kami, Kebijakan Retur, dan seksi statis beranda (Tentang, Panduan bahan, Testimoni), supaya tidak ada link 404.
2. Deploy ke Vercel (paket Hobby) dan hubungkan environment variable.
3. Daftarkan domain Vercel di Supabase Auth (redirect URL) dan Google OAuth.

Alasannya: webhook Midtrans di Fase 5 butuh URL publik. Dengan deploy duluan, webhook bisa diuji langsung di URL Vercel, sedangkan tunnel lokal jadi cadangan. Repo publik juga sudah menampilkan demo yang bisa dibuka.

Catatan pelaksanaan:
- Demo online: **https://kynaraofficial.vercel.app** (Vercel Hobby, deploy otomatis dari branch `main`). Langkah lengkap di `docs/deploy.md`.
- Testimoni beranda diambil dari ulasan asli (rating 4–5), dan seksinya disembunyikan selama belum ada ulasan.
- Cerita brand, kebijakan retur, syarat & ketentuan, dan kebijakan privasi masih **draf** (`src/lib/content.ts` dan halamannya). Tinjau sebelum jualan sungguhan.
- Vercel Hobby hanya untuk non-komersial. Pindah paket atau hosting sebelum toko jualan sungguhan.

## Fase 5 — Pembayaran Midtrans

1. Integrasi Midtrans Snap mode sandbox: buat transaksi dari pesanan, buka popup pembayaran.
2. Buat endpoint webhook untuk notifikasi Midtrans. Verifikasi signature sebelum mengubah status pesanan. Tolak request yang signature-nya salah.
3. Update status pesanan: menunggu pembayaran, diproses, kedaluwarsa (stok dikembalikan), dibatalkan.
4. Halaman status pesanan dengan timeline.
5. Simpan Server Key dan Client Key di .env.local, jangan di kode.
6. Tulis tes untuk verifikasi signature.

Jelaskan apa itu webhook dengan analogi, dan cara mengujinya di sandbox (termasuk cara membuat URL lokal bisa dijangkau Midtrans).

**Penyesuaian (revisi 2026-09-30):**
- **Webhook harus idempoten:** Midtrans bisa mengirim notifikasi yang sama lebih dari sekali. Perubahan status dan pengembalian stok hanya boleh terjadi sekali per pesanan.
- **Jaring pengaman kedaluwarsa:** job terjadwal (`pg_cron` di Supabase) menandai pesanan yang lewat `expires_at` sebagai kedaluwarsa dan mengembalikan stok, meskipun notifikasi Midtrans tidak pernah sampai.
- Tambah `sold_count` produk saat pembayaran berhasil (dipakai urutan "Terlaris").
- Server Key juga didaftarkan di environment variable Vercel, bukan hanya di `.env.local`.

## Fase 6 — Ongkos kirim

1. Rapikan /lib/shipping dengan interface yang jelas, sehingga provider bisa diganti tanpa mengubah halaman checkout.
2. Implementasi satu provider ongkir nyata. Sebelum memilih, cek syarat dan batas paket gratis terbaru, dan beri tahu pilihannya beserta alasannya.
3. Simpan berat per produk di database, hitung berat total keranjang, dan tampilkan pilihan kurir dan estimasi tiba.
4. Kalau API gagal atau kena batas, tampilkan pesan yang jelas dan sediakan fallback tarif flat.

**Penyesuaian (revisi 2026-09-30):**
- Tugas 1 sudah disiapkan di Fase 4, jadi di sini cukup dicek. Pemilihan penyedia (tugas 2) sudah diputuskan di awal Fase 3.
- Kolom berat sudah ada sejak Fase 2. Tinggal isi berat asli dan hitung total berat.
- Ongkir tetap dihitung ulang di server saat pesanan dibuat. Angka ongkir dari browser tidak dipercaya.
- Hasil cek ongkir disimpan sementara (cache) supaya kuota API gratis tidak cepat habis.

## Fase 7 — Admin

1. Halaman /admin yang hanya bisa diakses role admin (cek di middleware dan di policy database, jangan hanya di tampilan).
2. Dashboard ringkasan: penjualan hari ini dan bulan ini, jumlah pesanan per status.
3. CRUD produk dan varian, upload foto ke Supabase Storage dengan batas ukuran dan tipe file.
4. Kelola pesanan: ubah status, input nomor resi.
5. Kelola kategori dan banner beranda.
6. Ikuti desain admin di /design-handoff.

Jelaskan bagaimana saya menjadikan akun saya admin dengan aman.

**Penyesuaian (revisi 2026-09-30):**
- Policy admin di database (`is_admin()`) dan aturan wajib nomor resi sudah ada sejak Fase 2.
- Tabel `banners` belum ada, jadi perlu migration baru, ditambah policy Storage (bucket foto produk: publik baca, admin tulis, batas ukuran dan tipe file di level bucket).
- Aturan desain "maksimal 6 kategori di beranda" dijaga di database, bukan hanya di form.
- Angka dashboard dihitung oleh fungsi database khusus admin, supaya data pesanan tidak perlu dikirim semua ke browser.

## Fase 8 — Audit, SEO, performa

1. Audit keamanan seluruh proyek: cek RLS di semua tabel, cek tidak ada kunci rahasia di kode, cek semua endpoint punya validasi Zod dan pengecekan hak akses, tambahkan rate limit di login dan checkout. Buat laporan temuan dan perbaiki yang kritis.
2. SEO: title dan meta description unik per halaman, Open Graph, sitemap.xml, robots.txt, alt text di semua gambar.
3. Performa: next/image, lazy loading, target Lighthouse mobile di atas 85. Jalankan audit dan laporkan hasilnya.
4. Cek aksesibilitas dasar: kontras warna, label form, navigasi keyboard.
5. Buat README berisi cara menjalankan proyek dan daftar environment variable.

**Penyesuaian (revisi 2026-09-30):**
- Rate limit sudah dipasang di Fase 3 dan 4, jadi di sini **diaudit**, bukan dibuat.
- Pakai **Security Advisor & Performance Advisor** Supabase (dashboard) sebagai bagian audit RLS.
- README sudah dibuat lebih awal (portofolio), jadi di sini **diperbarui** (screenshot, link demo, hasil Lighthouse).
- Cek batas paket gratis yang memengaruhi demo: project Supabase Free bisa di-pause kalau tidak aktif, dan Vercel Hobby hanya untuk non-komersial. Catat rencana saat toko mulai jualan sungguhan.
