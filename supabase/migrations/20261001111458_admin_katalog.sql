-- =====================================================================
-- Fase 7B — Admin: produk, kategori, banner beranda, dan foto (Storage)
--
-- 1) Bucket Storage "katalog": foto produk, kategori, dan banner.
-- 2) Tabel banners + RLS.
-- 3) Aturan desain dijaga database: maks. 6 kategori di beranda, maks. 3 banner tayang,
--    produk yang pernah dipesan tidak bisa dihapus (cukup disembunyikan).
-- 4) admin_save_product: produk + varian + foto disimpan dalam SATU transaksi.
-- 5) Urutan kategori & banner, dan view daftar produk untuk admin.
-- =====================================================================

-- ---------- 1) Storage ----------
-- Bucket publik: siapa pun bisa MELIHAT foto lewat URL publik (memang untuk ditampilkan di toko).
-- Batas ukuran & tipe file dijaga Storage sendiri, jadi tidak bisa dilewati walau orang memanggil API langsung.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('katalog', 'katalog', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Menulis (unggah, ganti, hapus) dan mendaftar isi bucket hanya untuk admin.
-- Melihat foto lewat URL publik tidak melewati policy ini, jadi pengunjung tetap bisa melihat foto.
create policy "Admin melihat daftar foto katalog"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'katalog' and (select public.is_admin()));

create policy "Admin mengunggah foto katalog"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'katalog' and (select public.is_admin()));

create policy "Admin mengganti foto katalog"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'katalog' and (select public.is_admin()))
  with check (bucket_id = 'katalog' and (select public.is_admin()));

create policy "Admin menghapus foto katalog"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'katalog' and (select public.is_admin()));

-- ---------- 2) Banner beranda ----------
create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 48), -- desain: maks. 48 karakter
  subtitle text check (char_length(subtitle) <= 120),
  cta_text text not null check (char_length(cta_text) between 1 and 24),
  -- Tautan tombol hanya ke halaman toko sendiri: semua koleksi, satu kategori, atau satu produk
  cta_href text not null check (
    cta_href ~ '^/koleksi(\?kategori=[a-z0-9]+(-[a-z0-9]+)*)?$'
    or cta_href ~ '^/produk/[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  image_desktop_url text,
  image_mobile_url text,
  starts_at date not null default ((now() at time zone 'Asia/Jakarta')::date),
  ends_at date,
  is_published boolean not null default false, -- false = draf
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint banners_dates check (ends_at is null or ends_at >= starts_at)
);

create index banners_published_idx on public.banners (sort_order) where is_published;

create trigger set_updated_at before update on public.banners
  for each row execute function public.set_updated_at();

alter table public.banners enable row level security;

-- Pengunjung boleh membaca banner yang sudah ditayangkan (filter tanggal dilakukan saat query).
grant select on public.banners to anon, authenticated;
-- Yang login boleh menulis, tapi policy di bawah hanya meloloskan admin.
grant insert, update, delete on public.banners to authenticated;

create policy "Banner tayang bisa dilihat semua orang, admin lihat semua"
  on public.banners for select
  to anon, authenticated
  using (is_published or (select public.is_admin()));

create policy "Admin mengelola banner"
  on public.banners for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------- 3) Aturan desain di database ----------

-- Maks. 6 kategori di beranda. Kunci "advisory" = antrean satu pintu: dua admin yang menyalakan
-- toggle bersamaan dihitung bergiliran, jadi tidak bisa sama-sama lolos menjadi 7.
create function public.check_home_categories()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.show_on_home and (tg_op = 'INSERT' or not old.show_on_home) then
    perform pg_advisory_xact_lock(hashtext('kynara:categories_home'));
    if (select count(*) from public.categories where show_on_home and id <> new.id) >= 6 then
      raise exception 'BERANDA_PENUH';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.check_home_categories() from public, anon, authenticated;

create trigger check_home_categories
  before insert or update of show_on_home on public.categories
  for each row execute function public.check_home_categories();

-- Maks. 3 banner tayang (yang belum berakhir), sesuai desain "maks. 3 banner bergantian"
create function public.check_published_banners()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_published and (new.ends_at is null or new.ends_at >= (now() at time zone 'Asia/Jakarta')::date) then
    perform pg_advisory_xact_lock(hashtext('kynara:banners_published'));
    if (
      select count(*) from public.banners
      where is_published and id <> new.id
        and (ends_at is null or ends_at >= (now() at time zone 'Asia/Jakarta')::date)
    ) >= 3 then
      raise exception 'BANNER_PENUH';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.check_published_banners() from public, anon, authenticated;

create trigger check_published_banners
  before insert or update of is_published, ends_at on public.banners
  for each row execute function public.check_published_banners();

-- Produk yang pernah dipesan tidak boleh dihapus: riwayat pesanan, stok pesanan yang menunggu,
-- dan hitungan terlaris tetap utuh. Cukup disembunyikan (is_active = false).
create function public.prevent_ordered_product_delete()
returns trigger
language plpgsql
security definer -- membaca order_items semua pembeli
set search_path = ''
as $$
begin
  if exists (select 1 from public.order_items where product_id = old.id) then
    raise exception 'PRODUK_PERNAH_DIPESAN';
  end if;
  return old;
end;
$$;

revoke execute on function public.prevent_ordered_product_delete() from public, anon, authenticated;

create trigger prevent_ordered_product_delete
  before delete on public.products
  for each row execute function public.prevent_ordered_product_delete();

-- ---------- 4) Simpan produk + varian + foto sekaligus ----------
-- p_product (jsonb):
--   { id?, category_id, name, slug, description, material, finishing, care, weight_gram, is_active,
--     variants: [{ id?, color_name, color_hex, size_name, size_detail, sku, price, stock, stock_before, is_active }],
--     images:   [{ url, alt }] }
--
-- STOK DISIMPAN SEBAGAI SELISIH, bukan angka mati. Contoh: form dibuka saat stok 10 (stock_before),
-- admin mengetik 15. Sementara itu ada pembeli checkout 1 (stok di database jadi 9).
-- Kalau ditimpa "15", pembelian tadi hilang dari hitungan (lost update). Dengan selisih: 9 + (15 - 10) = 14.
--
-- Varian yang dibuang dari form: dihapus, KECUALI pernah dipesan -> dinonaktifkan saja,
-- supaya stok pesanan yang masih menunggu tetap bisa dikembalikan kalau kedaluwarsa.
--
-- SECURITY INVOKER (bawaan): semua tulis tetap dijaga RLS "Admin mengelola ...".
create function public.admin_save_product(p_product jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid := nullif(p_product ->> 'id', '')::uuid;
  v_keep uuid[] := '{}';
  v jsonb;
  v_variant_id uuid;
  v_sort int := 0;
  v_rows int;
begin
  if not public.is_admin() then
    raise exception 'BUKAN_ADMIN';
  end if;
  if jsonb_array_length(coalesce(p_product -> 'variants', '[]')) = 0 then
    raise exception 'VARIAN_KOSONG';
  end if;

  if v_id is null then
    insert into public.products (category_id, name, slug, description, material, finishing, care, weight_gram, is_active)
    values (
      (p_product ->> 'category_id')::uuid, p_product ->> 'name', p_product ->> 'slug',
      coalesce(p_product ->> 'description', ''), p_product ->> 'material',
      nullif(p_product ->> 'finishing', ''), nullif(p_product ->> 'care', ''),
      (p_product ->> 'weight_gram')::int, coalesce((p_product ->> 'is_active')::boolean, true)
    )
    returning id into v_id;
  else
    update public.products set
      category_id = (p_product ->> 'category_id')::uuid,
      name = p_product ->> 'name',
      description = coalesce(p_product ->> 'description', ''),
      material = p_product ->> 'material',
      finishing = nullif(p_product ->> 'finishing', ''),
      care = nullif(p_product ->> 'care', ''),
      weight_gram = (p_product ->> 'weight_gram')::int,
      is_active = coalesce((p_product ->> 'is_active')::boolean, true)
      -- slug sengaja tidak diubah: link produk yang sudah dibagikan tetap jalan
    where id = v_id;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      raise exception 'PRODUK_TIDAK_ADA';
    end if;
  end if;

  -- Varian lama yang dipertahankan (urut id, sama dengan create_order, supaya tidak deadlock)
  for v in
    select value from jsonb_array_elements(p_product -> 'variants')
    where nullif(value ->> 'id', '') is not null
    order by (value ->> 'id')::uuid
  loop
    update public.product_variants set
      color_name = v ->> 'color_name',
      color_hex = v ->> 'color_hex',
      size_name = v ->> 'size_name',
      size_detail = nullif(v ->> 'size_detail', ''),
      sku = v ->> 'sku',
      price = (v ->> 'price')::int,
      stock = stock + ((v ->> 'stock')::int - (v ->> 'stock_before')::int),
      is_active = coalesce((v ->> 'is_active')::boolean, true)
    where id = (v ->> 'id')::uuid and product_id = v_id;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      raise exception 'VARIAN_TIDAK_VALID';
    end if;
    v_keep := v_keep || (v ->> 'id')::uuid;
  end loop;

  -- Varian yang dibuang dari form
  update public.product_variants set is_active = false
    where product_id = v_id and not (id = any (v_keep))
      and exists (select 1 from public.order_items oi where oi.variant_id = product_variants.id);
  delete from public.product_variants
    where product_id = v_id and not (id = any (v_keep))
      and not exists (select 1 from public.order_items oi where oi.variant_id = product_variants.id);

  -- Varian baru
  for v in
    select value from jsonb_array_elements(p_product -> 'variants') where nullif(value ->> 'id', '') is null
  loop
    insert into public.product_variants (product_id, color_name, color_hex, size_name, size_detail, sku, price, stock, is_active)
    values (
      v_id, v ->> 'color_name', v ->> 'color_hex', v ->> 'size_name', nullif(v ->> 'size_detail', ''),
      v ->> 'sku', (v ->> 'price')::int, (v ->> 'stock')::int, coalesce((v ->> 'is_active')::boolean, true)
    )
    returning id into v_variant_id;
  end loop;

  -- Urutan varian mengikuti urutan di form
  for v in select value from jsonb_array_elements(p_product -> 'variants')
  loop
    update public.product_variants set sort_order = v_sort
      where product_id = v_id and color_name = v ->> 'color_name' and size_name = v ->> 'size_name';
    v_sort := v_sort + 1;
  end loop;

  -- Foto: diganti seluruhnya sesuai urutan di form (foto pertama = sampul)
  delete from public.product_images where product_id = v_id;
  insert into public.product_images (product_id, url, alt, sort_order)
  select v_id, value ->> 'url', coalesce(value ->> 'alt', ''), (ordinality - 1)::int
  from jsonb_array_elements(coalesce(p_product -> 'images', '[]')) with ordinality;

  return v_id;
end;
$$;

revoke execute on function public.admin_save_product(jsonb) from public, anon;
grant execute on function public.admin_save_product(jsonb) to authenticated, service_role;

-- ---------- 5) Urutan kategori & banner ----------
-- p_ids = semua id dalam urutan baru; sort_order diisi 1, 2, 3, ...
create function public.admin_reorder_categories(p_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'BUKAN_ADMIN';
  end if;
  update public.categories c set sort_order = x.ord
  from unnest(p_ids) with ordinality as x(id, ord)
  where c.id = x.id;
end;
$$;

create function public.admin_reorder_banners(p_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'BUKAN_ADMIN';
  end if;
  update public.banners b set sort_order = x.ord
  from unnest(p_ids) with ordinality as x(id, ord)
  where b.id = x.id;
end;
$$;

revoke execute on function public.admin_reorder_categories(uuid[]) from public, anon;
revoke execute on function public.admin_reorder_banners(uuid[]) from public, anon;
grant execute on function public.admin_reorder_categories(uuid[]) to authenticated, service_role;
grant execute on function public.admin_reorder_banners(uuid[]) to authenticated, service_role;

-- ---------- Daftar produk untuk admin ----------
-- security_invoker: tunduk pada RLS tabel asal (admin melihat semua, termasuk yang disembunyikan).
create view public.admin_product_list
with (security_invoker = true)
as
select
  p.id,
  p.name,
  p.slug,
  p.material,
  p.is_active,
  p.category_id,
  c.name as category_name,
  p.created_at,
  p.updated_at,
  coalesce(v.total_stock, 0) as total_stock,
  v.min_price,
  coalesce(v.variant_count, 0) as variant_count,
  coalesce(v.color_count, 0) as color_count,
  coalesce(v.sizes, '{}') as sizes,
  coalesce(v.low_variant_count, 0) as low_variant_count, -- varian aktif dengan stok <= 5
  coalesce(v.skus, '') as skus, -- untuk pencarian SKU
  img.url as cover_url
from public.products p
join public.categories c on c.id = p.category_id
left join lateral (
  select
    sum(stock) filter (where is_active)::int as total_stock,
    min(price) filter (where is_active) as min_price,
    count(*) filter (where is_active)::int as variant_count,
    count(distinct color_name) filter (where is_active)::int as color_count,
    array_agg(distinct size_name) filter (where is_active) as sizes,
    count(*) filter (where is_active and stock <= 5)::int as low_variant_count,
    string_agg(sku, ' ') as skus
  from public.product_variants
  where product_id = p.id
) v on true
left join lateral (
  select url from public.product_images where product_id = p.id order by sort_order limit 1
) img on true;

grant select on public.admin_product_list to authenticated;
