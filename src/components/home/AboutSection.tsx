import Link from "next/link";
import { ArrowRightIcon, PlaceholderFigure } from "@/components/icons";
import { Container } from "@/components/ui/Container";
import { brandStory } from "@/lib/content";
import { Highlights } from "./Highlights";

// Seksi "Tentang kynara" di beranda: foto brand + cerita singkat + 4 keunggulan.
export function AboutSection() {
  return (
    <section id="tentang" className="bg-sky-tint">
      <Container className="grid items-center gap-6 py-12 lg:grid-cols-[5fr_7fr] lg:gap-20 lg:py-24">
        <div className="relative h-[260px] overflow-hidden rounded-2xl bg-pink lg:aspect-[4/5] lg:h-auto">
          <PlaceholderFigure className="absolute bottom-0 left-[30%] h-[88%] w-[40%] lg:left-[22%] lg:h-[84%] lg:w-[56%]" />
        </div>
        <div className="flex flex-col gap-8 lg:gap-10">
          <div className="flex flex-col gap-3 lg:gap-4">
            <span className="text-eyebrow font-semibold text-slate-700 uppercase">Tentang kynara</span>
            <h2 className="font-serif text-section font-medium lg:text-section-lg">Dibuat untuk dipakai setiap hari.</h2>
            <p className="max-w-[620px] text-[15px]/6 text-muted lg:text-[17px]/7">{brandStory.short}</p>
            <Link
              href="/tentang"
              className="flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-slate-700 hover:underline"
            >
              Kenali kami lebih dekat <ArrowRightIcon size={16} />
            </Link>
          </div>
          <Highlights />
        </div>
      </Container>
    </section>
  );
}
