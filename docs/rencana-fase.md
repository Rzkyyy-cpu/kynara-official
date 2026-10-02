# Rencana Fase — Kynara Store

Setiap fase dikerjakan dengan urutan yang sama: tampilkan rencana, tunggu persetujuan, kerjakan, lalu berhenti untuk konfirmasi.
Aturan lengkap ada di `CLAUDE.md`.

**Status:** Fase 1 ✅ · Fase 2 ✅ · Fase 3 ✅ · Fase 4 ✅ · Fase 4B ✅ · Fase 5 ✅ · Fase 6 ✅ · Fase 7 ✅ · Fase 8A ✅ · Fase 8B ✅

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

## Fase 5 — Pembayaran Midtrans ✅

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

Catatan pelaksanaan:
- **Gateway diganti dari Midtrans Snap ke Komerce Payment API** (keputusan pemilik proyek, 2026-10-01). Alasannya: satu akun dengan RajaOngkir, alur pilih-metode-di-website sesuai desain, dan biaya jelas (VA Rp4.440, QRIS 0,99%). Isi tugas tetap sama: "Midtrans" di tugas 1–2 dan 5 dibaca sebagai "Komerce Payment". Server Key diganti `KOMERCE_PAYMENT_API_KEY` dan `KOMERCE_CALLBACK_KEY`, Client Key tidak diperlukan.
- Metode: VA (bank dari API `/methods`) dan QRIS. E-wallet (GoPay, OVO, DANA, ShopeePay) dibayar lewat QRIS. Transfer manual via WhatsApp dibuang karena tidak bisa diverifikasi otomatis.
- Satu pesanan bisa punya beberapa percobaan bayar (tabel `payments`): QRIS hanya berlaku 5 menit, dan pembeli bisa ganti metode. VA lama dinonaktifkan lewat API saat ganti metode. VA atau QR yang kedaluwarsa tidak membatalkan pesanan, yang membatalkan hanya batas bayar 24 jam.
- Masa berlaku VA disamakan dengan batas bayar pesanan. Karena minimal VA 1 jam, kalau sisa waktu kurang dari 1 jam hanya QRIS yang bisa dipilih.
- Callback diverifikasi dengan HMAC-SHA256 dari body mentah (header `X-Callback-Api-Key`), lalu status **ditanyakan ulang ke API Komerce**. Status diubah hanya lewat RPC `apply_payment_status` (idempoten).
- Uang yang masuk setelah pesanan kedaluwarsa (`PEMBAYARAN_TERLAMBAT`) atau pembayaran kedua (`PEMBAYARAN_GANDA`) tidak mengubah status. Keduanya dicatat di `order_status_history` untuk ditangani admin di **Fase 7** (refund atau proses manual).
- **Untuk Fase 7:** pembatalan pesanan oleh admin harus lewat fungsi database yang juga mengembalikan stok dan menutup VA yang masih aktif (API cancel), jangan `update status` langsung.
- pg_cron `kedaluwarsakan-pesanan` berjalan tiap 10 menit, dengan tenggang 15 menit setelah `expires_at`.
- Halaman status pesanan dimuat ulang dari server tiap 20 detik selama ada VA/QR aktif, jadi status berubah sendiri begitu callback masuk.
- Halaman status pesanan tetap memakai sidebar akun di desktop (desainnya tanpa sidebar), sama seperti halaman akun lain.
- Migration berurutan: `pembayaran_midtrans` (riwayat status, pg_cron), `perbaiki_kolom_metode_bayar`, lalu `pembayaran_komerce` (tabel payments, RPC versi Komerce). Dua migration pertama tetap di repo karena sudah terpasang di database.
- Library baru: `qrcode-generator` (MIT, tanpa dependensi), untuk menggambar QRIS dari `qr_string`.

## Fase 6 — Ongkos kirim ✅

1. Rapikan /lib/shipping dengan interface yang jelas, sehingga provider bisa diganti tanpa mengubah halaman checkout.
2. Implementasi satu provider ongkir nyata. Sebelum memilih, cek syarat dan batas paket gratis terbaru, dan beri tahu pilihannya beserta alasannya.
3. Simpan berat per produk di database, hitung berat total keranjang, dan tampilkan pilihan kurir dan estimasi tiba.
4. Kalau API gagal atau kena batas, tampilkan pesan yang jelas dan sediakan fallback tarif flat.

**Penyesuaian (revisi 2026-09-30):**
- Tugas 1 sudah disiapkan di Fase 4, jadi di sini cukup dicek. Pemilihan penyedia (tugas 2) sudah diputuskan di awal Fase 3.
- Kolom berat sudah ada sejak Fase 2. Tinggal isi berat asli dan hitung total berat.
- Ongkir tetap dihitung ulang di server saat pesanan dibuat. Angka ongkir dari browser tidak dipercaya.
- Hasil cek ongkir disimpan sementara (cache) supaya kuota API gratis tidak cepat habis.

Catatan pelaksanaan:
- Provider: **RajaOngkir (Komerce) Starter**, gratis 100 hit cek ongkir per hari (dicek 2026-10-01). Asal kirim Soreang, Kab. Bandung (`RAJAONGKIR_ORIGIN_ID=4975`). Kurir: JNE, J&T, SiCepat, semuanya dihitung dalam 1 hit. Layanan kargo/truk dan Super Speed (SPS) disembunyikan.
- **SiCepat tidak muncul:** RajaOngkir menjawab "not found" untuk SiCepat dari Soreang. Kodenya dibiarkan (tidak menambah hit), jadi akan muncul sendiri kalau rutenya tersedia.
- Cache di database (hanya server yang bisa akses): `shipping_destinations` (ID wilayah per provinsi/kota/kecamatan/kode pos, disimpan permanen; wilayah yang tidak ditemukan dicoba lagi setelah 7 hari) dan `shipping_rate_cache` (tarif per tujuan dan berat per kg, berlaku 24 jam).
- **Kolom `addresses.rajaongkir_destination_id` dihapus**, tidak dipakai seperti rencana Fase 3. Pemilik alamat boleh mengubah barisnya sendiri, jadi kolom itu bisa diisi ID kota yang lebih murah. ID tujuan sekarang dicari server dari data wilayah resmi.
- Pencocokan wilayah mewajibkan provinsi dan kecamatan sama (nama kecamatan bisa kembar, contoh Soreang di Kab. Bandung dan Parepare). RajaOngkir masih memakai provinsi Papua sebelum pemekaran 2022, jadi Papua Selatan/Tengah/Pegunungan dicocokkan dengan "PAPUA".
- Berat paket = berat produk + **100 gram kemasan**. `orders.total_weight_gram` tetap berat isi (dihitung `create_order`).
- **Fallback tarif flat** kalau API gagal, kuota habis, atau tidak ada kurir: Jawa Rp5.000/kg (maks. Rp10.000), Bali & Sumatera bagian selatan Rp10.000/kg (maks. Rp20.000), lainnya Rp40.000. Pembeli melihat pesan bahwa tarif flat sedang dipakai.
- Berat produk seed (50–600 gram) dipakai apa adanya. Ganti dengan berat hasil timbang lewat admin di Fase 7.
- `RAJAONGKIR_API_KEY` dan `RAJAONGKIR_ORIGIN_ID` juga harus didaftarkan di environment variable Vercel.

## Fase 7 — Admin ✅

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

Catatan pelaksanaan — dibagi dua: **7A** (tugas 1, 2, 4 + Ringkasan/Pesanan) ✅ dan **7B** (tugas 3, 5: Produk, Kategori, Banner) ✅.
- **Tiga lapis penjaga /admin:** `proxy.ts` (login + `is_admin()`), `requireAdmin()` di layout/aksi/route CSV (bukan admin = 404), lalu fungsi database yang mengecek `is_admin()` lagi.
- **Hak `update status, tracking_number` langsung ke `orders` dicabut.** Semua perubahan lewat RPC `admin_update_order`: menunggu→dibatalkan, diproses→dikirim (resi wajib, 6–40 huruf/angka/strip), diproses→dibatalkan, dikirim→selesai, plus koreksi resi. Admin tidak bisa menandai lunas. Pembatalan mengembalikan stok, menutup VA/QR yang menunggu (juga lewat API cancel Komerce), dan pada pesanan lunas mengurangi `sold_count` serta mencatat `PERLU_REFUND` (keputusan: pesanan lunas boleh dibatalkan, refund manual).
- Pembayaran terlambat/ganda/refund tampil di detail pesanan admin dan ditutup dengan tombol "Tandai sudah ditangani" (RPC `admin_resolve_payment_issue`, catatan `MASALAH_BAYAR_DITANGANI`). Halaman status pesanan pembeli ikut menampilkan pemberitahuan refund.
- Ringkasan: periode Hari ini / 7 / 30 hari / Bulan ini (WIB), penjualan = pesanan yang sudah dibayar dihitung dari `paid_at`. Penjualan hari ini dan bulan ini selalu tampil di bawah judul, ditambah baris jumlah pesanan per status. Stok menipis = varian aktif dengan stok ≤ 5.
- Pesanan: tab status (Dibatalkan = dibatalkan + kedaluwarsa), cari nomor/nama, rentang tanggal, kurir, 20 per halaman, Unduh CSV (aman dari CSV injection), toast dengan link WhatsApp ke pembeli. Checkbox pilih banyak di desain tidak dibuat karena belum ada aksi massal.
- Desain admin hanya desktop. Di HP sidebar jadi bilah atas dengan menu geser, dan tabel bisa digeser ke samping.
- Field produk dari desain yang belum ada di database (harga coret, label foto, toggle "Produk terbaru") **dilewati** (keputusan pemilik proyek), tidak masuk 7B.
- Tes: `admin-orders.db.test.ts` (7 tes, dipanggil sebagai user login sungguhan) dan `admin/admin.test.ts`.

Catatan 7B:
- **Bucket Storage `katalog`** (publik baca, hanya admin tulis/hapus/daftar). Batas 2 MB dan JPG/PNG/WebP dijaga bucket. Foto diunggah **langsung dari browser** ke Storage; server hanya menerima URL, dan Zod menolak URL di luar bucket ini. Resolusi minimum dicek di browser (produk 1080×1350, kategori 800×1000, banner desktop 1440×640, HP 800×1000): foto lebih kecil ditolak (keputusan pemilik proyek). Foto yang dibuang/diganti dihapus dari Storage saat form disimpan; unggahan yang batal disimpan masih tertinggal (bisa dibersihkan manual di dashboard).
- **`admin_save_product`**: produk + varian + foto dalam satu transaksi. **Stok disimpan sebagai selisih** (keputusan pemilik proyek), jadi pesanan yang masuk saat admin mengedit tidak hilang. Varian yang dibuang tapi pernah dipesan dinonaktifkan, bukan dihapus. Slug produk tidak berubah saat diedit.
- **Produk yang pernah dipesan tidak bisa dihapus** (trigger `PRODUK_PERNAH_DIPESAN`), cukup disembunyikan. Kategori yang masih punya produk tidak bisa dihapus (foreign key).
- Form produk: varian dibentuk dari chip Warna × Ukuran; detail ukuran (mis. 175 × 75 cm) per ukuran; harga dasar bisa diterapkan ke semua varian; SKU otomatis dan bisa diubah; pratinjau memakai `ProductCard` asli (mode `preview`, tanpa wishlist). Maks. 8 foto, urutan dengan tombol panah (tanpa library seret).
- Kategori: tambah/edit (nama, slug, deskripsi, foto), urutan naik/turun, toggle beranda. **Maks. 6 di beranda dan maks. 3 banner tayang dijaga trigger database** (dengan kunci antrean, aman dari klik bersamaan).
- Banner: judul, subjudul, tombol (hanya ke koleksi/kategori/produk sendiri), gambar desktop + HP, tanggal mulai/selesai, tayang atau draf. **Hero beranda memakai banner aktif paling atas saja** (keputusan pemilik proyek); tanpa banner, teks hero bawaan tetap dipakai. Foto kategori tampil di beranda kalau sudah diunggah.
- **Gambar tidak tampil di `next start` lokal laptop ini**: jaringan memakai NAT64 (`64:ff9b::`), dan optimizer gambar Next menolak alamat itu sebagai "IP lokal" (perlindungan SSRF). Di Vercel normal. `images.dangerouslyAllowLocalIP` sengaja **tidak** dipasang.
- Tes: `admin-catalog.db.test.ts` (6 tes: batas beranda & banner, simpan atomik, stok selisih, varian dipesan, Storage) dan `admin/catalog.test.ts`.

## Fase 8 — Audit, SEO, performa ✅

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

Catatan pelaksanaan — dibagi dua: **8A** (tugas 1: audit keamanan) ✅ dan **8B** (tugas 2–5: SEO, performa, aksesibilitas, README).
- Laporan lengkap: `docs/audit-keamanan.md`. Tidak ada temuan kritis; 1 sedang (open redirect `?next=` lewat karakter tab, diperbaiki) dan 4 rendah (policy RLS ganda, `rls_auto_enable()` publik, header keamanan, input tanpa Zod), semuanya diperbaiki.
- Migration `audit_keamanan_advisor`: policy admin `for all` di 5 tabel katalog dipecah jadi insert/update/delete (hak akses sama), EXECUTE `rls_auto_enable()` dicabut dari publik.
- Header keamanan di `next.config.ts`. CSP hanya `frame-ancestors`/`object-src`/`base-uri`; CSP script penuh ditunda karena butuh nonce per request (katalog jadi tidak bisa di-cache).
- Temuan Advisor yang diterima: `is_admin()` publik (dipakai RLS), RPC admin bisa dipanggil user login (menolak dari dalam), *leaked password protection* (paket Pro).
- Lighthouse diukur lewat PageSpeed Insights ke URL Vercel (pengujian lokal tidak akurat karena masalah NAT64 gambar).

Catatan pelaksanaan **8B** (SEO, performa, aksesibilitas, README):
- **SEO:** `metadataBase` + Open Graph bawaan di layout root, gambar pratinjau `app/opengraph-image.tsx` (next/og, dibuat saat build), `app/sitemap.ts` (beranda, koleksi, kategori, produk aktif, halaman konten; revalidate 1 jam), `app/robots.ts`. Produk: `og:image` = foto pertama, dengan gambar bawaan sebagai cadangan. URL kanonik di beranda, koleksi (filter/urut/halaman diarahkan ke kategori), dan produk. Masuk/daftar/lupa/reset password dan keranjang diberi `noindex`. Alamat situs dari `SITE_URL` di `lib/site.ts` (`NEXT_PUBLIC_SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → localhost).
- **Produk yang tidak ada mengembalikan HTTP 200**, bukan 404: karena ada `loading.tsx`, halaman sudah mulai dikirim (streaming) sebelum `notFound()`. Next otomatis menambah `<meta name="robots" content="noindex">`, jadi aman untuk SEO. Dibiarkan.
- **Performa, temuan & perbaikan:**
  - Fungsi Vercel berjalan di `iad1` (AS) padahal database di Singapura → `vercel.json` `regions: ["sin1"]`.
  - Halaman produk dirender ulang tiap kunjungan (ƒ, `no-store`, TTFB ±1,2 dtk) → `generateStaticParams` mengembalikan `[]` sehingga jadi ISR (●), di-cache setelah kunjungan pertama.
  - Zod lengkap (±90 KB gzip) ikut ke browser di semua halaman toko lewat `CartProvider → cart/storage.ts` → keranjang tamu divalidasi dengan `zod/mini` (paket yang sama, ±23 KB). Kesamaan aturan dengan skema server dijaga `cart/storage.test.ts`.
  - supabase-js (±68 KB gzip) ada di bundel awal lewat `AuthProvider` → dimuat dengan dynamic import setelah halaman tampil.
  - Hasil: JavaScript awal beranda ±344 KB → ±210 KB (gzip). Sisanya terutama React DOM dan runtime Next.
- **Lighthouse mobile sebelum 8B** (Lighthouse 12 CLI dari laptop ke URL Vercel): Beranda performa 79 · aksesibilitas 100 · best practices 100 · SEO 100; Koleksi 64 · 98 · 100 · 100 (TBT 1.830 ms, heading loncat h1→h3). Laptop ini lebih lambat dari server PageSpeed (benchmarkIndex ±700–1.100), jadi TBT cenderung lebih buruk dari angka resmi. PageSpeed Insights API anonim sempat kena kuota harian. Sesudah deploy (Lighthouse 12 CLI ke Vercel, median 5 run, a11y/BP/SEO 100 di semua): Beranda 80 (run 78–89), Koleksi 87 (82–89), Produk 85 (78–88). TTFB Koleksi 0,67–1,15 dtk → ±0,2 dtk setelah `sin1`; produk HIT dari cache. **Beranda belum konsisten di atas 85**: sisa beban di runtime React/Next dan HTML beranda yang paling besar (±144 KB, banyak bagian & SVG); perbaikan lanjutan butuh merombak komponen beranda. Angka resmi PageSpeed (server lebih cepat dari laptop ini) belum diambil karena kuota API.
- **Aksesibilitas:** semua token warna teks dicek kontrasnya dengan skrip (WCAG AA). Yang gagal hanya inisial avatar admin (putih di `slate`, 3,5:1) → `slate-600` (6:1). Teks putih di panel login `slate` lolos sebagai teks besar (≥ 24px). Cincin `:focus-visible` global (`slate-700`; di area `data-latar="gelap"` memakai warna teks). Skip link "Langsung ke konten" di layout toko. `h2` khusus pembaca layar di Koleksi & Wishlist (urutan heading). Semua input sudah berlabel, alt text sudah sesuai (gambar dekoratif `alt=""`). Lighthouse lokal sesudah perubahan: aksesibilitas 100 di beranda, koleksi, produk, tentang, masuk, daftar, keranjang.
- **README** diperbarui: demo, screenshot (`docs/screenshots/`, diambil dari demo Vercel), fitur lengkap, env `TEST_SUPABASE_*`, batas paket gratis.
- **Rencana saat mulai jualan sungguhan:** pindah dari Vercel Hobby (non-komersial) ke Vercel Pro atau hosting lain + domain sendiri (`NEXT_PUBLIC_SITE_URL`, Supabase Auth, Google OAuth, dan callback Komerce ikut diganti); Supabase Pro supaya tidak di-pause dan mendapat *leaked password protection* + backup harian; Komerce `KOMERCE_IS_PRODUCTION=true`; project Supabase terpisah untuk `test:db`; isi kontak toko dan teks kebijakan final.
