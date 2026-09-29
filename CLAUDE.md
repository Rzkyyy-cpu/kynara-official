# Proyek: Kynara Store

## Tentang proyek
Toko online kerudung dan fashion muslimah bernama Kynara. Dibangun oleh dua mahasiswa informatika yang sedang belajar full stack, jadi setiap konsep baru harus dijelaskan dengan bahasa sederhana dan analogi.

## Tech stack
- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4. Baca @AGENTS.md: API Next.js 16 berbeda dari versi lama (contoh: middleware sekarang bernama proxy).
- Supabase (PostgreSQL, Auth, Storage)
- Midtrans Snap (sandbox dulu)
- Zod untuk validasi input
- Deploy: Vercel + Supabase, semua paket gratis

## Acuan desain
- Folder /design-handoff berisi prototipe dari Claude Design (file HTML per layar, dibaca sebagai acuan visual, bukan kode final). Baca README.md di dalamnya dulu.
- Peta layar:
  - desktop-belanja / mobile-belanja: Beranda, Koleksi, Detail Produk, Keranjang
  - desktop-akun-checkout / mobile-akun-checkout: Login, Akun, Checkout, Status Pesanan
  - admin-desktop: Dashboard admin
  - komponen-state: Button, ProductCard, form, state kosong/loading/error (acuan utama komponen reusable)
- Ambil palet warna dan font langsung dari file desain, definisikan sebagai token di blok `@theme` pada src/app/globals.css (Tailwind v4 tidak memakai tailwind.config). Jangan tebak nilainya.
- Semua halaman mobile-first.

## Aturan kerja
- Kerjakan per fase dan berhenti untuk konfirmasi di akhir tiap fase.
- Sebelum menulis kode, tampilkan rencana singkat: file apa yang dibuat atau diubah.
- Jelaskan konsep baru dengan bahasa sederhana. Beri komentar singkat di kode yang penting.
- Jangan tambah library berbayar atau yang tidak perlu. Sebutkan alasan kalau menambah library.
- Jangan pernah menulis kunci rahasia ke dalam kode. Semua kunci di .env.local, dan .env.local ada di .gitignore.
- Tulis tes untuk logika kritis: hitung total harga, pengurangan stok, verifikasi webhook.
- Jangan ubah file di luar lingkup fase yang sedang dikerjakan.
- Jangan mengubah isi folder /design-handoff.

## Aturan keamanan
- Aktifkan Row Level Security (RLS) di semua tabel Supabase.
- Harga dan total selalu dihitung ulang di server, jangan percaya angka dari browser.
- Verifikasi signature webhook Midtrans sebelum mengubah status pesanan.
- Kurangi stok secara atomik saat pesanan dibuat, kembalikan stok kalau pembayaran kedaluwarsa.
- Rate limit pada endpoint login dan checkout.
- Validasi semua input dengan Zod.