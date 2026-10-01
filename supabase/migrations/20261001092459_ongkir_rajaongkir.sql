-- Fase 6: ongkos kirim RajaOngkir.
-- Dua tabel "buku catatan" milik server supaya kuota gratis RajaOngkir (100 hit/hari) tidak cepat habis.
-- Keduanya hanya dibaca/ditulis server lewat kunci rahasia (service_role):
-- RLS aktif TANPA policy dan TANPA grant ke anon/authenticated, jadi pengunjung tidak bisa menyentuhnya sama sekali.

-- ---------- ID tujuan RajaOngkir per kecamatan + kode pos ----------
-- RajaOngkir menghitung ongkir dari ID wilayahnya sendiri. ID dicari sekali, lalu dicatat di sini
-- untuk dipakai semua pembeli dengan kecamatan + kode pos yang sama.
-- Kuncinya dari data wilayah resmi (bukan isian pembeli), jadi pembeli tidak bisa "memilih" ID yang lebih murah.
create table public.shipping_destinations (
  lookup_key text primary key check (char_length(lookup_key) <= 200), -- "PROVINSI|KOTA|KECAMATAN|KODEPOS" (huruf besar)
  destination_id text not null check (char_length(destination_id) <= 20),
  label text not null check (char_length(label) <= 300), -- label dari RajaOngkir, untuk dicek manual
  created_at timestamptz not null default now()
);
alter table public.shipping_destinations enable row level security;

-- ---------- Cache hasil cek ongkir ----------
-- Satu baris = satu pertanyaan "dari A ke B, sekian kg, kurir ini" beserta jawabannya.
-- Berat disimpan per kg (dibulatkan ke atas), karena kurir memang menagih per kg.
-- Baris lebih dari 24 jam dianggap basi dan ditimpa saat ada yang bertanya lagi.
create table public.shipping_rate_cache (
  origin_id text not null check (char_length(origin_id) <= 20),
  destination_id text not null check (char_length(destination_id) <= 20),
  weight_kg int not null check (weight_kg between 1 and 100),
  couriers text not null check (char_length(couriers) <= 100), -- contoh "jne:jnt:sicepat"
  rates jsonb not null check (jsonb_typeof(rates) = 'array'),
  fetched_at timestamptz not null default now(),
  primary key (origin_id, destination_id, weight_kg, couriers)
);
alter table public.shipping_rate_cache enable row level security;

-- ---------- Kolom lama di addresses ----------
-- Rencana Fase 3 menyimpan ID tujuan di alamat. Ternyata pemilik alamat boleh mengubah barisnya sendiri (RLS),
-- jadi kolom ini bisa diisi ID kota lain yang ongkirnya lebih murah. Diganti tabel shipping_destinations di atas.
alter table public.addresses drop column rajaongkir_destination_id;
