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

   Env Midtrans (`MIDTRANS_*`) ditambahkan di Fase 5. `TEST_SUPABASE_*` **tidak perlu** diisi di Vercel.
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

## 4. Cek setelah deploy

- [ ] Beranda, Koleksi, Detail produk, Panduan, Tentang, Kebijakan retur terbuka tanpa error.
- [ ] Daftar akun baru → link di email mengarah ke domain Vercel → akun aktif.
- [ ] Masuk dengan email dan dengan Google.
- [ ] Lupa password → link reset mengarah ke domain Vercel.
- [ ] Tambah ke keranjang → checkout → pesanan tercipta (status menunggu pembayaran).

## Kalau ada masalah

| Gejala | Penyebab umum |
|---|---|
| Build gagal "Missing env" | Environment variable belum diisi, atau salah nama. |
| Login Google error `redirect_uri_mismatch` / origin | Domain belum ditambahkan di Google (langkah 3). |
| Setelah login dilempar ke localhost | Site URL Supabase masih localhost, atau redirect URL Vercel belum didaftarkan (langkah 2). |
| Halaman error 500 semua | Project Supabase sedang dijeda (lihat catatan di atas). |
