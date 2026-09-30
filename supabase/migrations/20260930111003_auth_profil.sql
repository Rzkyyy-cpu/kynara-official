-- =====================================================================
-- Fase 3 — Profil otomatis, nama pengulas, dan ID tujuan ongkir
-- =====================================================================

-- ---------- Trigger: buat profil setiap ada akun baru ----------
-- Analogi: setiap kali loket (Supabase Auth) menerbitkan kartu anggota baru,
-- petugas arsip langsung membuatkan map data anggota (baris profiles) dengan role "user".
-- Data nama/HP diambil dari metadata saat daftar (form kita) atau dari Google ("name").
-- SECURITY DEFINER karena trigger berjalan di schema auth dan harus bisa menulis ke public.profiles,
-- yang tidak punya policy INSERT untuk siapa pun.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, avatar_url)
  values (
    new.id,
    left(nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')), ''), 100),
    left(nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), 20),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  -- role tidak diisi di sini: selalu memakai default 'user'.
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Akun yang sudah terlanjur dibuat sebelum trigger ini ada ikut dibuatkan profil.
insert into public.profiles (id, full_name)
select u.id, left(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'), 100)
from auth.users u
on conflict (id) do nothing;

-- ---------- Nama pengulas di reviews ----------
-- profiles dikunci RLS (hanya pemilik yang bisa membaca), jadi pengunjung tidak bisa melihat nama pengulas.
-- Solusinya: simpan salinan nama tampilan di ulasan itu sendiri, disingkat demi privasi ("Nadia A.").
alter table public.reviews
  add column reviewer_name text not null default 'Pembeli kynara'
  check (char_length(reviewer_name) <= 60);

-- Nama diisi oleh database, bukan dari browser, supaya user tidak bisa menyamar jadi orang lain.
create function public.set_reviewer_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  select nullif(trim(p.full_name), '') into v_name
  from public.profiles p
  where p.id = new.user_id;

  new.reviewer_name := case
    when v_name is null then 'Pembeli kynara'
    when position(' ' in v_name) = 0 then v_name
    -- kata pertama + inisial kata kedua: "Nadia Azzahra" -> "Nadia A."
    else split_part(v_name, ' ', 1) || ' ' || upper(left(split_part(v_name, ' ', 2), 1)) || '.'
  end;
  return new;
end;
$$;

revoke execute on function public.set_reviewer_name() from public, anon, authenticated;

create trigger set_reviewer_name
  before insert or update of user_id, reviewer_name on public.reviews
  for each row execute function public.set_reviewer_name();

-- ---------- ID tujuan RajaOngkir di alamat ----------
-- RajaOngkir menghitung ongkir dari ID tujuan, bukan nama kecamatan. ID dicari sekali per alamat
-- di Fase 6 lalu disimpan di sini, supaya kuota API gratis (100/hari) tidak habis.
-- Nullable: kosong sampai Fase 6. Server tetap menghitung ulang ongkir, jadi nilai ini tidak dipercaya buta.
alter table public.addresses
  add column rajaongkir_destination_id text check (char_length(rajaongkir_destination_id) <= 20);
