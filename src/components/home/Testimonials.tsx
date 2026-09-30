import Link from "next/link";
import { StarIcon } from "@/components/icons";
import type { Testimonial } from "@/lib/catalog";

// Kartu testimoni dari ulasan asli. HP: digeser ke samping. Desktop: 4 kolom.
export function Testimonials({ items }: { items: Testimonial[] }) {
  return (
    <ul className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0">
      {items.map((r) => (
        <li key={r.id} className="w-[290px] shrink-0 snap-start lg:w-auto">
          <figure className="flex h-full flex-col gap-3 rounded-2xl border border-line bg-paper p-5 lg:gap-4 lg:p-7">
            <span className="flex gap-0.5 text-star" role="img" aria-label={`${r.rating} dari 5 bintang`}>
              {Array.from({ length: r.rating }, (_, i) => (
                <StarIcon key={i} size={16} />
              ))}
            </span>
            <blockquote className="min-h-[104px] grow font-serif text-[17px]/[26px] italic lg:min-h-0 lg:text-[19px]/[29px]">
              “{r.text}”
            </blockquote>
            <figcaption className="flex flex-col gap-0.5 text-[13px] lg:text-sm">
              <strong className="font-semibold">{r.name}</strong>
              <Link href={r.href} className="text-muted hover:underline">
                {r.product}
              </Link>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
