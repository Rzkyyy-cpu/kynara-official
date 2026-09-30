import Link from "next/link";
import { ArrowRightIcon, PlaceholderFigure } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/ui/ProductCard";
import { getCategories, getLatestProducts } from "@/lib/catalog";
import { categoryHref } from "@/lib/navigation";

// Warna pengganti foto kategori (dari desain beranda) selama foto asli belum diunggah
const CATEGORY_TONES = ["#D9C7B0", "#B9C4B2", "#8E735E", "#D9A48C", "#6B6660", "#9AA9B5"];

function SectionHeader({
  eyebrow,
  title,
  link,
}: {
  eyebrow: string;
  title: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-eyebrow font-semibold text-slate-700 uppercase">{eyebrow}</span>
        <h2 className="font-serif text-section font-medium lg:text-section-lg">{title}</h2>
      </div>
      {link && (
        <Link
          href={link.href}
          className="flex shrink-0 items-center gap-1.5 pb-1 text-sm font-semibold text-slate-700 hover:underline"
        >
          {link.label} <ArrowRightIcon size={16} />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [categories, latest] = await Promise.all([getCategories(), getLatestProducts(8)]);
  // Desain: maksimal 6 kategori tampil di beranda (diatur admin lewat kolom show_on_home)
  const homeCategories = categories.filter((c) => c.show_on_home).slice(0, 6);

  return (
    <div className="flex flex-col gap-16 pb-16 lg:gap-24 lg:pb-24">
      {/* ---------- Hero ---------- */}
      <Container className="grid items-center gap-6 pt-4 lg:grid-cols-2 lg:gap-16 lg:pt-12">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] bg-sky lg:order-2 lg:aspect-[5/4]">
          <PlaceholderFigure className="absolute bottom-0 left-[25%] h-[75%] w-[50%]" />
          <span className="absolute bottom-3 left-3 rounded-full bg-paper/90 px-2.5 py-1 text-[11px] font-semibold">
            Foto kampanye
          </span>
        </div>
        <div className="flex flex-col items-start gap-4 lg:gap-6">
          <span className="text-eyebrow font-semibold text-slate-700 uppercase">Koleksi terbaru</span>
          <h1 className="font-serif text-display font-medium lg:text-display-lg">
            Tenang dipakai,
            <br />
            anggun dilihat.
          </h1>
          <p className="max-w-md text-[15px]/6 text-muted lg:text-base/[26px]">
            Kerudung dan busana muslimah dari bahan pilihan, dijahit rapi untuk menemani harimu dari pagi sampai
            malam.
          </p>
          <Button href="/koleksi" fullWidth className="lg:w-auto">
            Belanja Sekarang
          </Button>
        </div>
      </Container>

      {/* ---------- Kategori ---------- */}
      {homeCategories.length > 0 && (
        <Container as="section" className="flex flex-col gap-6">
          <SectionHeader eyebrow="Kategori" title="Belanja per kategori" link={{ href: "/koleksi", label: "Semua" }} />
          <ul className="grid grid-cols-3 gap-x-3 gap-y-5 lg:grid-cols-6 lg:gap-6">
            {homeCategories.map((c, i) => (
              <li key={c.slug}>
                <Link href={categoryHref(c.slug)} className="group flex flex-col gap-2.5">
                  <div
                    className="relative aspect-[4/5] overflow-hidden rounded-photo"
                    style={{ background: CATEGORY_TONES[i % CATEGORY_TONES.length] }}
                  >
                    <PlaceholderFigure className="absolute bottom-0 left-[20%] h-[70%] w-[60%]" />
                  </div>
                  <span className="flex items-center justify-between text-[13px] font-semibold lg:text-[15px]">
                    {c.name}
                    <ArrowRightIcon size={14} className="hidden transition-transform group-hover:translate-x-0.5 lg:block" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* ---------- Produk terbaru ---------- */}
      <Container as="section" className="flex flex-col gap-6">
        <SectionHeader eyebrow="Baru datang" title="Produk terbaru" link={{ href: "/koleksi", label: "Lihat semua" }} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
          {latest.map((p) => (
            <ProductCard key={p.href} product={p} />
          ))}
        </div>
        <Button href="/koleksi" variant="outline" size="md" className="self-center lg:hidden">
          Lihat semua produk
        </Button>
      </Container>
    </div>
  );
}
