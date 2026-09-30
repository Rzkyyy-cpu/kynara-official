import type { Metadata } from "next";
import { Highlights } from "@/components/home/Highlights";
import { PlaceholderFigure } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { StaticPage, StaticSection } from "@/components/ui/StaticPage";
import { brandStory } from "@/lib/content";
import { site, whatsappDisplay, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tentang kami — kynara",
  description: "Cerita di balik kynara, toko kerudung dan busana muslimah dengan bahan pilihan dan jahitan rapi.",
};

export default function TentangPage() {
  return (
    <StaticPage
      eyebrow="Tentang kynara"
      title="Dibuat untuk dipakai setiap hari."
      crumb="Tentang kami"
      intro={site.tagline}
    >
      <div className="relative h-[260px] overflow-hidden rounded-2xl bg-pink lg:h-[360px]">
        <PlaceholderFigure className="absolute bottom-0 left-[30%] h-[88%] w-[40%]" />
        <span className="absolute bottom-3 left-3 rounded-full bg-paper/90 px-2.5 py-1 text-[11px] font-semibold">
          Foto brand
        </span>
      </div>

      <StaticSection title="Cerita kami">
        {brandStory.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </StaticSection>

      <section className="flex flex-col gap-6 rounded-2xl bg-sky-tint p-5 lg:p-10">
        <h2 className="font-serif text-2xl font-medium lg:text-[28px]/9">Yang kami jaga di setiap produk</h2>
        <Highlights />
      </section>

      <StaticSection title="Hubungi kami">
        <p>
          Ada pertanyaan soal ukuran, bahan, atau pesanan? Kami senang membantu
          {site.jamLayanan ? ` (${site.jamLayanan})` : ""}.
        </p>
        <Button href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="self-start" size="md">
          Chat WhatsApp {whatsappDisplay}
        </Button>
      </StaticSection>
    </StaticPage>
  );
}
