---
name: alur-fase
description: Alur kerja satu fase proyek Kynara — dari membaca rencana, menyusun rencana file, verifikasi (lint, typecheck, build, screenshot HP & desktop), sampai draf commit. Pakai saat memulai, memverifikasi, atau menutup sebuah fase ("mulai Fase N", "lanjut fase", "commit fase").
---

# Alur kerja per fase — Kynara

## 1. Mulai fase
1. Baca bagian fase itu di `docs/rencana-fase.md`, **termasuk "Penyesuaian"**. Itu ketentuan yang harus dipenuhi.
2. Baca hanya file yang relevan. Acuan desain: `design-handoff/source/<folder>/NN-*.html` (nilai persis) dan `design-handoff/screen/<folder>/NN-*.png` (tampilan). Folder `design-handoff/` hanya dibaca, jangan diedit.
3. Next.js 16 berbeda dari versi lama. Cek `node_modules/next/dist/docs/` sebelum memakai API yang belum pernah dipakai di proyek ini (contoh: `proxy.ts` pengganti middleware).
4. Tampilkan **rencana singkat**: tabel file yang dibuat/diubah, library baru beserta alasannya, dan keputusan yang perlu dijawab pengguna. **Tunggu persetujuan** sebelum menulis kode.
5. Jelaskan konsep baru dengan bahasa sederhana dan analogi (pengguna sedang belajar full stack).

## 2. Saat mengerjakan
- Token warna/font ada di `@theme` pada `src/app/globals.css`. Jangan menebak nilai. Kalau desain memakai warna yang belum ada, tambahkan token.
- Query database dikumpulkan di `src/lib/` (contoh `catalog.ts`), bukan ditulis langsung di halaman.
- Semua input (form, URL, body request) divalidasi Zod. Harga, total, dan ongkir dihitung ulang di server.
- Perubahan database mengikuti skill `migration-supabase`.
- Hook proyek otomatis menjalankan ESLint setiap file diubah. Kalau hook melapor masalah, perbaiki saat itu juga.

## 3. Verifikasi sebelum lapor selesai
Jalankan dari root proyek:
```
npx tsc --noEmit
npm run lint
npm run build
```
Lalu cek halaman yang berubah di server produksi lokal (`npx next start -p 3123`, jalankan di background):
- **Uji fungsi** dengan `curl.exe` (status HTTP, isi penting di HTML).
- **Screenshot desktop:** Chrome headless `--window-size=1440,<tinggi>`.
- **Screenshot HP 390px:** Chrome headless di Windows punya lebar jendela minimum ±500px, jadi **bungkus halaman dalam `<iframe style="width:390px">`** di file HTML scratchpad, lalu screenshot file itu. Pakai `--virtual-time-budget=20000`. Kalau yang tertangkap masih skeleton loading, ulangi.
- Periksa konten yang melebar (overflow horizontal) di 390px. Grid satu kolom di HP pakai `grid-cols-1`.
- Matikan server setelah selesai.

Laporkan hasil apa adanya: yang lolos, yang gagal, dan yang tidak bisa diuji.

## 4. Tutup fase
1. Ringkas hasil, konsep baru, hal yang perlu dicek pengguna di browser, dan catatan untuk fase berikutnya.
2. Tawarkan menjalankan agent `qa-reviewer` untuk review akhir fase.
3. Tampilkan **draf pesan commit** dan tunggu persetujuan:
   - Format Conventional Commits berbahasa Indonesia: `feat: ... (Fase N)`, `fix:`, `docs:`, `chore:`.
   - Isi berupa daftar poin perubahan, diakhiri baris `Co-Authored-By` sesuai instruksi sistem.
   - Di PowerShell, tulis pesan ke file scratchpad lalu `git commit -F <file>`. Jangan here-string.
   - Sebelum commit, pastikan `.env*` (kecuali `.env.example`) dan `supabase/.temp` tidak ikut.
4. **Jangan pernah push dan jangan mengingatkan soal push.** Push sepenuhnya kendali pengguna.
5. Tandai fase selesai (✅) di `docs/rencana-fase.md`.
