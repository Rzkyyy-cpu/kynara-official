-- =============================================================================
-- Fase 8A — Perbaikan dari Supabase Security Advisor & Performance Advisor
-- Laporan lengkapnya: docs/audit-keamanan.md
-- =============================================================================

-- ---------- 1) Multiple Permissive Policies (Performance Advisor) ----------
-- Policy "Admin mengelola ..." dibuat "for all", jadi untuk SELECT ada DUA policy yang dicek
-- di setiap baris (policy baca publik + policy admin). Hasilnya sama, tapi Postgres bekerja dua kali.
-- Policy baca publik di kelima tabel ini sudah mencakup admin (... or is_admin()),
-- jadi policy admin cukup untuk menambah, mengubah, dan menghapus. Hak aksesnya tidak berubah.

-- categories
drop policy "Admin mengelola kategori" on public.categories;
create policy "Admin menambah kategori" on public.categories
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admin mengubah kategori" on public.categories
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin menghapus kategori" on public.categories
  for delete to authenticated using ((select public.is_admin()));

-- products
drop policy "Admin mengelola produk" on public.products;
create policy "Admin menambah produk" on public.products
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admin mengubah produk" on public.products
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin menghapus produk" on public.products
  for delete to authenticated using ((select public.is_admin()));

-- product_variants
drop policy "Admin mengelola varian" on public.product_variants;
create policy "Admin menambah varian" on public.product_variants
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admin mengubah varian" on public.product_variants
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin menghapus varian" on public.product_variants
  for delete to authenticated using ((select public.is_admin()));

-- product_images
drop policy "Admin mengelola foto produk" on public.product_images;
create policy "Admin menambah foto produk" on public.product_images
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admin mengubah foto produk" on public.product_images
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin menghapus foto produk" on public.product_images
  for delete to authenticated using ((select public.is_admin()));

-- banners
drop policy "Admin mengelola banner" on public.banners;
create policy "Admin menambah banner" on public.banners
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admin mengubah banner" on public.banners
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin menghapus banner" on public.banners
  for delete to authenticated using ((select public.is_admin()));

-- ---------- 2) rls_auto_enable() bisa dipanggil publik (Security Advisor) ----------
-- Fungsi ini dibuat Supabase saat setting "automatic RLS" dinyalakan (bukan dari migration kita):
-- event trigger yang menyalakan RLS di setiap tabel baru. Fungsi trigger dijalankan oleh database
-- sendiri, jadi pengunjung tidak perlu hak EXECUTE. Haknya dicabut supaya tidak muncul sebagai RPC.
-- Dibungkus pengecekan, supaya migration tetap jalan di project yang tidak punya fungsi ini.
do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end
$$;

-- Temuan Advisor lain yang SENGAJA dibiarkan (alasannya di docs/audit-keamanan.md):
--  - is_admin() bisa dipanggil anon/authenticated: dipakai di policy RLS (dievaluasi dengan peran
--    pemanggil) dan oleh proxy.ts. Isinya hanya "apakah SAYA admin", tidak membuka data orang lain.
--  - admin_update_order() & admin_resolve_payment_issue() bisa dipanggil user login: fungsi ini
--    mengecek is_admin() di dalamnya dan menolak selain admin (diuji di admin-orders.db.test.ts).
--  - Leaked password protection: hanya tersedia di paket Pro Supabase.
