"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProduct, saveProduct } from "@/app/admin/produk/actions";
import { ProductImages } from "@/components/admin/ProductImages";
import { Switch } from "@/components/admin/Switch";
import { useToast } from "@/components/admin/Toast";
import { cardCls } from "@/components/admin/ui";
import { Alert } from "@/components/form/Alert";
import { CloseIcon, TrashIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ui/ProductCard";
import type { AdminProduct } from "@/lib/admin/catalog";
import { formatRupiah } from "@/lib/format";
import { productSchema, suggestSku } from "@/lib/validation/admin-catalog";

// Form tambah/edit produk (admin-desktop/04).
// Varian dibentuk dari daftar Warna × Ukuran: setiap kombinasi jadi satu baris di tabel "Varian & stok".
// Kombinasi yang belum pernah ada dimulai NONAKTIF (tidak ikut disimpan) kecuali warna/ukurannya baru ditambah.

type Color = { name: string; hex: string };
type Size = { name: string; detail: string };
type Row = { id?: string; sku: string; price: string; stock: string; stockBefore: number; active: boolean };

const keyOf = (color: string, size: string) => `${color}|${size}`;
const digits = (v: string) => v.replace(/\D/g, "").slice(0, 9);
const MATERIALS = ["Airflow", "Voal", "Satin", "Ceruty", "Jersey", "Katun", "Linen", "Rayon", "Crinkle"];

const inputCls =
  "h-11 w-full rounded-[10px] border border-line-strong bg-paper px-3 text-sm outline-none placeholder:text-muted focus:border-slate";
const labelCls = "flex justify-between text-[13px] font-semibold";

function initialState(p: AdminProduct | null) {
  const colors: Color[] = [];
  const sizes: Size[] = [];
  const rows: Record<string, Row> = {};
  for (const v of p?.variants ?? []) {
    if (!colors.some((c) => c.name === v.color_name)) colors.push({ name: v.color_name, hex: v.color_hex });
    if (!sizes.some((s) => s.name === v.size_name)) sizes.push({ name: v.size_name, detail: v.size_detail ?? "" });
    rows[keyOf(v.color_name, v.size_name)] = {
      id: v.id,
      sku: v.sku,
      price: String(v.price),
      stock: String(v.stock),
      stockBefore: v.stock,
      active: v.is_active,
    };
  }
  if (sizes.length === 0) sizes.push({ name: "All size", detail: "" });
  const prices = (p?.variants ?? []).map((v) => v.price);
  return { colors, sizes, rows, basePrice: prices.length ? String(Math.min(...prices)) : "" };
}

export function ProductForm({
  product,
  categories,
  materials,
}: {
  product: AdminProduct | null;
  categories: { id: string; name: string }[];
  materials: string[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const init = initialState(product);

  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? "");
  const [material, setMaterial] = useState(product?.material ?? "");
  const [weight, setWeight] = useState(product ? String(product.weight_gram) : "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [finishing, setFinishing] = useState(product?.finishing ?? "");
  const [care, setCare] = useState(product?.care ?? "");
  const [active, setActive] = useState(product?.is_active ?? true);
  const [images, setImages] = useState(product?.images.map((i) => i.url) ?? []);
  const [colors, setColors] = useState(init.colors);
  const [sizes, setSizes] = useState(init.sizes);
  const [rows, setRows] = useState(init.rows);
  const [basePrice, setBasePrice] = useState(init.basePrice);
  const [newColor, setNewColor] = useState({ name: "", hex: "#9DAE9B" });
  const [newSize, setNewSize] = useState({ name: "", detail: "" });

  // Baris untuk satu kombinasi: yang sudah ada, atau bawaan (nonaktif) kalau belum pernah dibuat
  const rowOf = (c: string, s: string): Row =>
    rows[keyOf(c, s)] ?? { sku: suggestSku(name, c, s), price: basePrice, stock: "0", stockBefore: 0, active: false };
  const patchRow = (c: string, s: string, patch: Partial<Row>) =>
    setRows((r) => ({ ...r, [keyOf(c, s)]: { ...rowOf(c, s), ...patch } }));

  // Warna/ukuran baru: semua kombinasinya langsung aktif
  function addColor() {
    const n = newColor.name.trim();
    if (!n || colors.some((c) => c.name.toLowerCase() === n.toLowerCase())) return;
    setColors([...colors, { name: n, hex: newColor.hex }]);
    setRows((r) => ({ ...r, ...Object.fromEntries(sizes.map((s) => [keyOf(n, s.name), { ...rowOf(n, s.name), active: true }])) }));
    setNewColor({ name: "", hex: newColor.hex });
  }
  function addSize() {
    const n = newSize.name.trim();
    if (!n || sizes.some((s) => s.name.toLowerCase() === n.toLowerCase())) return;
    setSizes([...sizes, { name: n, detail: newSize.detail.trim() }]);
    setRows((r) => ({ ...r, ...Object.fromEntries(colors.map((c) => [keyOf(c.name, n), { ...rowOf(c.name, n), active: true }])) }));
    setNewSize({ name: "", detail: "" });
  }
  const hasSaved = (pred: (k: string) => boolean) => Object.entries(rows).some(([k, r]) => r.id && pred(k));
  function removeColor(n: string) {
    if (hasSaved((k) => k.startsWith(`${n}|`)) && !window.confirm(`Hapus warna ${n}? Variannya dihapus (atau dinonaktifkan kalau pernah dipesan) saat disimpan.`)) return;
    setColors(colors.filter((c) => c.name !== n));
  }
  function removeSize(n: string) {
    if (hasSaved((k) => k.endsWith(`|${n}`)) && !window.confirm(`Hapus ukuran ${n}? Variannya dihapus (atau dinonaktifkan kalau pernah dipesan) saat disimpan.`)) return;
    setSizes(sizes.filter((s) => s.name !== n));
  }

  const combos = colors.flatMap((c) => sizes.map((s) => ({ c, s, row: rowOf(c.name, s.name) })));
  // Yang disimpan: varian lama (aktif atau tidak) + kombinasi baru yang aktif
  const toSave = combos.filter(({ row }) => row.id || row.active);
  const activeRows = combos.filter(({ row }) => row.active);
  const totalStock = activeRows.reduce((n, { row }) => n + (Number(row.stock) || 0), 0);
  const minPrice = activeRows.length ? Math.min(...activeRows.map(({ row }) => Number(row.price) || 0)) : 0;

  function submit() {
    setError(null);
    const input = {
      id: product?.id,
      name,
      category_id: categoryId,
      material,
      weight_gram: weight,
      description,
      finishing,
      care,
      is_active: active,
      images: images.map((url) => ({ url, alt: "" })),
      variants: toSave.map(({ c, s, row }) => ({
        id: row.id,
        color_name: c.name,
        color_hex: c.hex,
        size_name: s.name,
        size_detail: s.detail,
        sku: row.sku,
        price: row.price,
        stock: row.stock,
        stock_before: row.id ? row.stockBefore : row.stock,
        is_active: row.active,
      })),
    };
    // Cek cepat di browser (server mengecek ulang dengan skema yang sama)
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (!toSave.some(({ row }) => row.active)) {
      setError("Tambahkan minimal satu varian aktif.");
      return;
    }
    startTransition(async () => {
      const res = await saveProduct(input);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast({ title: `${name} tersimpan` });
      if (product) router.refresh(); // form dimuat ulang dengan stok terbaru (lihat key di halaman)
      else router.replace(`/admin/produk/${res.id}`);
    });
  }

  function remove() {
    if (!product || !window.confirm(`Hapus ${product.name}? Semua varian dan fotonya ikut terhapus.`)) return;
    startTransition(async () => {
      const res = await deleteProduct(product.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast({ title: `${product.name} dihapus` });
      router.replace("/admin/produk");
    });
  }

  const nameTooLong = name.length > 40;

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <nav aria-label="Breadcrumb" className="flex gap-1.5 text-[13px]">
            <Link href="/admin/produk" className="text-slate-700">
              Produk
            </Link>
            <span className="text-muted">/</span>
            <span className="text-muted">{product ? "Edit" : "Tambah"}</span>
          </nav>
          <h1 className="font-serif text-[28px]/9 font-medium lg:text-[32px]/10">{product ? "Edit produk" : "Tambah produk"}</h1>
        </div>
        <div className="flex gap-2.5">
          <Button href="/admin/produk" variant="outline" size="sm" className="border-line-strong">
            Batal
          </Button>
          <Button size="sm" onClick={submit} loading={pending}>
            {product ? "Simpan Perubahan" : "Simpan Produk"}
          </Button>
        </div>
      </header>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          {/* ---------- Informasi produk ---------- */}
          <section className={`${cardCls} flex flex-col gap-4 p-4 lg:p-6`}>
            <h2 className="text-base font-bold">Informasi produk</h2>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nm" className={labelCls}>
                <span>Nama produk</span>
                <span className={`font-medium ${nameTooLong ? "text-error" : "text-muted"}`}>{name.length}/40</span>
              </label>
              <input id="nm" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className={`${inputCls} ${nameTooLong ? "border-error-field" : ""}`} />
              <span className={`text-xs ${nameTooLong ? "text-error" : "text-muted"}`}>
                Maks. 40 karakter supaya muat 2 baris di kartu produk. Pola: Jenis + Bahan + Nama seri.
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ct" className={labelCls}>
                  Kategori
                </label>
                <select id="ct" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bh" className={labelCls}>
                  Bahan (badge)
                </label>
                <input id="bh" list="bahan" value={material} maxLength={30} onChange={(e) => setMaterial(e.target.value)} className={inputCls} />
                <datalist id="bahan">
                  {[...new Set([...materials, ...MATERIALS])].map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="br" className={labelCls}>
                  Berat (gram)
                </label>
                <input id="br" inputMode="numeric" value={weight} onChange={(e) => setWeight(digits(e.target.value))} placeholder="150" className={inputCls} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ds" className={labelCls}>
                <span>Deskripsi singkat</span>
                <span className="font-medium text-muted">{description.length}/300</span>
              </label>
              <textarea
                id="ds"
                value={description}
                maxLength={300}
                rows={3}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputCls} h-24 resize-y py-2.5 leading-[21px]`}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fn" className={labelCls}>
                  <span>Finishing / jahitan</span>
                  <span className="font-normal text-muted">(opsional)</span>
                </label>
                <input id="fn" value={finishing} maxLength={100} onChange={(e) => setFinishing(e.target.value)} placeholder="Jahit tepi neci halus" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pr" className={labelCls}>
                  <span>Perawatan</span>
                  <span className="font-normal text-muted">(opsional)</span>
                </label>
                <input id="pr" value={care} maxLength={100} onChange={(e) => setCare(e.target.value)} placeholder="Cuci tangan, jangan diperas" className={inputCls} />
              </div>
            </div>
          </section>

          {/* ---------- Foto ---------- */}
          <section className={`${cardCls} flex flex-col gap-4 p-4 lg:p-6`}>
            <h2 className="text-base font-bold">Foto produk</h2>
            <ProductImages images={images} onChange={setImages} />
          </section>

          {/* ---------- Varian & stok ---------- */}
          <section className={`${cardCls} flex flex-col gap-4 p-4 lg:p-6`}>
            <h2 className="text-base font-bold">Varian &amp; stok</h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[90px_minmax(0,1fr)] sm:items-start">
              <span className={`${labelCls} sm:pt-2`}>Warna</span>
              <div className="flex flex-wrap items-center gap-2">
                {colors.map((c) => (
                  <span key={c.name} className="inline-flex h-9 items-center gap-2 rounded-full border border-line-strong bg-paper pr-1.5 pl-2.5 text-[13px] font-medium">
                    {/* Titik warna = pemilih warna */}
                    <label className="relative size-4 cursor-pointer overflow-hidden rounded-full border border-ink/15" style={{ background: c.hex }}>
                      <span className="sr-only">Ubah kode warna {c.name}</span>
                      <input
                        type="color"
                        value={c.hex}
                        onChange={(e) => setColors(colors.map((x) => (x.name === c.name ? { ...x, hex: e.target.value.toUpperCase() } : x)))}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </label>
                    {c.name}
                    <button type="button" onClick={() => removeColor(c.name)} aria-label={`Hapus warna ${c.name}`} className="flex size-6 items-center justify-center rounded-full hover:bg-bg">
                      <CloseIcon size={13} />
                    </button>
                  </span>
                ))}
                <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-line-dashed pr-1 pl-2">
                  <input
                    type="color"
                    aria-label="Kode warna baru"
                    value={newColor.hex}
                    onChange={(e) => setNewColor({ ...newColor, hex: e.target.value.toUpperCase() })}
                    className="size-5 cursor-pointer rounded-full border-0 bg-transparent p-0"
                  />
                  <input
                    aria-label="Nama warna baru"
                    placeholder="Warna baru"
                    value={newColor.name}
                    maxLength={30}
                    onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addColor())}
                    className="w-24 bg-transparent text-[13px] outline-none"
                  />
                  <button type="button" onClick={addColor} className="h-7 rounded-full px-2 text-[13px] font-semibold text-slate-700 hover:bg-bg">
                    + Warna
                  </button>
                </span>
              </div>

              <span className={`${labelCls} sm:pt-2`}>Ukuran</span>
              <div className="flex flex-col gap-2">
                {sizes.map((s) => (
                  <div key={s.name} className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-9 items-center gap-1 rounded-full border border-line-strong bg-paper pr-1.5 pl-3 text-[13px] font-medium">
                      {s.name}
                      <button type="button" onClick={() => removeSize(s.name)} aria-label={`Hapus ukuran ${s.name}`} className="flex size-6 items-center justify-center rounded-full hover:bg-bg">
                        <CloseIcon size={13} />
                      </button>
                    </span>
                    <input
                      aria-label={`Detail ukuran ${s.name}`}
                      placeholder="Detail, contoh 175 × 75 cm (opsional)"
                      value={s.detail}
                      maxLength={60}
                      onChange={(e) => setSizes(sizes.map((x) => (x.name === s.name ? { ...x, detail: e.target.value } : x)))}
                      className="h-9 min-w-0 flex-1 rounded-[10px] border border-line-strong bg-paper px-3 text-[13px] outline-none focus:border-slate sm:max-w-72"
                    />
                  </div>
                ))}
                <span className="inline-flex h-9 items-center gap-1.5 self-start rounded-full border border-dashed border-line-dashed pr-1 pl-3">
                  <input
                    aria-label="Nama ukuran baru"
                    placeholder="Ukuran baru"
                    value={newSize.name}
                    maxLength={30}
                    onChange={(e) => setNewSize({ ...newSize, name: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSize())}
                    className="w-24 bg-transparent text-[13px] outline-none"
                  />
                  <button type="button" onClick={addSize} className="h-7 rounded-full px-2 text-[13px] font-semibold text-slate-700 hover:bg-bg">
                    + Ukuran
                  </button>
                </span>
              </div>

              <label htmlFor="hd" className={`${labelCls} sm:pt-2`}>
                Harga dasar
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-40">
                  <span className="pointer-events-none absolute top-[11px] left-3 text-sm text-muted">Rp</span>
                  <input id="hd" inputMode="numeric" value={basePrice} onChange={(e) => setBasePrice(digits(e.target.value))} className={`${inputCls} pl-9`} />
                </div>
                <button
                  type="button"
                  disabled={!basePrice}
                  onClick={() => setRows(Object.fromEntries(combos.map(({ c, s, row }) => [keyOf(c.name, s.name), { ...row, price: basePrice }])))}
                  className="h-9 rounded-full border border-line-strong bg-paper px-3.5 text-[13px] font-semibold disabled:opacity-50"
                >
                  Terapkan ke semua varian
                </button>
              </div>
            </div>

            {combos.length === 0 ? (
              <p className="rounded-input bg-bg px-4 py-6 text-center text-sm text-muted">Tambahkan warna dulu untuk membuat varian.</p>
            ) : (
              <div className="relative overflow-x-auto rounded-input border border-line">
                <table className="w-full min-w-[680px] border-collapse text-[13px]">
                  <thead className="bg-admin-thead">
                    <tr>
                      {["Warna", "Ukuran", "SKU", "Stok", "Harga", "Aktif"].map((h) => (
                        <th key={h} className="h-10 px-2.5 text-left text-[11px] font-bold tracking-[0.08em] text-muted uppercase">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {combos.map(({ c, s, row }) => {
                      const stock = Number(row.stock) || 0;
                      const label = `${c.name} ${s.name}`;
                      return (
                        <tr key={keyOf(c.name, s.name)} className={`border-t border-line-soft ${row.active ? "" : "bg-bg text-muted"}`}>
                          <td className="px-2.5 py-2">
                            <span className="flex items-center gap-2">
                              <span className="size-3.5 shrink-0 rounded-full border border-ink/15" style={{ background: c.hex }} />
                              {c.name}
                            </span>
                          </td>
                          <td className="px-2.5 py-2">{s.name}</td>
                          <td className="px-2.5 py-2">
                            <input
                              aria-label={`SKU ${label}`}
                              value={row.sku}
                              maxLength={40}
                              onChange={(e) => patchRow(c.name, s.name, { sku: e.target.value.toUpperCase() })}
                              className="h-9 w-44 rounded-[10px] border border-line-strong bg-paper px-2.5 text-[12px] text-muted outline-none focus:border-slate"
                            />
                          </td>
                          <td className="px-2.5 py-2">
                            <span className="flex items-center gap-1.5">
                              <input
                                aria-label={`Stok ${label}`}
                                inputMode="numeric"
                                value={row.stock}
                                onChange={(e) => patchRow(c.name, s.name, { stock: digits(e.target.value) })}
                                className={`h-9 w-16 rounded-[10px] border bg-paper px-2.5 outline-none focus:border-slate ${
                                  row.active && stock <= 5 ? "border-upload-error-line" : "border-line-strong"
                                }`}
                              />
                              {row.active && stock === 0 && <span className="text-[11px] font-bold text-muted">Habis</span>}
                              {row.active && stock > 0 && stock <= 5 && <span className="text-[11px] font-bold text-stock-critical">Menipis</span>}
                            </span>
                          </td>
                          <td className="px-2.5 py-2">
                            <div className="relative w-32">
                              <span className="pointer-events-none absolute top-[9px] left-2.5 text-muted">Rp</span>
                              <input
                                aria-label={`Harga ${label}`}
                                inputMode="numeric"
                                value={row.price}
                                onChange={(e) => patchRow(c.name, s.name, { price: digits(e.target.value) })}
                                className="h-9 w-full rounded-[10px] border border-line-strong bg-paper pr-2 pl-8 outline-none focus:border-slate"
                              />
                            </div>
                          </td>
                          <td className="px-2.5 py-2">
                            <Switch checked={row.active} label={`Varian ${label} aktif`} onChange={(next) => patchRow(c.name, s.name, { active: next })} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-muted">
              Total stok: {totalStock} pcs · Varian aktif dengan stok 0 tampil sebagai &quot;Habis&quot; di halaman produk. Varian nonaktif tidak dijual.
              Stok disimpan sebagai selisih, jadi pesanan yang masuk saat kamu mengedit tetap terhitung.
            </p>
          </section>
        </div>

        {/* ---------- Samping: status, pratinjau, hapus ---------- */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-6">
          <section className={`${cardCls} flex flex-col gap-3.5 p-5`}>
            <h2 className="text-base font-bold">Status</h2>
            <div className="flex items-center justify-between text-sm">
              <span>Tampil di toko</span>
              <Switch checked={active} onChange={setActive} label="Tampil di toko" />
            </div>
          </section>

          <section className={`${cardCls} flex flex-col gap-3.5 p-5`}>
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-bold">Pratinjau kartu</h2>
              <span className="text-xs text-muted">Seperti di toko</span>
            </div>
            {/* inert: kartu hanya pratinjau, tidak bisa diklik */}
            <div inert className="w-[220px] self-center">
              <ProductCard
                preview
                product={{
                  id: product?.id ?? "pratinjau",
                  href: "#",
                  name: name || "Nama produk",
                  price: minPrice,
                  material: material || "Bahan",
                  tag: product ? undefined : "Baru",
                  colors: colors.filter((c) => activeRows.some((r) => r.c.name === c.name)),
                  imageUrl: images[0],
                }}
              />
            </div>
            {minPrice > 0 && <p className="text-center text-xs text-muted">Harga di kartu = harga varian aktif termurah ({formatRupiah(minPrice)})</p>}
          </section>

          {product && (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="flex h-11 items-center justify-center gap-2 rounded-full border border-delete-line bg-paper text-sm font-semibold text-error disabled:opacity-50"
            >
              <TrashIcon size={16} /> Hapus produk
            </button>
          )}
        </aside>
      </div>
    </>
  );
}
