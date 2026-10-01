-- =====================================================================
-- Fase 5 — Ganti gateway: Midtrans Snap -> Komerce Payment API (VA + QRIS)
--
-- Bedanya dengan Midtrans: satu pesanan bisa punya BEBERAPA percobaan bayar.
-- Contoh: QRIS hanya berlaku 5 menit (buat QR baru), atau pembeli ganti bank VA.
-- Karena itu data pembayaran pindah ke tabel sendiri: payments (satu baris = satu VA / satu QR).
--
-- Yang tetap: riwayat status, release_order_stock, pg_cron kedaluwarsa pesanan (24 jam).
-- =====================================================================

-- Kolom khusus Midtrans tidak dipakai lagi (belum pernah berisi data)
alter table public.orders
  drop column snap_token,
  drop column payment_details;

-- ---------- Tabel percobaan bayar ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null default 'komerce',
  provider_payment_id text not null unique, -- contoh KOMPAY-1699012345-A1B2C3
  method text not null check (method in ('va', 'qris')),
  channel_code text, -- kode bank VA: BCA, BNI, ... (null untuk QRIS)
  va_number text,
  qr_string text, -- isi QR (diubah jadi gambar di server kita)
  payment_url text, -- halaman bayar Komerce (cara bayar / simulasi di sandbox)
  amount int not null check (amount > 0),
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'EXPIRED', 'CANCELED')),
  expires_at timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_va_needs_bank check (method <> 'va' or channel_code is not null)
);

create index payments_order_id_idx on public.payments (order_id, created_at desc);

create trigger set_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

-- Pembeli hanya MEMBACA pembayaran pesanannya sendiri (untuk menampilkan nomor VA / QR); admin membaca semua.
-- Tidak ada policy tulis: baris dibuat & diubah server (service_role) setelah bicara dengan Komerce.
grant select on public.payments to authenticated;

create policy "Lihat pembayaran pesanan sendiri, admin lihat semua"
  on public.payments for select
  to authenticated
  using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
    or (select public.is_admin())
  );

-- ---------- Satu pintu perubahan status karena pembayaran (versi Komerce) ----------
drop function public.apply_payment_status(text, text, int, text, jsonb, timestamptz);

-- p_status = status dari API Komerce: PENDING / PAID / EXPIRED / CANCELED.
--
-- IDEMPOTEN: notifikasi yang sama boleh datang berkali-kali. Status pembayaran hanya berpindah dari
-- PENDING (atau dari EXPIRED/CANCELED ke PAID, karena uang yang sudah masuk selalu dicatat).
-- Pesanan hanya berpindah dari 'menunggu_pembayaran' sekali.
--
-- VA/QR yang kedaluwarsa TIDAK membatalkan pesanan: pembeli masih bisa membuat QR baru atau
-- ganti bank selama pesanan belum lewat 24 jam. Pesanan dibatalkan oleh expire_overdue_orders.
--
-- Urutan kunci: pesanan dulu, baru pembayaran (sama dengan expire_overdue_orders) supaya tidak deadlock.
create function public.apply_payment_status(
  p_payment_id text,
  p_status text,
  p_amount int,
  p_paid_at timestamptz default null
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_item record;
begin
  if p_status not in ('PENDING', 'PAID', 'EXPIRED', 'CANCELED') then
    raise exception 'STATUS_TIDAK_VALID';
  end if;

  select order_id into v_order_id from public.payments where provider_payment_id = p_payment_id;
  if v_order_id is null then
    raise exception 'PEMBAYARAN_TIDAK_ADA';
  end if;

  select * into v_order from public.orders where id = v_order_id for update;
  select * into v_payment from public.payments where provider_payment_id = p_payment_id for update;

  -- Jumlah dari Komerce harus sama dengan tagihan & total pesanan di database
  if p_amount is distinct from v_payment.amount or v_payment.amount <> v_order.total then
    raise exception 'JUMLAH_TIDAK_COCOK';
  end if;

  if p_status = v_payment.status or v_payment.status = 'PAID' or p_status = 'PENDING' then
    return 'ignored';
  end if;
  if v_payment.status <> 'PENDING' and p_status <> 'PAID' then
    return 'ignored'; -- EXPIRED <-> CANCELED tidak ada artinya
  end if;

  update public.payments
    set status = p_status,
        paid_at = case when p_status = 'PAID' then coalesce(p_paid_at, now()) end
    where id = v_payment.id;

  if p_status <> 'PAID' then
    return 'closed'; -- VA/QR ini tidak bisa dipakai lagi, pesanan tetap menunggu
  end if;

  if v_order.status = 'menunggu_pembayaran' then
    update public.orders
      set status = 'diproses',
          paid_at = coalesce(p_paid_at, now()),
          payment_method = case v_payment.method
            when 'qris' then 'QRIS'
            else v_payment.channel_code || ' Virtual Account'
          end
      where id = v_order.id;

    -- Tambah hitungan "Terlaris"
    for v_item in
      select product_id, sum(quantity)::int as qty
      from public.order_items
      where order_id = v_order.id and product_id is not null
      group by product_id
      order by product_id
    loop
      update public.products set sold_count = sold_count + v_item.qty where id = v_item.product_id;
    end loop;
    return 'paid';
  end if;

  -- Uang masuk tapi pesanan sudah tidak menunggu. Status tidak diubah otomatis; dicatat untuk admin (Fase 7):
  --   kedaluwarsa/dibatalkan -> pembayaran terlambat (stok sudah dilepas)
  --   sudah dibayar          -> pembayaran ganda (mis. membayar VA lama dan QR baru)
  insert into public.order_status_history (order_id, status, note)
    values (
      v_order.id,
      v_order.status,
      case when v_order.status in ('kedaluwarsa', 'dibatalkan') then 'PEMBAYARAN_TERLAMBAT' else 'PEMBAYARAN_GANDA' end
    );
  return case when v_order.status in ('kedaluwarsa', 'dibatalkan') then 'late_payment' else 'duplicate_payment' end;
end;
$$;

revoke execute on function public.apply_payment_status(text, text, int, timestamptz) from public, anon, authenticated;
grant execute on function public.apply_payment_status(text, text, int, timestamptz) to service_role;

-- ---------- Jaring pengaman: ikut menutup VA/QR pesanan yang kedaluwarsa ----------
create or replace function public.expire_overdue_orders()
returns int
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
  v_count int := 0;
begin
  for v_id in
    select id from public.orders
    where status = 'menunggu_pembayaran' and expires_at < now() - interval '15 minutes'
    order by expires_at
    limit 500
    for update skip locked
  loop
    update public.orders set status = 'kedaluwarsa' where id = v_id;
    -- Masa berlaku VA disamakan dengan batas bayar pesanan, jadi di Komerce pun sudah tidak aktif.
    -- Kalau ternyata tetap dibayar, apply_payment_status mencatatnya sebagai pembayaran terlambat.
    update public.payments set status = 'EXPIRED' where order_id = v_id and status = 'PENDING';
    perform public.release_order_stock(v_id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke execute on function public.expire_overdue_orders() from public, anon, authenticated;
grant execute on function public.expire_overdue_orders() to service_role;
