# Deploy Kynara ke Vercel

Analogi: kode di GitHub itu **resep**, Vercel itu **dapur** yang memasaknya jadi website. Setiap kali ada perubahan di branch `main`, Vercel memasak ulang otomatis.
Kunci rahasia (environment variable) **tidak ikut ke GitHub**. Kunci itu dititipkan langsung ke Vercel, seperti kunci gudang yang hanya dipegang dapur.

> ⚠️ **Paket Vercel Hobby hanya untuk pemakaian non-komersial.** Aman untuk demo portofolio. Sebelum toko mulai jualan sungguhan, pindah ke Vercel Pro atau hosting lain.
> Project Supabase gratis juga **dijeda otomatis setelah ±7 hari tanpa aktivitas**. Kalau demo tidak bisa dibuka, buka dashboard Supabase lalu klik *Restore*.

## 1. Import project di Vercel

1. Masuk ke [vercel.com](https://vercel.com) dengan akun GitHub → **Add New… → Project**.
2. Pilih repo `kynara-official` → **Import**.
3. Framework terdeteksi otomatis sebagai **Next.js**. Build command dan output directory biarkan default.
4. Buka **Environment Variables**, lalu isi (nilai disalin dari `.env.local`):

| Nama | Rahasia? | Catatan |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | tidak | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | tidak | |
| `SUPABASE_SECRET_KEY` | **ya** | Hanya dibaca server. Jangan pernah diberi awalan `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SITE_URL` | tidak | Isi `https://<nama-project>.vercel.app` (tanpa `/` di akhir). Kalau belum tahu nama domainnya, deploy dulu, lalu isi dan **Redeploy**. |

   Env pembayaran ada di langkah 4. `TEST_SUPABASE_*` **tidak perlu** diisi di Vercel.
5. Klik **Deploy**. Tunggu ±2–3 menit, lalu catat domainnya, misalnya `https://kynara-official.vercel.app`.

> Mengubah environment variable **tidak** otomatis memperbarui website. Setelah mengubahnya, buka tab **Deployments → ⋯ → Redeploy**.

## 2. Supabase Auth: daftarkan domain Vercel

Dashboard Supabase → **Authentication → URL Configuration**:

- **Site URL** → ganti ke `https://<domain-vercel>`. Link di email (konfirmasi daftar, reset password) memakai `{{ .SiteURL }}`, jadi setelah ini email mengarah ke website online, bukan localhost.
- **Redirect URLs** → tambahkan `https://<domain-vercel>/auth/callback`. Redirect localhost (`:3000` dan `:3123`) **tetap disimpan** supaya login di laptop masih jalan.

Kenapa perlu? Supabase hanya mau mengarahkan user kembali ke alamat yang ada di daftar ini. Ini mencegah penipu membuat link login yang mengirim token ke website palsu.

## 3. Google OAuth: daftarkan domain Vercel

Google Cloud Console → project **Kynara** → **APIs & Services → Credentials** → OAuth client (Web):

- **Authorized JavaScript origins** → tambahkan `https://<domain-vercel>`.
- **Authorized redirect URIs** → **tidak perlu diubah**. Isinya tetap URL callback Supabase (`https://<project>.supabase.co/auth/v1/callback`), karena yang menerima jawaban Google adalah Supabase, bukan Vercel.

Perubahan di Google kadang butuh beberapa menit sebelum berlaku.

## 4. Pembayaran: Komerce Payment API (Fase 5)

**a. Kunci.** Isi di `.env.local` **dan** di Vercel (Settings → Environment Variables), lalu **Redeploy**:

| Nama | Rahasia? | Catatan |
|---|---|---|
| `KOMERCE_PAYMENT_API_KEY` | **ya** | Dashboard Komerce (collaborator.komerce.id) → **Developer → Settings → Api Key** → bagian **Payment API**, mode **Sandbox**. Bukan key ongkir. |
| `KOMERCE_CALLBACK_KEY` | **ya** | Kita buat **sendiri**: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Dikirim ke Komerce di setiap transaksi dan dipakai memeriksa segel callback. Nilai di Vercel dan laptop **boleh sama**. |
| `KOMERCE_IS_PRODUCTION` | tidak | `false` selama sandbox. |
| `RAJAONGKIR_API_KEY` | **ya** | Dashboard Komerce → **Developer → Settings → Api Key** → bagian **Shipping Cost** (RajaOngkir). Bukan key Payment. |
| `RAJAONGKIR_ORIGIN_ID` | tidak | ID wilayah asal kirim. Sekarang `4975` (Soreang, Kab. Bandung). |

**b. Callback (webhook).** Tidak perlu didaftarkan di dashboard. Alamat `https://<domain>/api/pembayaran/notifikasi`
dikirim otomatis di setiap transaksi, beserta kunci segelnya.

**c. Mencoba di laptop (localhost).** Komerce tidak bisa mengetuk `localhost`, jadi callback tidak sampai. Tidak masalah:
tekan **"Sudah bayar? Cek status"** di halaman pesanan, dan server akan bertanya langsung ke Komerce.
Kalau ingin menguji callback-nya sendiri dari laptop, buka website lewat tunnel, misalnya
`npx cloudflared tunnel --url http://localhost:3000` (gratis, tanpa akun), lalu belanja lewat alamat
`https://….trycloudflare.com` yang muncul. Callback URL otomatis mengikuti alamat itu.

**d. Membayar di sandbox.** Uang sungguhan tidak dipakai. Di halaman pesanan, klik **"Lihat cara bayar"**. Halaman bayar
sandbox Komerce punya tombol **Simulate Payment**.

**e. Jadwal kedaluwarsa.** Job `kedaluwarsakan-pesanan` (pg_cron, tiap 10 menit) dibuat oleh migration.
Cek di Supabase → **Integrations → Cron**.

**f. Biaya (per dokumentasi Komerce, cek lagi sebelum jualan).** VA Rp4.440 per transaksi, QRIS 0,99%. Keduanya sudah termasuk PPN
dan dipotong dari dana yang masuk.

## 5. Cek setelah deploy

- [ ] Beranda, Koleksi, Detail produk, Panduan, Tentang, Kebijakan retur terbuka tanpa error.
- [ ] Daftar akun baru → link di email mengarah ke domain Vercel → akun aktif.
- [ ] Masuk dengan email dan dengan Google.
- [ ] Lupa password → link reset mengarah ke domain Vercel.
- [ ] Tambah ke keranjang → checkout (pilih BCA VA) → pesanan tercipta dan nomor VA tampil.
- [ ] "Lihat cara bayar" → Simulate Payment → dalam ±20 detik status berubah jadi Diproses tanpa menekan apa pun (callback sampai).
- [ ] Coba juga QRIS: QR tampil dan berlaku 5 menit, lalu tombol "Buat QR baru" muncul.

## Kalau ada masalah

| Gejala | Penyebab umum |
|---|---|
| Build gagal "Missing env" | Environment variable belum diisi, atau salah nama. |
| Login Google error `redirect_uri_mismatch` / origin | Domain belum ditambahkan di Google (langkah 3). |
| "Kode pembayaran belum berhasil dibuat" | `KOMERCE_PAYMENT_API_KEY` / `KOMERCE_CALLBACK_KEY` kosong atau salah, atau belum Redeploy. Lihat log Vercel (`startPayment:`). |
| Checkout selalu menampilkan "tarif flat" | `RAJAONGKIR_API_KEY` / `RAJAONGKIR_ORIGIN_ID` kosong atau salah, atau kuota harian (100 hit) habis. Lihat log Vercel (`ongkir rajaongkir gagal`). |
| Status tidak berubah sendiri setelah bayar | Callback ditolak: cek log Vercel `signature salah`. Sementara itu, tombol "Sudah bayar? Cek status" tetap bisa dipakai. |
| Setelah login dilempar ke localhost | Site URL Supabase masih localhost, atau redirect URL Vercel belum didaftarkan (langkah 2). |
| Halaman error 500 semua | Project Supabase sedang dijeda (lihat catatan di atas). |
