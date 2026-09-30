-- =====================================================================
-- Seed data contoh (Fase 2): 7 kategori & 12 produk dummy.
-- Aman dijalankan ulang: baris yang sudah ada dilewati (on conflict do nothing).
-- Nama, harga, dan warna diambil dari prototipe desain. Ganti dengan data asli sebelum live.
-- =====================================================================

-- ---------- Kategori ----------
insert into public.categories (name, slug, description, sort_order, show_on_home) values
  ('Hijab Segi Empat', 'hijab-segi-empat', 'Voal, katun, satin',          1, true),
  ('Pashmina',         'pashmina',         'Airflow, ceruty, satin',      2, true),
  ('Instan / Bergo',   'instan-bergo',     'Siap pakai, tanpa peniti',    3, true),
  ('Outer',            'outer',            'Cardigan, kimono, blazer',    4, true),
  ('Bawahan',          'bawahan',          'Rok plisket, kulot, celana',  5, true),
  ('Dress',            'dress',            'Gamis dan dress harian',      6, true),
  ('Aksesoris',        'aksesoris',        'Ciput, inner, bros, peniti',  7, false)
on conflict (slug) do nothing;

-- ---------- Produk ----------
-- created_at dibuat berbeda-beda supaya label "Baru" (≤ 30 hari) hanya muncul di sebagian produk.
insert into public.products
  (category_id, name, slug, description, material, finishing, care, weight_gram, sold_count, created_at)
select c.id, p.name, p.slug, p.description, p.material, p.finishing, p.care, p.weight_gram, p.sold_count,
       now() - make_interval(days => p.age_days)
from (values
  ('hijab-segi-empat', 'Segi Empat Voal Aruna', 'segi-empat-voal-aruna',
   'Segi empat voal tegak di dahi, tidak licin, dan mudah dibentuk. Cocok untuk kuliah dan kerja.',
   'Voal', 'Jahit tepi neci halus', 'Cuci tangan, setrika suhu rendah', 110, 64, 5),
  ('hijab-segi-empat', 'Segi Empat Katun Laila', 'segi-empat-katun-laila',
   'Katun rawis yang lembut dan menyerap keringat, nyaman untuk aktivitas seharian.',
   'Katun', 'Tepi rawis', 'Boleh dicuci mesin dengan kantong laundry', 120, 41, 60),
  ('pashmina', 'Pashmina Airflow Sekar', 'pashmina-airflow-sekar',
   'Pashmina ringan bertekstur kerut halus. Adem dipakai seharian dan tidak perlu disetrika.',
   'Airflow', 'Tepi dijahit neci halus', 'Cuci tangan, jangan diperas, jemur di tempat teduh', 130, 126, 3),
  ('pashmina', 'Pashmina Ceruty Laras', 'pashmina-ceruty-laras',
   'Ceruty babydoll yang jatuh dan tidak menerawang, pas untuk acara semi-formal.',
   'Ceruty', 'Tepi neci', 'Cuci tangan, setrika suhu rendah', 140, 58, 12),
  ('pashmina', 'Pashmina Satin Lembayung', 'pashmina-satin-lembayung',
   'Satin silk yang berkilau lembut, cocok untuk pesta dan kondangan.',
   'Satin', 'Tepi neci', 'Cuci tangan, jangan diperas', 150, 87, 40),
  ('pashmina', 'Pashmina Airflow Kinan', 'pashmina-airflow-kinan',
   'Airflow polos dengan pilihan warna kalem, gampang dipadukan dengan outfit apa saja.',
   'Airflow', 'Tepi dijahit neci halus', 'Cuci tangan, jemur di tempat teduh', 130, 152, 75),
  ('instan-bergo', 'Bergo Instan Nara', 'bergo-instan-nara',
   'Bergo jersey siap pakai dengan pet antem, tanpa peniti. Praktis untuk olahraga dan perjalanan.',
   'Jersey', 'Pet antem, jahitan obras rapi', 'Boleh dicuci mesin, jangan diputih', 160, 73, 20),
  ('instan-bergo', 'Instan Tali Kaila', 'instan-tali-kaila',
   'Hijab instan bertali di belakang, ukurannya bisa disesuaikan dan tetap rapi seharian.',
   'Jersey', 'Tali belakang, jahitan obras', 'Boleh dicuci mesin', 140, 29, 50),
  ('outer', 'Outer Linen Senja', 'outer-linen-senja',
   'Outer linen longgar dengan kancing depan, sejuk untuk cuaca panas.',
   'Linen', 'Kancing kayu, saku samping', 'Cuci tangan, setrika suhu sedang', 450, 22, 8),
  ('bawahan', 'Rok Plisket Kirana', 'rok-plisket-kirana',
   'Rok plisket ceruty dengan pinggang karet, jatuh dan tidak mudah kusut.',
   'Ceruty', 'Pinggang karet, furing', 'Cuci tangan, jangan disetrika langsung', 350, 47, 35),
  ('dress', 'Dress Katun Rinjani', 'dress-katun-rinjani',
   'Dress katun A-line dengan kancing depan, busui friendly dan ada saku.',
   'Katun', 'Kancing depan, saku samping', 'Boleh dicuci mesin, setrika suhu sedang', 600, 18, 15),
  ('aksesoris', 'Ciput Rajut Dasar', 'ciput-rajut-dasar',
   'Ciput rajut elastis yang menahan rambut dan membuat hijab tidak mudah bergeser.',
   'Rajut', 'Rajut elastis', 'Boleh dicuci mesin', 50, 210, 90)
) as p(category_slug, name, slug, description, material, finishing, care, weight_gram, sold_count, age_days)
join public.categories c on c.slug = p.category_slug
on conflict (slug) do nothing;

-- ---------- Varian (warna × ukuran, harga, stok) ----------
insert into public.product_variants
  (product_id, color_name, color_hex, size_name, size_detail, sku, price, stock, sort_order)
select pr.id, v.color_name, v.color_hex, v.size_name, v.size_detail, v.sku, v.price, v.stock, v.sort_order
from (values
  -- Segi Empat Voal Aruna
  ('segi-empat-voal-aruna', 'Pasir', '#D9C7B0', 'Standar', '115 × 115 cm', 'KYN-SEVA-PSR', 89000, 20, 1),
  ('segi-empat-voal-aruna', 'Sage',  '#9DAE9B', 'Standar', '115 × 115 cm', 'KYN-SEVA-SGE', 89000, 14, 2),
  ('segi-empat-voal-aruna', 'Lilac', '#B8A9BF', 'Standar', '115 × 115 cm', 'KYN-SEVA-LLC', 89000,  9, 3),
  -- Segi Empat Katun Laila
  ('segi-empat-katun-laila', 'Krem',       '#EDE3D3', 'Standar', '110 × 110 cm', 'KYN-SEKL-KRM', 75000, 18, 1),
  ('segi-empat-katun-laila', 'Arang',      '#5B5752', 'Standar', '110 × 110 cm', 'KYN-SEKL-ARG', 75000, 11, 2),
  ('segi-empat-katun-laila', 'Biru Kabut', '#9AA9B5', 'Standar', '110 × 110 cm', 'KYN-SEKL-BKB', 75000,  7, 3),
  -- Pashmina Airflow Sekar (sama dengan prototipe detail produk; Mocha sengaja habis)
  ('pashmina-airflow-sekar', 'Sage',  '#9DAE9B', 'Standar', '175 × 75 cm', 'KYN-PAS-SGE-STD', 79000, 12, 1),
  ('pashmina-airflow-sekar', 'Sage',  '#9DAE9B', 'Jumbo',   '200 × 75 cm', 'KYN-PAS-SGE-JMB', 89000,  4, 2),
  ('pashmina-airflow-sekar', 'Pasir', '#D9C7B0', 'Standar', '175 × 75 cm', 'KYN-PAS-PSR-STD', 79000,  8, 3),
  ('pashmina-airflow-sekar', 'Pasir', '#D9C7B0', 'Jumbo',   '200 × 75 cm', 'KYN-PAS-PSR-JMB', 89000,  0, 4),
  ('pashmina-airflow-sekar', 'Mocha', '#8E735E', 'Standar', '175 × 75 cm', 'KYN-PAS-MCH-STD', 79000,  0, 5),
  ('pashmina-airflow-sekar', 'Mocha', '#8E735E', 'Jumbo',   '200 × 75 cm', 'KYN-PAS-MCH-JMB', 89000,  0, 6),
  ('pashmina-airflow-sekar', 'Arang', '#5B5752', 'Standar', '175 × 75 cm', 'KYN-PAS-ARG-STD', 79000, 15, 7),
  ('pashmina-airflow-sekar', 'Arang', '#5B5752', 'Jumbo',   '200 × 75 cm', 'KYN-PAS-ARG-JMB', 89000,  6, 8),
  ('pashmina-airflow-sekar', 'Lilac', '#B8A9BF', 'Standar', '175 × 75 cm', 'KYN-PAS-LLC-STD', 79000,  3, 9),
  ('pashmina-airflow-sekar', 'Lilac', '#B8A9BF', 'Jumbo',   '200 × 75 cm', 'KYN-PAS-LLC-JMB', 89000,  2, 10),
  -- Pashmina Ceruty Laras
  ('pashmina-ceruty-laras', 'Pasir',      '#D9C7B0', 'Standar', '180 × 75 cm', 'KYN-PCL-PSR', 85000, 16, 1),
  ('pashmina-ceruty-laras', 'Biru Kabut', '#9AA9B5', 'Standar', '180 × 75 cm', 'KYN-PCL-BKB', 85000, 10, 2),
  ('pashmina-ceruty-laras', 'Arang',      '#5B5752', 'Standar', '180 × 75 cm', 'KYN-PCL-ARG', 85000, 12, 3),
  -- Pashmina Satin Lembayung (stok sedikit -> label "Stok terbatas")
  ('pashmina-satin-lembayung', 'Lilac',      '#B8A9BF', 'Standar', '175 × 70 cm', 'KYN-PSL-LLC', 99000, 3, 1),
  ('pashmina-satin-lembayung', 'Biru Kabut', '#9AA9B5', 'Standar', '175 × 70 cm', 'KYN-PSL-BKB', 99000, 2, 2),
  ('pashmina-satin-lembayung', 'Krem',       '#EDE3D3', 'Standar', '175 × 70 cm', 'KYN-PSL-KRM', 99000, 1, 3),
  -- Pashmina Airflow Kinan
  ('pashmina-airflow-kinan', 'Biru Kabut',  '#9AA9B5', 'Standar', '175 × 75 cm', 'KYN-PAK-BKB', 79000, 22, 1),
  ('pashmina-airflow-kinan', 'Krem',        '#EDE3D3', 'Standar', '175 × 75 cm', 'KYN-PAK-KRM', 79000, 17, 2),
  ('pashmina-airflow-kinan', 'Biru Slate',  '#708BAA', 'Standar', '175 × 75 cm', 'KYN-PAK-BSL', 79000, 13, 3),
  -- Bergo Instan Nara
  ('bergo-instan-nara', 'Mocha', '#8E735E', 'M', 'Lingkar wajah 50–54 cm', 'KYN-BIN-MCH-M', 95000, 10, 1),
  ('bergo-instan-nara', 'Mocha', '#8E735E', 'L', 'Lingkar wajah 54–58 cm', 'KYN-BIN-MCH-L', 95000,  8, 2),
  ('bergo-instan-nara', 'Hitam', '#2B2B2B', 'M', 'Lingkar wajah 50–54 cm', 'KYN-BIN-HTM-M', 95000, 14, 3),
  ('bergo-instan-nara', 'Hitam', '#2B2B2B', 'L', 'Lingkar wajah 54–58 cm', 'KYN-BIN-HTM-L', 95000, 12, 4),
  ('bergo-instan-nara', 'Pasir', '#D9C7B0', 'M', 'Lingkar wajah 50–54 cm', 'KYN-BIN-PSR-M', 95000,  6, 5),
  -- Instan Tali Kaila
  ('instan-tali-kaila', 'Sage',  '#9DAE9B', 'All size', null, 'KYN-ITK-SGE', 69000, 15, 1),
  ('instan-tali-kaila', 'Hitam', '#2B2B2B', 'All size', null, 'KYN-ITK-HTM', 69000, 20, 2),
  -- Outer Linen Senja
  ('outer-linen-senja', 'Terakota',   '#D9A48C', 'M',  'Lingkar dada 104 cm', 'KYN-OLS-TRK-M',  229000, 5, 1),
  ('outer-linen-senja', 'Terakota',   '#D9A48C', 'L',  'Lingkar dada 110 cm', 'KYN-OLS-TRK-L',  229000, 4, 2),
  ('outer-linen-senja', 'Krem',       '#EDE3D3', 'M',  'Lingkar dada 104 cm', 'KYN-OLS-KRM-M',  229000, 6, 3),
  ('outer-linen-senja', 'Krem',       '#EDE3D3', 'L',  'Lingkar dada 110 cm', 'KYN-OLS-KRM-L',  229000, 3, 4),
  ('outer-linen-senja', 'Biru Slate', '#708BAA', 'XL', 'Lingkar dada 116 cm', 'KYN-OLS-BSL-XL', 239000, 2, 5),
  -- Rok Plisket Kirana
  ('rok-plisket-kirana', 'Arang', '#5B5752', 'All size', 'Pinggang karet 60–90 cm', 'KYN-RPK-ARG', 159000, 12, 1),
  ('rok-plisket-kirana', 'Mocha', '#8E735E', 'All size', 'Pinggang karet 60–90 cm', 'KYN-RPK-MCH', 159000,  9, 2),
  ('rok-plisket-kirana', 'Pasir', '#D9C7B0', 'All size', 'Pinggang karet 60–90 cm', 'KYN-RPK-PSR', 159000,  7, 3),
  -- Dress Katun Rinjani
  ('dress-katun-rinjani', 'Biru Kabut', '#9AA9B5', 'M',  'Lingkar dada 100 cm', 'KYN-DKR-BKB-M',  289000, 4, 1),
  ('dress-katun-rinjani', 'Biru Kabut', '#9AA9B5', 'L',  'Lingkar dada 106 cm', 'KYN-DKR-BKB-L',  289000, 5, 2),
  ('dress-katun-rinjani', 'Sage',       '#9DAE9B', 'L',  'Lingkar dada 106 cm', 'KYN-DKR-SGE-L',  289000, 3, 3),
  ('dress-katun-rinjani', 'Pasir',      '#D9C7B0', 'XL', 'Lingkar dada 112 cm', 'KYN-DKR-PSR-XL', 299000, 2, 4),
  -- Ciput Rajut Dasar
  ('ciput-rajut-dasar', 'Krem',  '#E3D6C3', 'All size', null, 'KYN-CRD-KRM', 29000, 40, 1),
  ('ciput-rajut-dasar', 'Hitam', '#2B2B2B', 'All size', null, 'KYN-CRD-HTM', 29000, 55, 2),
  ('ciput-rajut-dasar', 'Mocha', '#8E735E', 'All size', null, 'KYN-CRD-MCH', 29000, 30, 3)
) as v(product_slug, color_name, color_hex, size_name, size_detail, sku, price, stock, sort_order)
join public.products pr on pr.slug = v.product_slug
on conflict (sku) do nothing;
