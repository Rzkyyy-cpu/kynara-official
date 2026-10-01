-- =====================================================================
-- Fase 5 — Pembayaran Midtrans
--
-- Isi:
-- 1) Kolom pembayaran di orders (token Snap, metode, nomor VA).
-- 2) Riwayat status pesanan (untuk timeline di halaman status pesanan).
-- 3) apply_payment_status: SATU pintu untuk mengubah status karena pembayaran.
--    Dipakai webhook Midtrans dan tombol "cek status", jadi hasilnya selalu sama.
-- 4) expire_overdue_orders + pg_cron: jaring pengaman pesanan kedaluwarsa.
-- =====================================================================

-- ---------- 1) Kolom pembayaran ----------
alter table public.orders
  add column snap_token text,                  -- "tiket" untuk membuka popup Snap lagi
  add column payment_details jsonb;            -- contoh {"bank":"bca","va_number":"8808..."} (tanpa data rahasia)

-- ---------- 2) Riwayat status ----------
-- Seperti buku mutasi: setiap kali status pesanan berubah, satu baris dicatat beserta waktunya.
create table public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status not null,
  note text, -- catatan khusus, mis. pembayaran yang masuk setelah pesanan kedaluwarsa
  created_at timestamptz not null default now()
);

create index order_status_history_order_id_idx on public.order_status_history (order_id, created_at);

alter table public.order_status_history enable row level security;

-- Pembeli hanya MEMBACA riwayat pesanannya sendiri; admin membaca semua.
-- Tidak ada policy tulis: baris hanya dibuat trigger & fungsi di bawah.
grant select on public.order_status_history to authenticated;

create policy "Lihat riwayat status pesanan sendiri, admin lihat semua"
  on public.order_status_history for select
  to authenticated
  using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
    or (select public.is_admin())
  );

-- Trigger: catat otomatis setiap pesanan dibuat atau statusnya berubah (termasuk perubahan oleh admin di Fase 7).
-- security definer supaya tetap bisa menulis ke tabel riwayat walaupun pemicunya user biasa/admin.
create function public.log_order_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_history (order_id, status) values (new.id, new.status);
  end if;
  return new;
end;
$$;

revoke execute on function public.log_order_status() from public, anon, authenticated;

create trigger log_order_status
  after insert or update of status on public.orders
  for each row execute function public.log_order_status();

-- Pesanan yang sudah ada sebelum migration ini: isi riwayat awalnya
insert into public.order_status_history (order_id, status, created_at)
select id, 'menunggu_pembayaran', created_at from public.orders;
insert into public.order_status_history (order_id, status, created_at)
select id, status, updated_at from public.orders where status <> 'menunggu_pembayaran';

-- ---------- Pembantu: kembalikan stok sebuah pesanan ----------
-- Dipanggil HANYA saat pesanan berpindah dari "menunggu pembayaran" ke kedaluwarsa/dibatalkan,
-- jadi stok tidak mungkin dikembalikan dua kali. Urut per variant_id supaya tidak deadlock
-- dengan create_order yang mengunci varian dengan urutan yang sama.
create function public.release_order_stock(p_order_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_item record;
begin
  for v_item in
    select variant_id, sum(quantity)::int as qty
    from public.order_items
    where order_id = p_order_id and variant_id is not null -- varian yang sudah dihapus dilewati
    group by variant_id
    order by variant_id
  loop
    update public.product_variants set stock = stock + v_item.qty where id = v_item.variant_id;
  end loop;
end;
$$;

-- ---------- 3) Satu pintu perubahan status karena pembayaran ----------
-- p_result sudah diterjemahkan server dari status Midtrans:
--   'paid'      -> diproses (+ sold_count)
--   'pending'   -> tetap menunggu, simpan nomor VA dsb.
--   'expired'   -> kedaluwarsa (+ stok kembali)
--   'cancelled' -> dibatalkan (+ stok kembali)
--
-- IDEMPOTEN: Midtrans bisa mengirim notifikasi yang sama berkali-kali. Pesanan dikunci (FOR UPDATE)
-- dan hanya boleh berpindah dari 'menunggu_pembayaran'. Notifikasi kedua menemukan status sudah
-- berubah, jadi tidak ada yang dikerjakan lagi. Analogi: stempel "LUNAS" hanya bisa dicap sekali.
create function public.apply_payment_status(
  p_order_number text,
  p_result text,
  p_gross_amount int,
  p_payment_type text default null,
  p_payment_details jsonb default null,
  p_paid_at timestamptz default null
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  if p_result not in ('paid', 'pending', 'expired', 'cancelled') then
    raise exception 'HASIL_TIDAK_VALID';
  end if;

  select * into v_order from public.orders where order_number = p_order_number for update;
  if not found then
    raise exception 'PESANAN_TIDAK_ADA';
  end if;

  -- Jumlah yang dibayar harus sama persis dengan total di database
  if p_gross_amount is distinct from v_order.total then
    raise exception 'JUMLAH_TIDAK_COCOK';
  end if;

  if v_order.status <> 'menunggu_pembayaran' then
    -- Kasus langka: uang masuk setelah pesanan kedaluwarsa/dibatalkan (stok sudah dikembalikan).
    -- Status tidak diubah otomatis; dicatat supaya admin bisa refund atau memproses manual (Fase 7).
    if p_result = 'paid' and v_order.status in ('kedaluwarsa', 'dibatalkan') and v_order.paid_at is null then
      update public.orders
        set paid_at = coalesce(p_paid_at, now()),
            payment_type = coalesce(p_payment_type, payment_type)
        where id = v_order.id;
      insert into public.order_status_history (order_id, status, note)
        values (v_order.id, v_order.status, 'PEMBAYARAN_TERLAMBAT');
      return 'late_payment';
    end if;
    return 'ignored';
  end if;

  if p_result = 'pending' then
    update public.orders
      set payment_type = coalesce(p_payment_type, payment_type),
          payment_details = coalesce(p_payment_details, payment_details)
      where id = v_order.id;
    return 'pending';
  end if;

  if p_result = 'paid' then
    update public.orders
      set status = 'diproses',
          paid_at = coalesce(p_paid_at, now()),
          payment_type = coalesce(p_payment_type, payment_type),
          payment_details = coalesce(p_payment_details, payment_details)
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

  -- expired / cancelled
  update public.orders
    set status = case p_result when 'expired' then 'kedaluwarsa' else 'dibatalkan' end::public.order_status,
        payment_type = coalesce(p_payment_type, payment_type)
    where id = v_order.id;
  perform public.release_order_stock(v_order.id);
  return p_result;
end;
$$;

-- ---------- 4) Jaring pengaman: pesanan lewat batas bayar ----------
-- Kalau notifikasi "expire" dari Midtrans tidak pernah sampai (atau pembeli tidak pernah membuka
-- popup bayar), job terjadwal ini yang menandai kedaluwarsa & mengembalikan stok.
-- Tenggang 15 menit: memberi waktu notifikasi "lunas" di detik-detik terakhir sampai lebih dulu.
-- skip locked = lewati pesanan yang sedang diproses webhook, dicoba lagi di putaran berikutnya.
create function public.expire_overdue_orders()
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
    perform public.release_order_stock(v_id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Semua fungsi di atas hanya untuk SERVER (service_role) dan job terjadwal.
-- Kalau browser bisa memanggil apply_payment_status, orang bisa "melunasi" pesanan tanpa membayar.
revoke execute on function public.release_order_stock(uuid) from public, anon, authenticated;
revoke execute on function public.apply_payment_status(text, text, int, text, jsonb, timestamptz) from public, anon, authenticated;
revoke execute on function public.expire_overdue_orders() from public, anon, authenticated;
grant execute on function public.release_order_stock(uuid) to service_role;
grant execute on function public.apply_payment_status(text, text, int, text, jsonb, timestamptz) to service_role;
grant execute on function public.expire_overdue_orders() to service_role;

-- pg_cron = "alarm" di dalam database. Setiap 10 menit menjalankan expire_overdue_orders().
create extension if not exists pg_cron;

select cron.schedule(
  'kedaluwarsakan-pesanan',
  '*/10 * * * *',
  $$select public.expire_overdue_orders()$$
);
