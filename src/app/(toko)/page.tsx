import Image from "next/image";
import Link from "next/link";
import { AboutSection } from "@/components/home/AboutSection";
import { MaterialGuide } from "@/components/home/MaterialGuide";
import { SectionHeader } from "@/components/home/SectionHeader";
import { Testimonials } from "@/components/home/Testimonials";
import { ArrowRightIcon, PlaceholderFigure } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/ui/ProductCard";
import { getCategories, getHeroBanner, getLatestProducts, getTestimonials } from "@/lib/catalog";
import { categoryHref } from "@/lib/navigation";

// Warna pengganti foto kategori (dari desain beranda) selama foto asli belum diunggah lewat admin
const CATEGORY_TONES = ["#D9C7B0", "#B9C4B2", "#8E735E", "#D9A48C", "#6B6660", "#9AA9B5"];

export default async function HomePage() {
  const [categories, latest, testimonials, banner] = await Promise.all([
    getCategories(),
    getLatestProducts(8),
    getTestimonials(4),
    getHeroBanner(),
  ]);
  // Desain: maksimal 6 kategori tampil di beranda (diatur admin lewat kolom show_on_home)
  const homeCategories = categories.filter((c) => c.show_on_home).slice(0, 6);

  return (
    <div className="flex flex-col gap-16 pb-16 lg:gap-24 lg:pb-24">
      {/* ---------- Hero ----------
          Isi dari banner aktif paling atas (admin > Banner beranda). Tanpa banner: teks bawaan.
          Banner dengan gambar desktop tampil lebar penuh di desktop; di HP tetap foto 4:5 + teks di bawahnya. */}
      {banner?.image_desktop_url && (
        <Container className="hidden pt-12 lg:block">
          <div className="relative aspect-[9/4] overflow-hidden rounded-[16px] bg-slate-600">
            <Image src={banner.image_desktop_url} alt="" fill priority sizes="(min-width: 1440px) 1280px, 90vw" className="object-cover" />
            <div className="absolute inset-0 bg-linear-to-r from-ink/55 via-ink/20 to-transparent" />
            <div className="absolute inset-y-0 left-0 flex max-w-2xl flex-col items-start justify-center gap-6 p-16 text-white">
              <h1 className="font-serif text-display-lg font-medium [text-shadow:0_1px_12px_rgba(0,0,0,0.25)]">{banner.title}</h1>
              {banner.subtitle && <p className="max-w-md text-base/[26px]">{banner.subtitle}</p>}
              <Button href={banner.cta_href}>{banner.cta_text}</Button>
            </div>
          </div>
        </Container>
      )}
      <Container className={`grid items-center gap-6 pt-4 lg:grid-cols-2 lg:gap-16 lg:pt-12 ${banner?.image_desktop_url ? "lg:hidden" : ""}`}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] bg-sky lg:order-2 lg:aspect-[5/4]">
          {banner?.image_mobile_url || banner?.image_desktop_url ? (
            <>
              {banner.image_mobile_url && (
                <Image src={banner.image_mobile_url} alt="" fill priority sizes="100vw" className="object-cover lg:hidden" />
              )}
              {banner.image_desktop_url && (
                <Image
                  src={banner.image_desktop_url}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className={`object-cover ${banner.image_mobile_url ? "hidden lg:block" : ""}`}
                />
              )}
            </>
          ) : (
            <>
              <PlaceholderFigure className="absolute bottom-0 left-[25%] h-[75%] w-[50%]" />
              <span className="absolute bottom-3 left-3 rounded-full bg-paper/90 px-2.5 py-1 text-[11px] font-semibold">
                Foto kampanye
              </span>
            </>
          )}
        </div>
        <div className="flex flex-col items-start gap-4 lg:gap-6">
          <span className="text-eyebrow font-semibold text-slate-700 uppercase">Koleksi terbaru</span>
          <h1 className="font-serif text-display font-medium lg:text-display-lg">
            {banner ? (
              banner.title
            ) : (
              <>
                Tenang dipakai,
                <br />
                anggun dilihat.
              </>
            )}
          </h1>
          {(!banner || banner.subtitle) && (
            <p className="max-w-md text-[15px]/6 text-muted lg:text-base/[26px]">
              {banner
                ? banner.subtitle
                : "Kerudung dan busana muslimah dari bahan pilihan, dijahit rapi untuk menemani harimu dari pagi sampai malam."}
            </p>
          )}
          <Button href={banner?.cta_href ?? "/koleksi"} fullWidth className="lg:w-auto">
            {banner?.cta_text ?? "Belanja Sekarang"}
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
                    {c.image_url ? (
                      <Image src={c.image_url} alt="" fill sizes="(min-width: 1024px) 200px, 33vw" className="object-cover" />
                    ) : (
                      <PlaceholderFigure className="absolute bottom-0 left-[20%] h-[70%] w-[60%]" />
                    )}
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

      {/* ---------- Tentang kynara ---------- */}
      <AboutSection />

      {/* ---------- Panduan bahan ---------- */}
      <Container as="section" className="flex flex-col gap-5 lg:gap-8">
        <SectionHeader
          eyebrow="Panduan bahan"
          title={
            <>
              <span className="lg:hidden">Pilih bahan yang pas</span>
              <span className="hidden lg:inline">Pilih bahan sesuai kebutuhanmu</span>
            </>
          }
          aside={
            <p className="hidden max-w-[380px] text-[15px]/6 text-muted lg:block">
              Setiap bahan punya karakter sendiri. Bandingkan singkat di sini sebelum memilih.
            </p>
          }
        />
        <p className="-mt-3 text-sm/[22px] text-muted lg:hidden">Geser untuk membandingkan karakter tiap bahan.</p>
        <MaterialGuide />
      </Container>

      {/* ---------- Testimoni (hanya tampil kalau sudah ada ulasan asli) ---------- */}
      {testimonials.length > 0 && (
        <Container as="section" className="flex flex-col gap-5 lg:gap-8">
          <SectionHeader
            eyebrow="Testimoni"
            title={
              <>
                Kata mereka<span className="hidden lg:inline"> yang sudah memakai</span>
              </>
            }
          />
          <Testimonials items={testimonials} />
        </Container>
      )}
    </div>
  );
}
