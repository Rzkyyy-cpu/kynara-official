import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";

// Judul seksi: label kecil kapital (eyebrow) + judul serif, opsional link "Lihat semua" di kanan.
export function SectionHeader({
  eyebrow,
  title,
  link,
  aside,
}: {
  eyebrow: string;
  title: React.ReactNode;
  link?: { href: string; label: string };
  aside?: React.ReactNode; // teks pendamping di kanan (desktop), mis. deskripsi singkat
}) {
  return (
    <div className="flex items-end justify-between gap-4 lg:gap-10">
      <div className="flex flex-col gap-1.5 lg:gap-2.5">
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
      {aside}
    </div>
  );
}
