-- =====================================================================
-- Fase 2 — Skema awal database Kynara
-- Semua harga & ongkir disimpan sebagai INTEGER rupiah (tanpa desimal),
-- supaya tidak ada error pembulatan seperti 0.1 + 0.2 = 0.30000000000000004.
-- =====================================================================

-- ---------- Tipe pilihan tetap (enum) ----------
create type public.user_role as enum ('user', 'admin');

create type public.order_status as enum (
  'menunggu_pembayaran',
  'diproses',
  'dikirim',
  'selesai',
  'dibatalkan',
  'kedaluwarsa'
);

-- ---------- Trigger: isi kolom updated_at otomatis setiap baris diubah ----------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- PENGGUNA
-- =====================================================================

-- Satu baris per akun di auth.users (dibuat otomatis oleh trigger di Fase 3).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 100),
  phone text check (char_length(phone) <= 20),
  birth_date date,
  avatar_url text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null default 'Rumah' check (label in ('Rumah', 'Kantor', 'Kos', 'Lainnya')),
  recipient_name text not null check (char_length(recipient_name) between 1 and 100),
  phone text not null check (char_length(phone) between 8 and 20),
  province text not null,
  city text not null,
  district text not null,
  postal_code text not null check (postal_code ~ '^[0-9]{5}$'),
  street text not null check (char_length(street) between 5 and 300),
  landmark text check (char_length(landmark) <= 150), -- patokan untuk kurir
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses (user_id);
-- Setiap user hanya boleh punya SATU alamat utama
create unique index addresses_one_default_per_user on public.addresses (user_id) where is_default;

-- =====================================================================
-- KATALOG
-- =====================================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 50),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  image_url text,
  sort_order int not null default 0,
  show_on_home boolean not null default false, -- desain: maksimal 6 tampil di beranda (dijaga di admin, Fase 7)
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 40), -- desain admin: maks. 40 karakter
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  material text not null, -- badge bahan: Voal, Airflow, Satin, ...
  finishing text,
  care text, -- cara perawatan
  weight_gram int not null default 0 check (weight_gram >= 0), -- dipakai hitung ongkir (Fase 6)
  sold_count int not null default 0 check (sold_count >= 0), -- untuk urutan "Terlaris"
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index products_created_at_idx on public.products (created_at desc);

-- Satu produk punya banyak varian (warna × ukuran). Harga & stok ada di sini.
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color_name text not null,
  color_hex text not null check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  size_name text not null default 'All size',
  size_detail text, -- contoh "175 × 75 cm"
  sku text not null unique,
  price int not null check (price > 0),
  stock int not null default 0 check (stock >= 0), -- database menolak stok minus
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, color_name, size_name)
);

create index product_variants_product_id_idx on public.product_variants (product_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt text not null default '',
  color_name text, -- opsional: foto khusus warna tertentu
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on public.product_images (product_id);

-- =====================================================================
-- KERANJANG & WISHLIST
-- =====================================================================

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade, -- satu keranjang per user
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  quantity int not null check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create index cart_items_variant_id_idx on public.cart_items (variant_id);

create table public.wishlists (
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index wishlists_product_id_idx on public.wishlists (product_id);

-- =====================================================================
-- PESANAN
-- =====================================================================

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique, -- contoh KYN-260928-0142
  user_id uuid not null references public.profiles (id) on delete restrict,
  status public.order_status not null default 'menunggu_pembayaran',
  shipping_address jsonb not null, -- SALINAN alamat saat checkout (alamat asli bisa diubah/dihapus)
  courier text,
  courier_service text,
  shipping_cost int not null default 0 check (shipping_cost >= 0),
  subtotal int not null check (subtotal >= 0),
  total int not null check (total >= 0),
  total_weight_gram int not null default 0 check (total_weight_gram >= 0),
  tracking_number text, -- nomor resi
  payment_method text,
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_total_matches check (total = subtotal + shipping_cost),
  -- Desain: status "Dikirim" wajib diisi nomor resi
  constraint orders_shipped_needs_tracking check (
    status not in ('dikirim', 'selesai') or tracking_number is not null
  )
);

create index orders_user_id_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status);

-- Nama, varian, dan harga DISALIN saat membeli, seperti struk belanja:
-- kalau besok harga naik atau produk dihapus, riwayat pesanan tetap benar.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  variant_label text not null, -- contoh "Sage · Standar"
  price int not null check (price > 0),
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_variant_id_idx on public.order_items (variant_id);
create index order_items_product_id_idx on public.order_items (product_id);

-- =====================================================================
-- ULASAN
-- =====================================================================

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null default '' check (char_length(body) <= 1000),
  variant_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id) -- satu ulasan per user per produk
);

create index reviews_product_id_idx on public.reviews (product_id, created_at desc);

-- ---------- Pasang trigger updated_at ----------
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.carts
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

-- =====================================================================
-- VIEW: product_cards — data siap pakai untuk kartu produk & halaman Koleksi
-- security_invoker = true: view ini tunduk pada RLS tabel aslinya
-- (tanpa ini, view di Postgres membaca data dengan hak pemiliknya dan bisa melewati RLS).
-- =====================================================================
create view public.product_cards
with (security_invoker = true)
as
select
  p.id,
  p.slug,
  p.name,
  p.material,
  p.category_id,
  c.slug as category_slug,
  c.name as category_name,
  p.sold_count,
  p.created_at,
  agg.min_price,
  agg.total_stock,
  col.colors,       -- [{"name":"Sage","hex":"#9DAE9B"}, ...] urut sesuai sort_order
  col.color_names,  -- ['Sage', ...] untuk filter warna
  img.url as image_url,
  (p.created_at > now() - interval '30 days') as is_new,          -- label "Baru"
  (agg.total_stock between 1 and 10) as is_low_stock              -- label "Stok terbatas"
from public.products p
join public.categories c on c.id = p.category_id
join lateral (
  select min(v.price) as min_price, sum(v.stock)::int as total_stock
  from public.product_variants v
  where v.product_id = p.id and v.is_active
) agg on agg.min_price is not null -- produk tanpa varian aktif tidak ditampilkan
left join lateral (
  select
    jsonb_agg(jsonb_build_object('name', s.color_name, 'hex', s.color_hex) order by s.first_sort) as colors,
    array_agg(s.color_name order by s.first_sort) as color_names
  from (
    select v.color_name, min(v.color_hex) as color_hex, min(v.sort_order) as first_sort
    from public.product_variants v
    where v.product_id = p.id and v.is_active
    group by v.color_name
  ) s
) col on true
left join lateral (
  select i.url
  from public.product_images i
  where i.product_id = p.id
  order by i.sort_order
  limit 1
) img on true
where p.is_active;
