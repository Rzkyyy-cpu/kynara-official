-- =====================================================================
-- Fase 5 — Perbaikan apply_payment_status
-- Migration sebelumnya menulis ke kolom "payment_type", padahal nama kolom di tabel orders
-- adalah "payment_method". PL/pgSQL baru memeriksa nama kolom saat fungsi DIJALANKAN,
-- jadi kesalahan ini tidak ketahuan saat push. Fungsi diganti dengan versi yang benar
-- (isi dan aturan lainnya sama persis).
-- =====================================================================

create or replace function public.apply_payment_status(
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
            payment_method = coalesce(p_payment_type, payment_method)
        where id = v_order.id;
      insert into public.order_status_history (order_id, status, note)
        values (v_order.id, v_order.status, 'PEMBAYARAN_TERLAMBAT');
      return 'late_payment';
    end if;
    return 'ignored';
  end if;

  if p_result = 'pending' then
    update public.orders
      set payment_method = coalesce(p_payment_type, payment_method),
          payment_details = coalesce(p_payment_details, payment_details)
      where id = v_order.id;
    return 'pending';
  end if;

  if p_result = 'paid' then
    update public.orders
      set status = 'diproses',
          paid_at = coalesce(p_paid_at, now()),
          payment_method = coalesce(p_payment_type, payment_method),
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
        payment_method = coalesce(p_payment_type, payment_method)
    where id = v_order.id;
  perform public.release_order_stock(v_order.id);
  return p_result;
end;
$$;

-- create or replace mempertahankan hak akses lama; ditulis ulang supaya jelas
revoke execute on function public.apply_payment_status(text, text, int, text, jsonb, timestamptz) from public, anon, authenticated;
grant execute on function public.apply_payment_status(text, text, int, text, jsonb, timestamptz) to service_role;
