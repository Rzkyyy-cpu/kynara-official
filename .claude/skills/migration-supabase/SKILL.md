---
name: migration-supabase
description: Checklist membuat dan menjalankan migration Supabase di proyek Kynara — tabel baru, RLS, GRANT, fungsi/RPC, view, storage policy, seed, lalu verifikasi akses setelah db push. Pakai setiap kali skema database berubah.
---

# Migration Supabase — Kynara

Kondisi proyek: **tanpa Docker** (tidak ada database lokal). Project remote `ncgkerntofdoukkfeflv` sudah di-link.
Setting project: *Automatically expose new tables* **MATI**, *automatic RLS* **NYALA**.

## 1. Menulis migration
- Buat file: `npx supabase migration new <nama_snake_case>`. Satu migration = satu tujuan.
- **Jangan pernah mengedit migration yang sudah di-push.** Perubahan selalu lewat migration baru.
- Checklist setiap tabel baru:
  - [ ] `alter table ... enable row level security;`
  - [ ] **GRANT eksplisit** per peran (`anon`, `authenticated`). Tanpa GRANT, tabel tidak bisa diakses sama sekali karena auto-expose mati. `service_role` sudah dapat lewat default privileges.
  - [ ] Policy per operasi dengan komentar SQL berbahasa Indonesia sederhana (siapa boleh apa, dan kenapa).
  - [ ] Pakai `(select auth.uid())`, bukan `auth.uid()` langsung (lebih cepat).
  - [ ] Cek admin lewat `(select public.is_admin())`.
  - [ ] Kolom sensitif (mis. `role`, harga di pesanan) dikunci dengan **GRANT per kolom**, bukan hanya di tampilan.
  - [ ] Constraint `check` untuk aturan bisnis (stok ≥ 0, total = subtotal + ongkir, dsb.).
  - [ ] Index untuk foreign key dan kolom yang sering difilter.
  - [ ] Trigger `set_updated_at` kalau tabel punya `updated_at`.
- **View:** selalu `with (security_invoker = true)`, supaya view tunduk pada RLS tabel asalnya. GRANT select view-nya juga.
- **Fungsi `security definer`:** wajib `set search_path = ''`, nama tabel ditulis lengkap (`public.x`), `revoke execute ... from public`, lalu grant ke peran yang perlu saja.
- **Operasi atomik** (pesanan, stok): satu fungsi database (RPC) dalam satu transaksi. Pengurangan stok memakai `update ... set stock = stock - q where id = ... and stock >= q`, lalu cek jumlah baris yang ter-update.
- Harga dan uang selalu `int` rupiah, bukan float.

## 2. Sebelum push
1. `npx supabase db push --dry-run` untuk melihat migration yang akan jalan.
2. **Tunjukkan ringkasan isi migration ke pengguna dan tunggu persetujuan.** Push mengubah database production.
3. Setelah ada data asli, uji migration dulu di **project Supabase staging**, baru ke production.

## 3. Push
```
npx supabase db push --yes                  # migration saja
npx supabase db push --include-seed --yes   # + seed.sql (seed harus aman diulang: on conflict do nothing)
```
Kalau gagal: migration yang gagal dibatalkan seluruhnya. Perbaiki file-nya (masih boleh karena belum tercatat), lalu push ulang.

## 4. Verifikasi setelah push (wajib)
Uji lewat REST API dengan publishable key sebagai **pengunjung (anon)**:
- Baca `.env.local` di PowerShell tanpa menampilkan nilai kunci. **Jangan pernah mencetak kunci, sebagian pun.**
- Pakai `curl.exe -A "kynara-check"`. User-Agent default PowerShell mirip browser, dan Supabase menolak secret key dari "browser".
- Kirim body JSON lewat file (`--data-binary @file`), karena tanda kutip PowerShell merusak JSON.
- Yang dicek: yang boleh dibaca → HTTP 200 dan jumlah baris benar. Yang harus ditolak (tabel pribadi, insert/update/delete oleh anon) → 401/42501 atau 0 baris. Data tidak berubah setelah percobaan tulis.
- Untuk policy user login, uji dengan akun tes (Fase 3 ke atas).

## 5. Setelah skema berubah
```
npm run db:types     # perbarui src/types/database.ts
npx tsc --noEmit
```
Catatan: kolom view di tipe hasil generate selalu nullable, jadi tangani `null` saat memetakan data.
