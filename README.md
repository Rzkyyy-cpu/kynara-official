# kynara — Online Store for Hijab & Muslim Fashion

**English** · [Bahasa Indonesia](#bahasa-indonesia)

**kynara** is a full-stack e-commerce site for a hijab and muslimah fashion brand, built mobile-first for shoppers in Indonesia.
It is a portfolio project that is also being built to become a real, working store.

> 🚧 **Work in progress.** The catalog is live on a real database. Accounts, checkout, and payments are being built phase by phase (see [Roadmap](#roadmap)).
> The user interface is in Indonesian.

---

## What it does

**Available now**
- **Catalog backed by a real database:** 7 categories, products with color × size variants, and stock and price per variant.
- **Collection page:** filter by category, material, price range, and color, with sorting, search, and pagination. Filters live in the URL, so any result can be bookmarked or shared.
- **Product page:** gallery, color and size picker with live stock ("Only 3 left", "Sold out for this variant"), and related products.
- **Responsive layout:** sticky navbar with a category mega-menu, mobile drawer, bottom navigation, and footer.

**Coming next:** sign-up/login (email + Google), address book, wishlist, guest + logged-in cart, 3-step checkout, Midtrans payments, real shipping rates, and an admin dashboard.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | [Next.js 16](https://nextjs.org) (App Router, Server Components), TypeScript, [Tailwind CSS v4](https://tailwindcss.com) |
| Backend & data | [Supabase](https://supabase.com): PostgreSQL, Auth, Storage, Row Level Security |
| Validation | [Zod](https://zod.dev) |
| Payments | [Midtrans Snap](https://midtrans.com) (sandbox) |
| Hosting | Vercel + Supabase (free tiers) |

No paid libraries. UI icons are inline SVGs taken from the design files.

## Security by design

These rules are part of the project from day one, not added at the end:

- **Row Level Security on every table.** Visitors can only read the public catalog. Users can only see their own addresses, carts, and orders. Only admins can change products. Access is granted table by table (new tables are not exposed by default).
- **Users cannot promote themselves.** The `role` column is not writable from the browser (column-level privileges).
- **Prices are never trusted from the browser.** Order totals are recalculated on the server from the database *(checkout: in progress)*.
- **Atomic stock updates.** Stock is reduced inside one database transaction when an order is created, and returned when a payment expires *(in progress)*.
- **Verified payment webhooks.** Midtrans notifications are accepted only with a valid signature *(planned)*.
- **All input validated with Zod**, including URL query parameters, and rate limits on login and checkout *(planned)*.
- **Integrity rules in the database:** stock can't go negative, totals must equal subtotal + shipping, and an order can't be marked "shipped" without a tracking number.

## Project structure

```
src/
  app/                 Routes: / (home), /koleksi (collection), /produk/[slug] (product)
  components/
    layout/            Navbar, mobile drawer, bottom nav, footer
    catalog/           Filters, sorting, pagination
    product/           Product gallery & variant picker
    ui/                Reusable pieces: Button, ProductCard, Chip, EmptyState, ...
  lib/                 Data access (catalog queries), URL filter parsing, helpers
  types/database.ts    Types generated from the Supabase schema
supabase/
  migrations/          Database schema + RLS policies (SQL)
  seed.sql             Sample categories & products
design-handoff/        Visual reference from the design phase (screens + extracted source)
docs/rencana-fase.md   Phase-by-phase build plan (Indonesian)
```

## Running it locally

**Requirements:** Node.js 20.9+ and a free [Supabase](https://supabase.com) project.

```bash
git clone https://github.com/Rzkyyy-cpu/kynara-official.git
cd kynara-official
npm install

# 1. Environment variables
cp .env.example .env.local        # then fill in your Supabase URL and keys

# 2. Database: link your project, then create the tables, policies, and sample data
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push --include-seed

# 3. Start the dev server
npm run dev                       # http://localhost:3000
```

### Environment variables

| Variable | Where it's used | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Base URL of the site | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | No |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (browser-safe, protected by RLS) | No |
| `SUPABASE_SECRET_KEY` | Server-only Supabase key (bypasses RLS) | **Yes** |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Midtrans Snap client key | No |
| `MIDTRANS_SERVER_KEY` | Midtrans server key | **Yes** |
| `MIDTRANS_IS_PRODUCTION` | `false` for sandbox | No |

Secrets live only in `.env.local` (git-ignored) and in the hosting provider's settings. They are never committed.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | Lint with ESLint |
| `npm run db:types` | Regenerate TypeScript types from the linked Supabase schema |

## Roadmap

- [x] **Phase 1:** Project setup, design tokens, layout
- [x] **Phase 2:** Database schema + RLS, seed data, collection & product pages
- [ ] **Phase 3:** Auth (email, Google, password reset), account pages, address book, wishlist
- [ ] **Phase 4:** Cart (guest + logged in), 3-step checkout, server-side order creation with atomic stock
- [ ] **Phase 4B:** Static content pages, first deployment
- [ ] **Phase 5:** Midtrans payments, verified webhooks, order status timeline
- [ ] **Phase 6:** Real shipping-rate provider with fallback
- [ ] **Phase 7:** Admin dashboard (products, orders, categories, banners)
- [ ] **Phase 8:** Security audit, SEO, performance (Lighthouse mobile > 85), accessibility

The detailed plan (in Indonesian) is in [docs/rencana-fase.md](docs/rencana-fase.md).

## Design

The visual design (48 screens for mobile and desktop, plus a component and state sheet) was made before development and lives in [`design-handoff/`](design-handoff/).
The colors and type scale are defined as Tailwind theme tokens in [`src/app/globals.css`](src/app/globals.css).

## License

**All rights reserved.** The source is public so it can be read as a portfolio piece. The *kynara* name, brand, and design are not licensed for reuse.

## Author

**Muhamad Rizky Pratama**, informatics student learning full-stack development · GitHub [@Rzkyyy-cpu](https://github.com/Rzkyyy-cpu)

---

## Bahasa Indonesia

**kynara** adalah toko online full-stack untuk brand kerudung dan fashion muslimah. Dirancang mobile-first untuk pembeli di Indonesia.
Proyek ini adalah portofolio yang sekaligus disiapkan untuk menjadi toko sungguhan.

> 🚧 **Masih dalam pengerjaan.** Katalog sudah terhubung ke database sungguhan. Akun, checkout, dan pembayaran dibangun bertahap (lihat [Roadmap](#roadmap-1)).

### Fitur

**Sudah tersedia**
- **Katalog dari database:** 7 kategori, produk dengan varian warna × ukuran, serta stok dan harga per varian.
- **Halaman Koleksi:** filter kategori, bahan, rentang harga, dan warna, ditambah urutan, pencarian, dan pagination. Filter tersimpan di URL, jadi hasilnya bisa di-bookmark atau dibagikan.
- **Halaman Produk:** galeri, pilihan warna dan ukuran dengan stok langsung ("Sisa 3 pcs", "Habis untuk varian ini"), dan produk terkait.
- **Layout responsif:** navbar sticky dengan menu kategori, drawer di HP, bottom navigation, dan footer.

**Berikutnya:** daftar/masuk (email + Google), buku alamat, wishlist, keranjang tamu dan user login, checkout 3 langkah, pembayaran Midtrans, ongkir sungguhan, dan dashboard admin.

### Teknologi

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Supabase (PostgreSQL, Auth, Storage, Row Level Security), Zod, Midtrans Snap (sandbox). Hosting di Vercel + Supabase (paket gratis). Tanpa library berbayar.

### Keamanan sejak awal

- **Row Level Security di semua tabel.** Pengunjung hanya bisa membaca katalog publik. User hanya melihat alamat, keranjang, dan pesanannya sendiri. Hanya admin yang bisa mengubah produk. Akses tabel diberikan satu per satu (tabel baru tidak otomatis terbuka).
- **User tidak bisa menjadikan dirinya admin.** Kolom `role` tidak bisa diubah dari browser.
- **Harga tidak pernah dipercaya dari browser.** Total pesanan dihitung ulang di server dari database *(checkout: sedang dikerjakan)*.
- **Pengurangan stok atomik** dalam satu transaksi database, dan stok dikembalikan kalau pembayaran kedaluwarsa *(sedang dikerjakan)*.
- **Webhook pembayaran terverifikasi.** Notifikasi Midtrans hanya diterima dengan signature yang valid *(direncanakan)*.
- **Semua input divalidasi Zod**, termasuk parameter URL, ditambah rate limit di login dan checkout *(direncanakan)*.
- **Aturan integritas di database:** stok tidak bisa minus, total harus sama dengan subtotal + ongkir, dan pesanan tidak bisa berstatus "dikirim" tanpa nomor resi.

### Menjalankan di komputer sendiri

**Kebutuhan:** Node.js 20.9+ dan project [Supabase](https://supabase.com) gratis.

```bash
git clone https://github.com/Rzkyyy-cpu/kynara-official.git
cd kynara-official
npm install

# 1. Environment variable
cp .env.example .env.local        # lalu isi URL dan key Supabase

# 2. Database: hubungkan project, lalu buat tabel, policy, dan data contoh
npx supabase login
npx supabase link --project-ref <project-ref-kamu>
npx supabase db push --include-seed

# 3. Jalankan server development
npm run dev                       # http://localhost:3000
```

Daftar environment variable ada di tabel versi Inggris di atas. Kunci rahasia (`SUPABASE_SECRET_KEY`, `MIDTRANS_SERVER_KEY`) hanya disimpan di `.env.local` (diabaikan git) dan di pengaturan hosting. Kunci tersebut tidak pernah di-commit.

### Roadmap

- [x] **Fase 1:** Setup proyek, token desain, layout
- [x] **Fase 2:** Skema database + RLS, data contoh, halaman Koleksi & Produk
- [ ] **Fase 3:** Auth (email, Google, reset password), halaman akun, buku alamat, wishlist
- [ ] **Fase 4:** Keranjang (tamu + login), checkout 3 langkah, pembuatan pesanan di server dengan stok atomik
- [ ] **Fase 4B:** Halaman konten statis, deploy pertama
- [ ] **Fase 5:** Pembayaran Midtrans, webhook terverifikasi, timeline status pesanan
- [ ] **Fase 6:** Ongkir dari penyedia sungguhan + cadangan tarif flat
- [ ] **Fase 7:** Dashboard admin (produk, pesanan, kategori, banner)
- [ ] **Fase 8:** Audit keamanan, SEO, performa (Lighthouse mobile > 85), aksesibilitas

Rencana lengkapnya ada di [docs/rencana-fase.md](docs/rencana-fase.md).

### Lisensi

**Hak cipta dilindungi.** Kode dibuka untuk publik sebagai portofolio. Nama, brand, dan desain *kynara* tidak boleh dipakai ulang.
