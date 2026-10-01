-- =====================================================================
-- Fase 7A — Admin: kelola pesanan & angka ringkasan
--
-- 1) Admin TIDAK lagi boleh mengubah kolom pesanan langsung dari browser.
--    Semua perubahan status lewat satu pintu: admin_update_order. Fungsi ini tahu aturannya
--    (urutan status, resi wajib, stok kembali saat dibatalkan), jadi aturan tidak bisa dilewati.
-- 2) admin_resolve_payment_issue: admin menandai pembayaran terlambat/ganda/refund sudah ditangani.
-- 3) admin_dashboard: angka ringkasan dihitung di database, browser hanya menerima hasil akhirnya.
-- =====================================================================

-- ---------- 1) Cabut hak ubah langsung ----------
-- Sebelumnya: admin boleh "update status, tracking_number" lewat RLS. Itu melewati pengembalian stok
-- dan penutupan VA kalau admin membatalkan pesanan. Sekarang hanya lewat fungsi di bawah.
drop policy "Admin mengubah status pesanan" on public.orders;
revoke update (status, tracking_number) on public.orders from authenticated;

-- Dipakai angka ringkasan (penjualan per periode dihitung dari waktu bayar)
create index orders_paid_at_idx on public.orders (paid_at) where paid_at is not null;

-- ---------- Satu pintu perubahan status oleh admin ----------
-- Perpindahan yang diizinkan (selain itu ditolak):
--   menunggu_pembayaran -> dibatalkan   (stok kembali, VA/QR yang menunggu ditutup)
--   diproses            -> dikirim      (nomor resi wajib)
--   diproses            -> dibatalkan   (stok kembali, sold_count dikurangi, dicatat PERLU_REFUND)
--   dikirim             -> selesai
-- Status sama + resi berbeda = koreksi nomor resi (hanya saat diproses/dikirim).
-- Menandai "diproses" (lunas) tidak bisa dari sini: lunas hanya dari konfirmasi gateway.
--
-- SECURITY DEFINER karena release_order_stock hanya boleh dijalankan server. Hak admin dicek
-- manual di baris pertama, jadi user biasa yang memanggil fungsi ini langsung ditolak.
--
-- Mengembalikan id pembayaran VA yang ditutup, supaya server ikut menonaktifkannya di Komerce.
create function public.admin_update_order(
  p_order_number text,
  p_status public.order_status,
  p_tracking text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_tracking text := nullif(btrim(p_tracking), '');
  v_closed text[] := '{}';
  v_item record;
begin
  if not public.is_admin() then
    raise exception 'BUKAN_ADMIN';
  end if;
  if v_tracking is not null and v_tracking !~ '^[A-Za-z0-9-]{6,40}$' then
    raise exception 'RESI_TIDAK_VALID';
  end if;

  select * into v_order from public.orders where order_number = p_order_number for update;
  if not found then
    raise exception 'PESANAN_TIDAK_ADA';
  end if;

  -- Koreksi nomor resi tanpa ganti status
  if p_status = v_order.status then
    if v_order.status not in ('diproses', 'dikirim') then
      raise exception 'PERPINDAHAN_TIDAK_BOLEH';
    end if;
    if v_order.status = 'dikirim' and v_tracking is null then
      raise exception 'RESI_WAJIB';
    end if;
    update public.orders set tracking_number = v_tracking where id = v_order.id;
    return jsonb_build_object('status', v_order.status, 'closed_payments', to_jsonb(v_closed));
  end if;

  if not (
    (v_order.status = 'menunggu_pembayaran' and p_status = 'dibatalkan')
    or (v_order.status = 'diproses' and p_status in ('dikirim', 'dibatalkan'))
    or (v_order.status = 'dikirim' and p_status = 'selesai')
  ) then
    raise exception 'PERPINDAHAN_TIDAK_BOLEH';
  end if;

  if p_status = 'dikirim' and v_tracking is null then
    raise exception 'RESI_WAJIB';
  end if;

  update public.orders
    set status = p_status,
        tracking_number = case when p_status = 'dikirim' then v_tracking else tracking_number end
    where id = v_order.id;

  if p_status = 'dibatalkan' then
    -- VA/QR yang masih menunggu tidak boleh dibayar lagi
    with closed as (
      update public.payments set status = 'CANCELED'
      where order_id = v_order.id and status = 'PENDING'
      returning provider_payment_id, method
    )
    select coalesce(array_agg(provider_payment_id) filter (where method = 'va'), '{}') into v_closed from closed;

    perform public.release_order_stock(v_order.id);

    if v_order.status = 'diproses' then
      -- Sudah lunas: hitungan "Terlaris" dikembalikan (urut product_id, sama dengan apply_payment_status)
      for v_item in
        select product_id, sum(quantity)::int as qty
        from public.order_items
        where order_id = v_order.id and product_id is not null
        group by product_id
        order by product_id
      loop
        update public.products set sold_count = greatest(sold_count - v_item.qty, 0) where id = v_item.product_id;
      end loop;
    end if;

    -- Baris riwayat "dibatalkan" baru saja dibuat trigger log_order_status; beri catatan
    update public.order_status_history
      set note = case when v_order.status = 'diproses' then 'PERLU_REFUND' else 'DIBATALKAN_ADMIN' end
      where id = (
        select max(id) from public.order_status_history
        where order_id = v_order.id and status = 'dibatalkan'
      );
  end if;

  return jsonb_build_object('status', p_status, 'closed_payments', to_jsonb(v_closed));
end;
$$;

revoke execute on function public.admin_update_order(text, public.order_status, text) from public, anon;
grant execute on function public.admin_update_order(text, public.order_status, text) to authenticated, service_role;

-- ---------- 2) Tandai masalah pembayaran sudah ditangani ----------
-- Pembayaran terlambat / ganda / refund ditangani di luar sistem (transfer balik, atau proses manual).
-- Setelah beres, admin mencatatnya di riwayat supaya tanda "perlu dicek" hilang.
create function public.admin_resolve_payment_issue(p_order_number text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_admin() then
    raise exception 'BUKAN_ADMIN';
  end if;
  select * into v_order from public.orders where order_number = p_order_number for update;
  if not found then
    raise exception 'PESANAN_TIDAK_ADA';
  end if;
  insert into public.order_status_history (order_id, status, note)
    values (v_order.id, v_order.status, 'MASALAH_BAYAR_DITANGANI');
end;
$$;

revoke execute on function public.admin_resolve_payment_issue(text) from public, anon;
grant execute on function public.admin_resolve_payment_issue(text) to authenticated, service_role;

-- ---------- 3) Angka ringkasan dashboard ----------
-- p_period: 'hari' | '7' | '30' | 'bulan'. Hari dihitung dalam WIB (Asia/Jakarta).
-- Penjualan = pesanan yang sudah dibayar (diproses/dikirim/selesai), dihitung dari waktu bayar.
-- SECURITY INVOKER (bawaan): fungsi membaca data dengan hak pemanggil, jadi tetap dijaga RLS.
-- Pengecekan admin di awal membuat user biasa mendapat error, bukan angka pesanannya sendiri.
create function public.admin_dashboard(p_period text default '30')
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
  v_start date;
  v_chart_start date;
  v_days int;
  v_from timestamptz;
  v_to timestamptz;
  v_prev_from timestamptz;
  v_month_from timestamptz;
  v_today_from timestamptz;
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'BUKAN_ADMIN';
  end if;

  v_start := case p_period
    when 'hari' then v_today
    when '7' then v_today - 6
    when '30' then v_today - 29
    when 'bulan' then date_trunc('month', v_today)::date
    else null
  end;
  if v_start is null then
    raise exception 'PERIODE_TIDAK_VALID';
  end if;

  v_days := v_today - v_start + 1;
  v_chart_start := least(v_start, v_today - 6); -- grafik minimal 7 hari supaya tetap terbaca
  v_from := v_start::timestamp at time zone 'Asia/Jakarta';
  v_to := (v_today + 1)::timestamp at time zone 'Asia/Jakarta';
  v_prev_from := v_from - make_interval(days => v_days);
  v_today_from := v_today::timestamp at time zone 'Asia/Jakarta';
  v_month_from := date_trunc('month', v_today)::timestamp at time zone 'Asia/Jakarta';

  with paid as (
    select id, total, paid_at
    from public.orders
    where paid_at >= least(v_prev_from, v_month_from, (v_chart_start)::timestamp at time zone 'Asia/Jakarta')
      and paid_at < v_to
      and status in ('diproses', 'dikirim', 'selesai')
  )
  select jsonb_build_object(
    'period', p_period,
    'from', v_start,
    'to', v_today,
    'sales', (select coalesce(sum(total), 0) from paid where paid_at >= v_from),
    'orders', (select count(*) from paid where paid_at >= v_from),
    'prev_sales', (select coalesce(sum(total), 0) from paid where paid_at >= v_prev_from and paid_at < v_from),
    'prev_orders', (select count(*) from paid where paid_at >= v_prev_from and paid_at < v_from),
    'today_sales', (select coalesce(sum(total), 0) from paid where paid_at >= v_today_from),
    'today_orders', (select count(*) from paid where paid_at >= v_today_from),
    'month_sales', (select coalesce(sum(total), 0) from paid where paid_at >= v_month_from),
    'month_orders', (select count(*) from paid where paid_at >= v_month_from),
    -- Penjualan per hari (WIB), termasuk hari tanpa penjualan
    'daily', (
      select jsonb_agg(jsonb_build_object('date', d::date, 'sales', coalesce(s.sales, 0)) order by d)
      from generate_series(v_chart_start, v_today, interval '1 day') d
      left join (
        select (paid_at at time zone 'Asia/Jakarta')::date as day, sum(total) as sales
        from paid group by 1
      ) s on s.day = d::date
    ),
    -- Jumlah pesanan per status (sepanjang waktu)
    'status_counts', (
      select coalesce(jsonb_object_agg(status, n), '{}')
      from (select status, count(*) as n from public.orders group by status) c
    ),
    -- Varian aktif dengan stok 5 atau kurang (termasuk habis)
    'low_stock_count', (
      select count(*)
      from public.product_variants v join public.products p on p.id = v.product_id
      where v.is_active and p.is_active and v.stock <= 5
    ),
    'low_stock', (
      select coalesce(jsonb_agg(x order by x.stock, x.product_name), '[]')
      from (
        select p.name as product_name, p.id as product_id, v.color_name, v.size_name, v.stock
        from public.product_variants v join public.products p on p.id = v.product_id
        where v.is_active and p.is_active and v.stock <= 5
        order by v.stock, p.name
        limit 5
      ) x
    ),
    -- Terlaris di periode ini (jumlah barang dari pesanan yang dibayar)
    'top_products', (
      select coalesce(jsonb_agg(t order by t.qty desc, t.name), '[]')
      from (
        select oi.product_id, max(oi.product_name) as name, sum(oi.quantity)::int as qty,
          (select i.url from public.product_images i where i.product_id = oi.product_id order by i.sort_order limit 1) as image_url
        from public.order_items oi
        join paid on paid.id = oi.order_id and paid.paid_at >= v_from
        group by oi.product_id
        order by qty desc, name
        limit 5
      ) t
    ),
    'recent_orders', (
      select coalesce(jsonb_agg(r order by r.created_at desc), '[]')
      from (
        select order_number, shipping_address ->> 'recipient_name' as buyer, total, status, created_at
        from public.orders
        order by created_at desc
        limit 5
      ) r
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.admin_dashboard(text) from public, anon;
grant execute on function public.admin_dashboard(text) to authenticated, service_role;
