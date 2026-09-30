-- =====================================================================
-- Fase 2 — Hak akses (GRANT) & Row Level Security (RLS)
--
-- Analogi gedung dengan dua lapis pengamanan:
--   GRANT = kartu akses untuk masuk ke sebuah RUANGAN (tabel) dan boleh melakukan apa.
--   RLS   = SATPAM di dalam ruangan yang mengecek BARIS mana yang boleh dilihat/diubah.
-- Keduanya harus lolos. Project ini dibuat dengan "Automatically expose new tables" MATI,
-- jadi kartu akses kita tulis sendiri di sini.
--
-- Peran (role) di Supabase:
--   anon          = pengunjung yang belum login
--   authenticated = pengguna yang sudah login
--   service_role  = server kita sendiri (kunci rahasia). Melewati RLS, jangan pernah dipakai di browser.
--
-- (select auth.uid()) = id user yang sedang login. Ditulis dengan "select" supaya Postgres
-- menghitungnya sekali per query, bukan sekali per baris (lebih cepat).
-- =====================================================================

-- ---------- Fungsi bantu: apakah user yang login adalah admin? ----------
-- SECURITY DEFINER: fungsi ini membaca tabel profiles dengan hak pemilik fungsi,
-- sehingga tidak terjebak RLS profiles (menghindari pengecekan yang berputar-putar).
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- =====================================================================
-- GRANT (kartu akses)
-- =====================================================================

grant usage on schema public to anon, authenticated, service_role;

-- Server (service_role) boleh semua. RLS tidak berlaku untuknya, jadi kunci ini hanya di server.
grant all on all tables in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;

-- Katalog & ulasan: siapa pun boleh MEMBACA
grant select on
  public.categories, public.products, public.product_variants,
  public.product_images, public.product_cards, public.reviews
to anon, authenticated;

-- Katalog: yang login boleh MENGUBAH (tapi RLS di bawah hanya meloloskan admin)
grant insert, update, delete on
  public.categories, public.products, public.product_variants, public.product_images
to authenticated;

-- Profil: boleh membaca, dan mengubah HANYA kolom ini.
-- Kolom "role" sengaja tidak diberikan, jadi tidak ada user yang bisa menjadikan dirinya admin.
grant select on public.profiles to authenticated;
grant update (full_name, phone, birth_date, avatar_url) on public.profiles to authenticated;

-- Data pribadi milik user
grant select, insert, update, delete on
  public.addresses, public.carts, public.cart_items, public.wishlists
to authenticated;

-- Pesanan: user hanya membaca. Pembuatan pesanan dilakukan server (Fase 4).
-- Admin hanya boleh mengubah status & nomor resi (kolom lain dikunci).
grant select on public.orders, public.order_items to authenticated;
grant update (status, tracking_number) on public.orders to authenticated;

-- Ulasan: user yang login boleh menulis/mengubah/menghapus (RLS: hanya miliknya)
grant insert, update, delete on public.reviews to authenticated;

-- =====================================================================
-- RLS (satpam per baris)
-- Semua tabel dikunci dulu. Tabel yang RLS-nya aktif tapi tanpa policy = tidak ada yang boleh apa-apa.
-- =====================================================================

alter table public.profiles         enable row level security;
alter table public.addresses        enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images   enable row level security;
alter table public.carts            enable row level security;
alter table public.cart_items       enable row level security;
alter table public.wishlists        enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.reviews          enable row level security;

-- ---------- categories ----------
-- Semua orang boleh melihat daftar kategori (dipakai navbar & beranda).
create policy "Kategori bisa dilihat semua orang"
  on public.categories for select
  to anon, authenticated
  using (true);

-- Hanya admin yang boleh menambah, mengubah, atau menghapus kategori.
create policy "Admin mengelola kategori"
  on public.categories for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------- products ----------
-- Pengunjung hanya melihat produk yang aktif. Admin melihat semuanya (termasuk yang disembunyikan).
create policy "Produk aktif bisa dilihat semua orang"
  on public.products for select
  to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy "Admin mengelola produk"
  on public.products for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------- product_variants ----------
-- Varian terlihat kalau varian itu aktif DAN produknya aktif. Admin melihat semuanya.
create policy "Varian aktif bisa dilihat semua orang"
  on public.product_variants for select
  to anon, authenticated
  using (
    (is_active and exists (
      select 1 from public.products p where p.id = product_id and p.is_active
    ))
    or (select public.is_admin())
  );

create policy "Admin mengelola varian"
  on public.product_variants for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------- product_images ----------
-- Foto terlihat kalau produknya aktif.
create policy "Foto produk aktif bisa dilihat semua orang"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and p.is_active)
    or (select public.is_admin())
  );

create policy "Admin mengelola foto produk"
  on public.product_images for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------- profiles ----------
-- User hanya bisa melihat profilnya sendiri. Admin bisa melihat semua profil (untuk data pesanan).
create policy "Lihat profil sendiri, admin lihat semua"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

-- User hanya bisa mengubah profilnya sendiri (kolom role tetap terkunci lewat GRANT di atas).
create policy "Ubah profil sendiri"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- Tidak ada policy INSERT/DELETE: profil dibuat oleh trigger (Fase 3) & ikut terhapus bersama akun.

-- ---------- addresses ----------
-- Alamat hanya bisa dilihat & dikelola pemiliknya.
-- "using" = baris mana yang boleh disentuh; "with check" = data baru harus tetap milik dia
-- (mencegah user menyimpan alamat atas nama user lain).
create policy "Kelola alamat sendiri"
  on public.addresses for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------- carts & cart_items ----------
create policy "Kelola keranjang sendiri"
  on public.carts for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Item keranjang boleh disentuh kalau keranjangnya milik user yang login.
create policy "Kelola isi keranjang sendiri"
  on public.cart_items for all
  to authenticated
  using (exists (
    select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())
  ));

-- ---------- wishlists ----------
create policy "Kelola wishlist sendiri"
  on public.wishlists for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------- orders ----------
-- User melihat pesanannya sendiri; admin melihat semua pesanan.
create policy "Lihat pesanan sendiri, admin lihat semua"
  on public.orders for select
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Hanya admin yang boleh mengubah (status & resi). User tidak bisa mengubah pesanan dari browser.
create policy "Admin mengubah status pesanan"
  on public.orders for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
-- Tidak ada policy INSERT/DELETE: pesanan dibuat server yang menghitung ulang harga (Fase 4).

-- ---------- order_items ----------
create policy "Lihat item pesanan sendiri, admin lihat semua"
  on public.order_items for select
  to authenticated
  using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
    or (select public.is_admin())
  );

-- ---------- reviews ----------
create policy "Ulasan bisa dibaca semua orang"
  on public.reviews for select
  to anon, authenticated
  using (true);

create policy "Tulis ulasan atas nama sendiri"
  on public.reviews for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Ubah ulasan sendiri"
  on public.reviews for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Pemilik boleh menghapus ulasannya; admin boleh menghapus ulasan yang melanggar.
create policy "Hapus ulasan sendiri atau oleh admin"
  on public.reviews for delete
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
