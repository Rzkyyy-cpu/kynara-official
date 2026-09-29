# kynara — Desain Toko Online

Desain website e-commerce (katalog + toko penuh) untuk **kynara**, brand kerudung dan fashion muslimah.
Target pembeli: perempuan usia 17–45 tahun di Indonesia yang belanja lewat HP.

Semua desain kanvas ada di design-handoff, dibagi ke 6 halaman kanvas dengan total 48 artboard.
Setiap layar tersedia dalam dua ukuran: **mobile 390px** dan **desktop 1440px**. Admin hanya versi desktop.

---

## Isi folder

| Isi | Kegunaan |
|---|---|
| `*.html` | Prototipe interaktif. Buka di browser untuk mencoba interaksi dan Tweaks (state loading, error, kosong). |
| `screen/` | Screenshot PNG per layar (`NN-nama-layar.png`). Dipakai untuk melihat tampilan akhirnya. |
| `source/` | Kode desain hasil ekstrak dari file HTML, satu file per layar, ditambah `_komponen/`. Dipakai untuk mengambil nilai persis: warna, ukuran, spacing, dan struktur. File-file ini tidak bisa ditampilkan di browser. Penjelasan lengkapnya ada di `source/README.md`. |

Nomor urut file di `screen/` dan `source/` sama, jadi `03-...` di kedua folder adalah layar yang sama.

---

## Isi kanvas

| Halaman kanvas | Isi |
|---|---|
| desktop-belanja | Beranda, Koleksi, Detail Produk, Keranjang |
| moibile-belanja | Beranda, Menu Drawer, Koleksi, Filter & Urutkan, Detail Produk, Keranjang |
| mobile-akun-checkout | Masuk, Daftar, Lupa Password, Akun + Riwayat Pesanan, Wishlist, Buku Alamat, Profil, Checkout 1–3, Status Pesanan |
| desktop-akun-checkout | Masuk, Daftar, Lupa Password, Riwayat Pesanan, Wishlist, Profil & Alamat, Checkout 1–3, Status Pesanan |
| admin-desktop | Ringkasan, Pesanan, Produk, Tambah/Edit Produk, Kategori, Banner Beranda |
| komponen-state | Sistem desain, Navbar, Bottom Nav, Kartu Produk, Footer, Sidebar Admin, lembar state (kosong, loading, error, sukses) |

### Struktur beranda
1. Navbar sticky: logo, Beranda, Koleksi (dropdown 7 kategori), Panduan, Tentang Kami, ikon cari, akun, keranjang
2. Hero: judul singkat + tombol "Belanja Sekarang"
3. Kategori: grid 6 kategori bergambar
4. Produk terbaru: kartu produk dengan badge bahan
5. Tentang kynara + kenapa memilih kami (bahan, jahitan, ukuran, pengiriman)
6. Panduan bahan: tabel perbandingan Voal, Airflow, Satin, Ceruty, Jersey
7. Testimoni
8. Footer: WhatsApp, Instagram, TikTok, jam layanan, kebijakan retur

Di mobile, navbar berubah jadi hamburger + drawer. Bottom nav (Beranda, Koleksi, Keranjang, Akun) hanya pelengkap, bukan pengganti navbar atas.

---

## Warna

| Token | Hex | Dipakai untuk |
|---|---|---|
| `--sky` | `#9FC7D5` | Aksen: foto hero, latar seksi Tentang |
| `--sky-tint` | `#E4F0F4` | Badge bahan, status Dikirim |
| `--slate` | `#708BAA` | Warna utama: fokus input, border terpilih, grafik |
| `--slate-600` | `#4A6588` | Tombol utama (teks putih, kontras 5,9:1) |
| `--slate-700` | `#3F5A7D` | Link, ikon aktif, status aktif |
| `--slate-900` | `#34496A` | Latar footer |
| `--pink` | `#F4C9CB` | Aksen dekoratif, foto brand |
| `--blush` | `#FDE9E9` | Badge "Baru", peringatan stok |
| `--bg` | `#FFF6F5` | Latar halaman |
| `--paper` | `#FFFFFF` | Kartu, form, drawer |
| `--line` | `#EFE1E2` | Garis pemisah |
| `--ink` | `#2B2B2B` | Teks utama |
| `--muted` | `#5E5A62` | Teks sekunder |
| `--error` | `#8C2F48` di atas `#FBE3E8` | Pesan error |

Warna status pesanan:

| Status | Latar | Teks |
|---|---|---|
| Menunggu Pembayaran | `#F6EBD3` | `#6B4A0E` |
| Diproses | `#ECE8F5` | `#4A3F72` |
| Dikirim | `#E4F0F4` | `#2B3E5B` |
| Selesai | `#F0E8EA` | `#4A4650` |
| Dibatalkan | `#FBE3E8` | `#8C2F48` |

Aturan: satu tombol utama per layar. Pink tidak dipakai untuk teks karena kontrasnya rendah di latar putih.

---

## Tipografi

- **Heading:** Playfair Display 500
- **Isi:** Plus Jakarta Sans 400–700 (bisa diganti Inter kalau mau)

| Peran | Desktop | Mobile |
|---|---|---|
| Display / hero | 64/72 | 36/44 |
| Judul seksi | 40/48 | 28/36 |
| Isi | 16/26 | 15/24 |
| Nama produk | 15/22, maks. 2 baris | 14/20 |
| Label (eyebrow) | 12, huruf kapital, spasi 0,14em | sama |

---

## Komponen utama

- **Tombol:** tinggi 52 (utama), 48, 40 (admin), sudut penuh (pill). Varian: utama, outline, ghost, disabled, loading.
- **Kartu produk:** foto 4:5 dengan sudut 10px, label kecil (Baru / Stok terbatas), tombol wishlist 44×44, badge bahan, nama maks. 2 baris, harga, titik warna tersedia.
- **Grid produk:** desktop 4 kolom (gap 24), mobile 2 kolom (gap 12).
- **Input:** tinggi 48, sudut 12. State: default, fokus, error, nonaktif.
- **Target sentuh mobile:** minimal 44px.

---

## Fitur interaktif di prototipe

Buka artboard dengan tombol **Play** untuk mencoba:
- Pilih warna dan ukuran di detail produk: stok per varian berubah, varian habis menonaktifkan tombol.
- Ubah jumlah atau hapus item di keranjang, sampai muncul state kosong.
- Filter bahan dan harga di koleksi desktop, termasuk state "Belum ada yang cocok".
- Admin Pesanan: ubah status langsung dari tabel. Status "Dikirim" wajib diisi nomor resi.
- Admin Kategori: maksimal 6 kategori tampil di beranda.
- Admin Produk: penghitung nama produk maks. 40 karakter + pratinjau kartu.

Beberapa artboard punya **Tweaks** untuk berganti state: Masuk / Lupa Password (normal, loading, error, sukses), Checkout 2 (loading dan error ongkir), Status Pesanan (bayar, proses, kirim, selesai), Wishlist (kosong).

---

## Alur status pesanan

```
Menunggu Pembayaran → Diproses → Dikirim (wajib nomor resi) → Selesai
                   ↘ Dibatalkan
```

Checkout 3 langkah: (1) alamat pengiriman → (2) pilih kurir & ongkir → (3) metode pembayaran & konfirmasi.

---

## Yang masih harus diisi

Placeholder bertanda `[ ]` di desain:
- [ ] Nomor WhatsApp
- [ ] Username Instagram dan TikTok
- [ ] Jam layanan
- [ ] Batas hari retur
- [ ] Domain website
- [ ] Cerita singkat brand (seksi Tentang)

Konten contoh yang wajib diganti sebelum live:
- [ ] Nama produk, harga, dan stok
- [ ] Testimoni (ganti dengan ulasan asli pembeli)
- [ ] Angka di dashboard admin
- [ ] Foto produk dan kampanye (saat ini kotak warna 4:5)

---

## Catatan untuk implementasi

- Simpan warna di atas sebagai CSS variables supaya gampang diganti lagi.
- Ongkir di Checkout 2 nantinya diambil dari API cek ongkir. Siapkan state loading dan error seperti di desain.
- Data yang dibutuhkan kira-kira: `kategori`, `produk`, `varian` (warna × ukuran, stok, SKU, harga), `pengguna`, `alamat`, `pesanan`, `item_pesanan`, `banner`.
- Urutan kerja yang realistis: kerjakan 5 halaman inti versi mobile dulu (beranda, koleksi, detail produk, keranjang, checkout), lalu akun, baru admin.

## Catatan tambahan
- Stack tujuan: Next.js (App Router), TypeScript, Tailwind CSS, Supabase, Midtrans.
- File HTML di folder ini hanya acuan visual, bangun ulang sebagai komponen React yang rapi.
- Untuk komponen reusable (tombol, kartu, form, state kosong/loading/error), acuan utama adalah komponen-state.html.
- Aturan proyek lengkap ada di CLAUDE.md di root. Jika ada perbedaan, CLAUDE.md yang menang.