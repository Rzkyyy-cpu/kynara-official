import type { Metadata } from "next";
import Link from "next/link";
import { MaterialGuide } from "@/components/home/MaterialGuide";
import { StaticPage, StaticSection } from "@/components/ui/StaticPage";
import { faqs, measureSteps, orderSteps, sizeGuide } from "@/lib/content";
import { whatsappDisplay, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Panduan belanja — kynara",
  description: "Panduan ukuran, perbandingan bahan kerudung, cara pemesanan, dan pertanyaan umum di kynara.",
};

// Anchor #ukuran, #bahan, #cara-pesan, #faq dipakai link di Footer dan menu bantuan.
const TOC = [
  { id: "ukuran", label: "Panduan ukuran" },
  { id: "bahan", label: "Panduan bahan" },
  { id: "cara-pesan", label: "Cara pemesanan" },
  { id: "faq", label: "Pertanyaan umum" },
];

export default function PanduanPage() {
  return (
    <StaticPage
      eyebrow="Panduan"
      title="Panduan belanja"
      intro="Semua yang perlu kamu tahu sebelum memesan: ukuran, karakter bahan, cara pesan, dan jawaban untuk pertanyaan yang sering muncul."
      wide
    >
      {/* Daftar isi: lompat ke bagian */}
      <nav aria-label="Daftar isi" className="-mt-4 flex flex-wrap gap-2 lg:-mt-8">
        {TOC.map((t) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            className="flex min-h-11 items-center rounded-full border border-line-strong bg-paper px-4 text-sm font-semibold hover:border-slate"
          >
            {t.label}
          </a>
        ))}
      </nav>

      <StaticSection id="ukuran" title="Panduan ukuran" className="max-w-[720px]">
        <p className="text-muted">
          Ukuran di bawah adalah ukuran umum. Ukuran persis setiap produk tertulis di halaman produknya.
        </p>
        <div className="overflow-hidden rounded-2xl border border-line bg-paper">
          <dl>
            {sizeGuide.map((s, i) => (
              <div
                key={s.item}
                className={`grid gap-1 px-5 py-4 lg:grid-cols-[160px_1fr] lg:gap-6 ${i > 0 ? "border-t border-line" : ""}`}
              >
                <dt className="font-semibold">{s.item}</dt>
                <dd className="flex flex-col gap-0.5">
                  <span>{s.size}</span>
                  <span className="text-sm text-muted">{s.note}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <h3 className="mt-2 text-base font-semibold">Cara mengukur</h3>
        <ol>
          {measureSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </StaticSection>

      <StaticSection id="bahan" title="Panduan bahan">
        <p className="max-w-[720px] text-muted">
          Setiap bahan punya karakter sendiri. Bandingkan singkat di sini sebelum memilih.
        </p>
        <MaterialGuide />
      </StaticSection>

      <StaticSection id="cara-pesan" title="Cara pemesanan" className="max-w-[720px]">
        <ol className="!list-none !gap-5 !pl-0">
          {orderSteps.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[36px_1fr] gap-3.5 !pl-0">
              <span className="flex size-9 items-center justify-center rounded-full bg-sky-tint text-sm font-semibold text-slate-700">
                {i + 1}
              </span>
              <div className="flex flex-col gap-0.5 pt-1">
                <span className="font-semibold">{s.title}</span>
                <span className="text-muted">{s.text}</span>
              </div>
            </li>
          ))}
        </ol>
      </StaticSection>

      <StaticSection id="faq" title="Pertanyaan umum" className="max-w-[720px]">
        {/* <details> = buka-tutup bawaan HTML, tanpa JavaScript */}
        <div className="overflow-hidden rounded-2xl border border-line bg-paper">
          {faqs.map((f, i) => (
            <details key={f.q} className={`group ${i > 0 ? "border-t border-line" : ""}`}>
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden="true" className="text-xl text-slate-700 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="px-5 pb-5 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="text-muted">
          Belum terjawab? Tanya langsung lewat{" "}
          <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-700 underline">
            WhatsApp {whatsappDisplay}
          </Link>
          .
        </p>
      </StaticSection>
    </StaticPage>
  );
}
