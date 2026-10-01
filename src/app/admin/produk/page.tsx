import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FilterBar } from "@/components/admin/FilterBar";
import { ProductActiveSwitch, ProductRowActions } from "@/components/admin/ProductRowActions";
import { ToastProvider } from "@/components/admin/Toast";
import { PageHeader, PageLink, cardCls, tdCls, thCls } from "@/components/admin/ui";
import { PlusIcon } from "@/components/icons";
import { PRODUCTS_PER_PAGE, countProductTabs, getAdminCategories, getMaterials, listAdminProducts } from "@/lib/admin/catalog";
import { formatRupiah } from "@/lib/format";
import { PRODUCT_TABS, type ProductFilters, type ProductTab, productFiltersSchema } from "@/lib/validation/admin-catalog";

export const metadata: Metadata = { title: "Produk — Admin kynara" };

function hrefWith(f: ProductFilters, patch: Partial<ProductFilters>) {
  const next = { ...f, ...patch };
  const p = new URLSearchParams();
  if (next.tab !== "semua") p.set("tab", next.tab);
  if (next.q) p.set("q", next.q);
  if (next.kategori) p.set("kategori", next.kategori);
  if (next.bahan) p.set("bahan", next.bahan);
  if (next.hal > 1) p.set("hal", String(next.hal));
  const qs = p.toString();
  return qs ? `/admin/produk?${qs}` : "/admin/produk";
}

// "PAS-AIR-SEK-SAG-STA" -> "PAS-AIR-SEK" (kode produk tanpa warna & ukuran)
const skuBase = (skus: string) => {
  const first = skus.split(" ")[0] ?? "";
  const parts = first.split("-");
  return parts.length > 3 ? parts.slice(0, -2).join("-") : first;
};

// Daftar produk (admin-desktop/03)
export default async function AdminProdukPage({ searchParams }: PageProps<"/admin/produk">) {
  const f = productFiltersSchema.parse(await searchParams);
  const [{ rows, total }, counts, categories, materials] = await Promise.all([
    listAdminProducts(f),
    countProductTabs({ ...f, q: "", kategori: "", bahan: "" }),
    getAdminCategories(),
    getMaterials(),
  ]);
  const first = total === 0 ? 0 : (f.hal - 1) * PRODUCTS_PER_PAGE + 1;
  const last = Math.min(f.hal * PRODUCTS_PER_PAGE, total);
  const activeCategories = categories.filter((c) => c.product_count > 0).length;

  return (
    <ToastProvider>
      <PageHeader
        title="Produk"
        subtitle={`${counts.semua} produk · ${activeCategories} kategori terisi`}
        action={
          <Link
            href="/admin/produk/baru"
            className="inline-flex h-10 items-center gap-2 self-start rounded-full bg-slate-600 px-4 text-sm font-semibold text-white hover:bg-slate-700"
          >
            <PlusIcon size={16} /> Tambah Produk
          </Link>
        }
      />

      <nav aria-label="Filter produk" className="-mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 [scrollbar-width:none] lg:mx-0 lg:px-0">
        {(Object.keys(PRODUCT_TABS) as ProductTab[]).map((tab) => {
          const active = tab === f.tab;
          return (
            <Link
              key={tab}
              href={hrefWith(f, { tab, hal: 1 })}
              aria-current={active ? "page" : undefined}
              className={`flex h-11 shrink-0 items-center px-3.5 text-sm font-semibold whitespace-nowrap ${
                active ? "text-ink shadow-[inset_0_-2px_0_var(--color-slate-700)]" : "text-muted hover:text-ink"
              }`}
            >
              {PRODUCT_TABS[tab]} ({counts[tab]})
            </Link>
          );
        })}
      </nav>

      <FilterBar
        q={f.q}
        placeholder="Cari nama produk atau SKU"
        selects={[
          { name: "kategori", label: "Kategori", value: f.kategori, options: [["", "Semua kategori"], ...categories.map((c): [string, string] => [c.id, c.name])] },
          { name: "bahan", label: "Bahan", value: f.bahan, options: [["", "Semua bahan"], ...materials.map((m): [string, string] => [m, m])] },
        ]}
        summary={`${total} produk`}
      />

      <div className={`${cardCls} overflow-hidden`}>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-[13px]">
            <thead className="bg-admin-thead">
              <tr className="border-b border-line">
                <th className={`${thCls} w-[76px] pl-4`}>Foto</th>
                <th className={thCls}>Produk</th>
                <th className={thCls}>Kategori</th>
                <th className={thCls}>Bahan</th>
                <th className={thCls}>Harga</th>
                <th className={thCls}>Stok</th>
                <th className={thCls}>Varian</th>
                <th className={thCls}>Tampil</th>
                <th className={`${thCls} w-[90px]`}>
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted">
                    {f.q || f.kategori || f.bahan || f.tab !== "semua" ? "Tidak ada produk yang cocok dengan filter ini." : "Belum ada produk."}
                  </td>
                </tr>
              )}
              {rows.map((p) => {
                const name = p.name ?? "";
                const sizes = (p.sizes ?? []).filter((s) => s !== "All size");
                return (
                  <tr key={p.id} className="border-b border-line-soft last:border-0">
                    <td className={`${tdCls} pl-4`}>
                      <span className="relative block aspect-[4/5] w-11 overflow-hidden rounded-md bg-line">
                        {p.cover_url && <Image src={p.cover_url} alt="" fill sizes="44px" className="object-cover" />}
                      </span>
                    </td>
                    <td className={tdCls}>
                      <Link href={`/admin/produk/${p.id}`} className="font-bold hover:underline">
                        {name}
                      </Link>
                      {p.skus && <div className="text-xs text-muted">SKU {skuBase(p.skus)}</div>}
                    </td>
                    <td className={tdCls}>{p.category_name}</td>
                    <td className={tdCls}>
                      <span className="inline-flex h-[22px] items-center rounded-full bg-sky-tint px-2 text-[11px] font-bold text-slate-900">{p.material}</span>
                    </td>
                    <td className={`${tdCls} font-semibold whitespace-nowrap`}>{p.min_price ? formatRupiah(p.min_price) : "—"}</td>
                    <td className={tdCls}>
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="font-semibold">{p.total_stock} pcs</span>
                        {p.total_stock === 0 ? (
                          <span className="inline-flex h-[22px] items-center rounded-full bg-status-selesai-bg px-2 text-[11px] font-bold text-status-selesai">Habis</span>
                        ) : (
                          (p.low_variant_count ?? 0) > 0 && (
                            <span className="inline-flex h-[22px] items-center rounded-full bg-blush px-2 text-[11px] font-bold text-stock-critical">Menipis</span>
                          )
                        )}
                      </div>
                    </td>
                    <td className={`${tdCls} text-muted`}>
                      {p.color_count} warna{sizes.length > 0 && ` · ${sizes.length > 3 ? `${sizes.length} ukuran` : sizes.join("/")}`}
                    </td>
                    <td className={tdCls}>
                      <ProductActiveSwitch id={p.id!} name={name} active={Boolean(p.is_active)} />
                    </td>
                    <td className={tdCls}>
                      <ProductRowActions id={p.id!} name={name} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-t border-line-soft px-4 py-2 text-[13px]">
          <span className="text-muted">{total === 0 ? "Tidak ada produk" : `Menampilkan ${first}–${last} dari ${total}`}</span>
          <div className="flex gap-1.5">
            <PageLink href={f.hal > 1 ? hrefWith(f, { hal: f.hal - 1 }) : null}>Sebelumnya</PageLink>
            <PageLink href={last < total ? hrefWith(f, { hal: f.hal + 1 }) : null}>Berikutnya</PageLink>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
