-- =====================================================================
-- Fase 4 — Membuat pesanan secara atomik
--
-- Analogi: kasir yang memasukkan semua barang ke SATU kantong. Kalau satu barang ternyata habis,
-- seluruh isi kantong dikembalikan ke rak. Fungsi Postgres selalu berjalan dalam satu transaksi,
-- jadi kalau ada satu RAISE EXCEPTION, semua perubahan di fungsi ini dibatalkan otomatis.
-- =====================================================================

-- Nomor urut pesanan (KYN-260930-0001). Sequence = mesin karcis antrean:
-- setiap panggilan nextval() pasti mendapat angka berbeda, walaupun ada dua pesanan di detik yang sama.
create sequence public.order_number_seq;

-- Isi pesanan diambil dari keranjang user di database (bukan dari browser).
-- expires_at = batas bayar 24 jam; setelah itu Fase 5 mengembalikan stoknya.
create function public.create_order(
  p_user_id uuid,
  p_shipping_address jsonb,
  p_courier text,
  p_courier_service text,
  p_shipping_cost int,
  p_expected_total int default null
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_cart_id uuid;
  v_item record;
  v_count int := 0;
  v_subtotal int := 0;
  v_weight int := 0;
  v_order_id uuid;
  v_seq bigint;
  v_order_number text;
begin
  if p_shipping_cost is null or p_shipping_cost < 0 then
    raise exception 'ONGKIR_TIDAK_VALID';
  end if;
  if p_shipping_address is null or jsonb_typeof(p_shipping_address) <> 'object' then
    raise exception 'ALAMAT_TIDAK_VALID';
  end if;

  select c.id into v_cart_id from public.carts c where c.user_id = p_user_id;
  if v_cart_id is null then
    raise exception 'KERANJANG_KOSONG';
  end if;

  -- 1) Kunci baris varian yang dibeli (FOR UPDATE), diurutkan menurut id.
  --    Kunci = "tanda sedang dipegang kasir": pesanan lain yang membeli varian yang sama menunggu
  --    sampai transaksi ini selesai. Urutan tetap mencegah dua pesanan saling menunggu selamanya (deadlock).
  --    Harga diambil dari tabel varian, BUKAN dari browser.
  for v_item in
    select ci.variant_id, ci.quantity, v.price, v.stock, v.is_active and p.is_active as available,
           p.id as product_id, p.name as product_name, p.weight_gram,
           v.color_name, v.size_name
    from public.cart_items ci
    join public.product_variants v on v.id = ci.variant_id
    join public.products p on p.id = v.product_id
    where ci.cart_id = v_cart_id
    order by ci.variant_id
    for update of v
  loop
    if not v_item.available then
      raise exception 'ITEM_TIDAK_TERSEDIA' using detail = v_item.variant_id::text;
    end if;
    if v_item.stock < v_item.quantity then
      raise exception 'STOK_KURANG' using detail = v_item.variant_id::text;
    end if;
    v_count := v_count + 1;
    v_subtotal := v_subtotal + v_item.price * v_item.quantity;
    v_weight := v_weight + v_item.weight_gram * v_item.quantity;
  end loop;

  if v_count = 0 then
    raise exception 'KERANJANG_KOSONG';
  end if;

  -- Total yang dilihat pembeli di layar konfirmasi harus sama dengan hitungan database.
  -- Kalau harga berubah di tengah jalan, pesanan ditolak supaya pembeli tidak membayar angka yang tidak dia lihat.
  if p_expected_total is not null and p_expected_total <> v_subtotal + p_shipping_cost then
    raise exception 'TOTAL_BERUBAH';
  end if;

  -- 2) Simpan pesanan
  v_seq := nextval('public.order_number_seq');
  v_order_number := 'KYN-' || to_char(now() at time zone 'Asia/Jakarta', 'YYMMDD') || '-'
    || lpad(v_seq::text, greatest(4, length(v_seq::text)), '0');

  insert into public.orders (
    order_number, user_id, status, shipping_address, courier, courier_service,
    shipping_cost, subtotal, total, total_weight_gram, expires_at
  ) values (
    v_order_number, p_user_id, 'menunggu_pembayaran', p_shipping_address, p_courier, p_courier_service,
    p_shipping_cost, v_subtotal, v_subtotal + p_shipping_cost, v_weight, now() + interval '24 hours'
  )
  returning id into v_order_id;

  -- 3) Salin item (seperti struk) dan kurangi stok.
  --    "stock >= quantity" di WHERE adalah pengaman kedua: kalau entah bagaimana stok sudah kurang,
  --    tidak ada baris yang ter-update, lalu kita batalkan semuanya.
  for v_item in
    select ci.variant_id, ci.quantity, v.price, p.id as product_id, p.name as product_name,
           v.color_name, v.size_name
    from public.cart_items ci
    join public.product_variants v on v.id = ci.variant_id
    join public.products p on p.id = v.product_id
    where ci.cart_id = v_cart_id
    order by ci.variant_id
  loop
    update public.product_variants
      set stock = stock - v_item.quantity
      where id = v_item.variant_id and stock >= v_item.quantity;
    if not found then
      raise exception 'STOK_KURANG' using detail = v_item.variant_id::text;
    end if;

    insert into public.order_items (order_id, product_id, variant_id, product_name, variant_label, price, quantity)
    values (
      v_order_id, v_item.product_id, v_item.variant_id, v_item.product_name,
      v_item.color_name || ' · ' || v_item.size_name, v_item.price, v_item.quantity
    );
  end loop;

  -- 4) Kosongkan keranjang
  delete from public.cart_items where cart_id = v_cart_id;

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'total', v_subtotal + p_shipping_cost
  );
end;
$$;

-- Hanya SERVER (service_role) yang boleh menjalankan fungsi ini.
-- Alasannya: fungsi menerima angka ongkir dan id user. Kalau browser boleh memanggilnya langsung
-- lewat API Supabase, orang iseng bisa mengirim ongkir 0 atau id user lain.
-- Server action kita yang mengecek login, menghitung ongkir sendiri, lalu memanggil fungsi ini.
revoke execute on function public.create_order(uuid, jsonb, text, text, int, int) from public, anon, authenticated;
grant execute on function public.create_order(uuid, jsonb, text, text, int, int) to service_role;

revoke all on sequence public.order_number_seq from public, anon, authenticated;
grant usage on sequence public.order_number_seq to service_role;
