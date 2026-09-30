import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronDownIcon } from "@/components/icons";
import { ProductView } from "@/components/product/ProductView";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/ui/ProductCard";
import { getProductBySlug, getRelatedProducts, getReviewSummary } from "@/lib/catalog";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/produk/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Produk tidak ditemukan — kynara" };
  return {
    title: `${product.name} — kynara`,
    description: product.description.slice(0, 155),
  };
}

// Bagian yang bisa dibuka-tutup. <details> adalah elemen HTML bawaan, jadi tidak perlu JavaScript.
function Accordion({ title, open, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group border-b border-line">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDownIcon size={18} className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-5 text-sm/6 text-muted">{children}</div>
    </details>
  );
}

export default async function ProductPage({ params }: PageProps<"/produk/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || product.variants.length === 0) notFound(); // tampilkan halaman not-found.tsx

  const [reviews, related] = await Promise.all([
    getReviewSummary(product.id),
    getRelatedProducts(product.id, product.category_id),
  ]);

  // Daftar ukuran unik untuk tabel spesifikasi, contoh "Standar 175 × 75 cm · Jumbo 200 × 75 cm"
  const sizeInfo = [
    ...new Map(product.variants.map((v) => [v.size_name, v.size_detail ? `${v.size_name} ${v.size_detail}` : v.size_name])).values(),
  ].join(" · ");
  const specs = [
    ["Bahan", product.material],
    ["Ukuran", sizeInfo],
    ["Finishing", product.finishing],
    ["Perawatan", product.care],
  ].filter((row): row is [string, string] => !!row[1]);

  return (
    <Container className="flex flex-col gap-10 pt-5 pb-14 lg:gap-20 lg:pt-7 lg:pb-24">
      <div className="flex flex-col gap-5">
        <Breadcrumb
          items={[
            { label: "Beranda", href: "/" },
            product.category
              ? { label: product.category.name, href: `/koleksi?kategori=${product.category.slug}` }
              : { label: "Koleksi", href: "/koleksi" },
            { label: product.name },
          ]}
        />

        <ProductView
          name={product.name}
          material={product.material}
          isNew={product.isNew}
          variants={product.variants}
          images={product.images}
          rating={{ count: reviews.count, average: reviews.average }}
        >
          <div className="mt-2 border-t border-line">
            <Accordion title="Deskripsi" open>
              <p className="mb-4">{product.description}</p>
              <dl className="grid grid-cols-[96px_1fr] gap-x-4 gap-y-2">
                {specs.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt>{k}</dt>
                    <dd className="text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </Accordion>
            <Accordion title="Panduan ukuran">
              <p>
                Ukuran di atas diukur dalam keadaan kain dibentangkan. Toleransi ukuran 1–2 cm karena proses
                produksi. Masih bingung? Tanyakan lewat WhatsApp, kami bantu pilihkan.
              </p>
            </Accordion>
            <Accordion title="Pengiriman & retur">
              <p>
                Pesanan dikirim setiap hari kerja. Tukar atau retur maksimal {site.hariRetur ?? "[X]"} hari setelah
                paket diterima untuk produk cacat atau salah kirim. Sertakan video unboxing.
              </p>
            </Accordion>
          </div>
        </ProductView>
      </div>

      {/* ---------- Ulasan ---------- */}
      <section id="ulasan" aria-labelledby="ulasan-judul" className="flex flex-col gap-5">
        <h2 id="ulasan-judul" className="font-serif text-section font-medium lg:text-section-lg">
          Ulasan pembeli
        </h2>
        {reviews.count === 0 ? (
          <p className="rounded-card border border-line bg-paper px-5 py-6 text-[15px] text-muted">
            Belum ada ulasan untuk produk ini. Ulasan bisa ditulis oleh pembeli setelah pesanannya selesai.
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <span className="font-serif text-5xl">{reviews.average.toFixed(1).replace(".", ",")}</span>
            <span className="text-sm text-muted">Dari {reviews.count} ulasan</span>
          </div>
        )}
      </section>

      {/* ---------- Produk terkait ---------- */}
      {related.length > 0 && (
        <section aria-labelledby="terkait-judul" className="flex flex-col gap-5">
          <h2 id="terkait-judul" className="font-serif text-section font-medium lg:text-section-lg">
            Cocok dipadukan dengan
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
            {related.map((p) => (
              <ProductCard key={p.href} product={p} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
