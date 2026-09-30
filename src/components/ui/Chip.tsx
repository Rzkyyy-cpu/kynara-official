import Link from "next/link";

// Pil pilihan (kategori, bahan, urutan). Terpilih = latar gelap, tidak terpilih = garis tepi.
const cls = (selected: boolean) =>
  `inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm whitespace-nowrap transition-colors ${
    selected ? "border-ink bg-ink text-bg" : "border-line-strong bg-paper text-ink hover:border-ink"
  }`;

export function ChipLink({ href, selected, children }: { href: string; selected: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} aria-current={selected ? "page" : undefined} className={cls(selected)}>
      {children}
    </Link>
  );
}

export function ChipButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" aria-pressed={selected} onClick={onClick} className={cls(selected)}>
      {children}
    </button>
  );
}
