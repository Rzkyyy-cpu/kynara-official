# Source desain (hasil ekstrak)

Isi folder ini diekstrak dari file HTML bundel di `design-handoff/` (base64 + gzip berlapis).
Tujuannya supaya kode desain bisa dibaca langsung sebagai teks.

- Satu file per layar, dengan nama `NN-nama-layar.html`. Urutannya sama dengan PNG di `screen/`.
- `_komponen/` berisi komponen bersama yang dipanggil lewat `<dc-import name="...">`: navbar, footer, kartu produk, sidebar admin, dan bottom nav.
- Deklarasi `@font-face` dan script runtime prototipe sudah dibuang. Font yang dipakai: Playfair Display dan Plus Jakarta Sans (Google Fonts).

**Catatan:** file di sini tidak akan tampil benar kalau dibuka di browser, karena masih memakai tag khusus prototipe (`<sc-for>`, `<dc-import>`, `{{...}}`).
Pakai file ini untuk mengambil nilai persis (warna, ukuran, spacing, struktur).
Untuk melihat tampilannya, pakai PNG di `screen/`. Untuk mencoba interaksinya, buka HTML asli di browser.
