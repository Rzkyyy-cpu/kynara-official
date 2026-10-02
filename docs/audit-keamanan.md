# Audit Keamanan — Kynara Store (Fase 8A)

Tanggal: 2026-10-01 · Cakupan: seluruh kode di `src/`, migration `supabase/migrations/`, konfigurasi Next.js, dan Supabase Advisor.

## Ringkasan

| Tingkat | Jumlah | Status |
|---|---|---|
| Kritis | 0 | – |
| Sedang | 1 | Diperbaiki |
| Rendah | 4 | Diperbaiki |
| Diterima (sengaja) | 5 | Alasan dicatat di bawah |

Tidak ada temuan kritis: tidak ada kunci rahasia di kode atau riwayat git, RLS aktif di semua tabel, dan semua endpoint yang mengubah data mengecek login/hak akses serta memvalidasi input.

---

## 1. Temuan & perbaikan

### S-1 · Open redirect lewat karakter tersembunyi di `?next=` — **Sedang, diperbaiki**
`safeNextPath` (tujuan setelah login) menolak `//situs.com` dan `/\situs.com`, tapi meloloskan `/<TAB>/situs.com`.
Browser membuang tab dan baris baru dari URL, sehingga alamat itu berubah menjadi `//situs.com`: link login asli
`kynara…/masuk?next=…` bisa melempar pembeli ke situs penipu setelah login.
**Perbaikan:** karakter kontrol dan backslash ditolak, lalu alamat dibaca dengan parser URL (sama seperti browser) dan
harus tetap di situs sendiri. Tes baru di `src/lib/validation/auth.test.ts`.

### R-1 · Policy RLS ganda untuk SELECT (Performance Advisor) — **Rendah, diperbaiki**
Policy admin `for all` di `categories`, `products`, `product_variants`, `product_images`, `banners` ikut berlaku untuk SELECT,
padahal policy baca publiknya sudah mencakup admin. Postgres mengecek dua policy per baris.
**Perbaikan:** migration `audit_keamanan_advisor` memecahnya menjadi insert/update/delete. Hak akses tidak berubah
(dibuktikan tes baru di `admin-catalog.db.test.ts`).

### R-2 · `rls_auto_enable()` bisa dipanggil publik (Security Advisor) — **Rendah, diperbaiki**
Fungsi event trigger buatan Supabase (setting *automatic RLS*). Tidak membuka data, tapi muncul sebagai RPC.
**Perbaikan:** hak EXECUTE dicabut dari `public`, `anon`, `authenticated`. Trigger tetap berjalan karena dijalankan database.

### R-3 · Header keamanan belum ada — **Rendah, diperbaiki**
**Perbaikan** (`next.config.ts`): `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'; object-src 'none'; base-uri 'self'`
(anti-clickjacking), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy` (kamera, mikrofon, lokasi mati), `Strict-Transport-Security`.

### R-4 · Input yang belum lewat Zod — **Rendah, diperbaiki**
- `GET /api/wilayah/[kode]`: kode dicek regex manual → kini skema Zod.
- `setCategoryOnHome(show)` dan `setProductActive(active)`: nilai boolean dari browser kini divalidasi `z.boolean()`.

---

## 2. Temuan yang diterima (sengaja dibiarkan)

| Temuan | Sumber | Alasan |
|---|---|---|
| `is_admin()` bisa dipanggil anon & user login | Security Advisor | Dipakai policy RLS (dijalankan dengan peran pemanggil, jadi butuh EXECUTE) dan oleh `proxy.ts`. Hanya menjawab "apakah **saya** admin", tidak membuka data orang lain. |
| `admin_update_order()`, `admin_resolve_payment_issue()` bisa dipanggil user login | Security Advisor | Fungsi mengecek `is_admin()` di baris pertama dan menolak (`BUKAN_ADMIN`). Diuji di `admin-orders.db.test.ts` ("pembeli biasa ditolak"). |
| Leaked password protection mati | Security Advisor | Fitur paket Pro Supabase. Pengganti saat ini: minimal 8 karakter + rate limit login. Nyalakan saat pindah ke paket berbayar. |
| CSP belum membatasi script | Audit kode | CSP script penuh butuh nonce per request, sehingga semua halaman dirender ulang tiap kunjungan (katalog tidak bisa di-cache). React sudah meng-escape semua teks dan tidak ada `dangerouslySetInnerHTML` yang memuat input pengguna. Ditinjau lagi saat toko berjalan. |
| Rate limit gagal = diizinkan (fail-open) | Audit kode | Kalau tabel `rate_limits` error, pembeli tidak terkunci semua. Supabase Auth punya rate limit sendiri sebagai lapis kedua. |

---

## 3. Daftar periksa

### Database (RLS & fungsi)
- [x] RLS aktif di **18/18 tabel**. Tabel khusus server (`rate_limits`, `shipping_destinations`, `shipping_rate_cache`) sengaja tanpa policy: hanya bisa diakses kunci server.
- [x] Dua view (`product_cards`, `admin_product_list`) memakai `security_invoker`, jadi tunduk pada RLS.
- [x] 22/22 fungsi memakai `set search_path`. Fungsi SECURITY DEFINER khusus server dicabut dari `anon`/`authenticated`.
- [x] Pengguna tidak bisa mengubah `role` sendiri (GRANT per kolom). Kolom status/resi pesanan hanya lewat RPC admin.
- [x] Storage `katalog`: publik baca, hanya admin tulis; batas 2 MB dan JPG/PNG/WebP dijaga bucket.

### Kunci rahasia
- [x] Tidak ada kunci di kode maupun riwayat git (dicek di semua commit). `.env*` selain `.env.example` tidak pernah di-commit.
- [x] Kunci server (`SUPABASE_SECRET_KEY`, `KOMERCE_*`, `RAJAONGKIR_*`) hanya dibaca di modul ber-`import "server-only"`, jadi build gagal kalau modul itu terbawa ke browser.
- [x] `NEXT_PUBLIC_*` hanya berisi URL situs, URL Supabase, dan publishable key (memang publik).

### Endpoint & server action
| Endpoint | Login/hak akses | Zod | Rate limit |
|---|---|---|---|
| `login`, `register`, `forgotPassword`, `resetPassword` | – / sesi reset | ✓ | ✓ (IP+email, IP) |
| `changePassword`, profil, alamat, wishlist | `getUser()` + RLS | ✓ | ganti password ✓ |
| Keranjang (`setCartQuantity`, `mergeGuestCart`, `addToCart`, `loadCart`) | `getUser()` + RLS | ✓ | – |
| `quoteShipping`, `placeOrder` | `getUser()` | ✓ | ✓ |
| `choosePayment`, `checkPayment` | `getUser()` + cek pemilik | ✓ | ✓ |
| Aksi admin (produk, kategori, banner, pesanan) | `getAdmin()` + `is_admin()` di DB | ✓ | – (admin) |
| `GET /admin/pesanan/csv` | `getAdmin()` | ✓ | – |
| `POST /api/pembayaran/notifikasi` | HMAC-SHA256 + status ditanya ulang ke Komerce | – (body diverifikasi) | – |
| `GET /api/wilayah/[kode]` | publik (data statis) | ✓ | – |
| `GET /auth/callback`, `POST /auth/keluar` | token Supabase / POST saja | `next` aman | – |

### Aturan keamanan CLAUDE.md
- [x] Harga, total, dan ongkir dihitung ulang di server (`create_order`, `getRates`).
- [x] Callback pembayaran diverifikasi signature sebelum mengubah status, dan idempoten.
- [x] Stok dikurangi atomik saat pesanan dibuat, dikembalikan saat kedaluwarsa/dibatalkan (pg_cron + RPC).
- [x] Rate limit login dan checkout (tabel Postgres, berlaku lintas server Vercel).
- [x] Semua input divalidasi Zod.

### Lain-lain
- [x] `npm audit --omit=dev`: 0 kerentanan.
- [x] Logout hanya POST (tidak bisa dipicu `<img>` dari situs lain). Cookie sesi `SameSite=Lax`.
- [x] Tidak ada `eval`, `new Function`, atau `dangerouslySetInnerHTML` berisi input pengguna.

---

## 4. Sebelum toko jualan sungguhan
1. Pindahkan `npm run test:db` ke project Supabase khusus tes (`TEST_SUPABASE_*`).
2. Paket Supabase Pro → nyalakan *Leaked password protection*.
3. Ganti kunci Komerce sandbox → production, buat ulang `KOMERCE_CALLBACK_KEY`.
4. Jalankan ulang Security Advisor & Performance Advisor setelah setiap migration.
