-- =====================================================================
-- Fase 3 — Rate limit (pembatas percobaan) untuk login, daftar, lupa password
--
-- Analogi: buku catatan satpam. Setiap percobaan login dicatat per "kunci"
-- (mis. alamat IP + email). Kalau dalam satu jendela waktu sudah terlalu sering,
-- satpam menolak dulu sampai jendelanya habis.
-- =====================================================================

create table public.rate_limits (
  key text primary key check (char_length(key) <= 200),
  window_start timestamptz not null default now(),
  hits int not null default 1 check (hits >= 0)
);

create index rate_limits_window_start_idx on public.rate_limits (window_start);

-- RLS aktif TANPA policy dan TANPA grant ke anon/authenticated:
-- tabel ini hanya bisa disentuh server (service_role). Kalau pengunjung bisa menulis ke sini,
-- orang jahat bisa sengaja "memenuhi" kuota email orang lain supaya korban tidak bisa login.
alter table public.rate_limits enable row level security;

-- Catat satu percobaan dan kembalikan TRUE kalau masih di bawah batas.
-- Satu perintah INSERT ... ON CONFLICT bersifat atomik, jadi dua request bersamaan tidak bisa
-- sama-sama lolos karena membaca angka lama.
create function public.check_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_hits int;
  v_window interval := make_interval(secs => p_window_seconds);
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case when r.window_start < now() - v_window then 1 else r.hits + 1 end,
        window_start = case when r.window_start < now() - v_window then now() else r.window_start end
  returning hits into v_hits;

  -- Bersih-bersih catatan lama sesekali (±1% panggilan), supaya tabel tidak terus membesar.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_max;
end;
$$;

revoke execute on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, int, int) to service_role;
