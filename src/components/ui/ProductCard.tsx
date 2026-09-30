import Image from "next/image";
import Link from "next/link";
import { PlaceholderFigure } from "@/components/icons";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { formatRupiah } from "@/lib/format";

// Kartu produk sesuai design-handoff/source/_komponen/kartu-produk.html.

export type ProductCardData = {
  id: string; // id produk, dipakai tombol wishlist
  href: string;
  name: string;
  price: number;
  material: string; // badge bahan, contoh "Airflow"
  tag?: "Baru" | "Stok terbatas";
  colors: { name: string; hex: string }[];
  imageUrl?: string;
  tone?: string; // warna latar pengganti foto selama foto asli belum ada
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const { id, href, name, price, material, tag, colors, imageUrl, tone = "#D9C7B0" } = product;

  return (
    <article className="relative flex flex-col gap-2.5">
      <Link href={href} className="flex flex-col gap-2.5 text-ink">
        {/* Foto 4:5 dengan sudut 10px */}
        <div
          className="relative aspect-[4/5] overflow-hidden rounded-photo"
          style={{ background: tone }}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover"
            />
          ) : (
            <PlaceholderFigure className="absolute bottom-0 left-[18%] h-[80%] w-[64%]" />
          )}
          {tag && (
            <span className="absolute top-2 left-2 inline-flex h-6 items-center rounded-full bg-white px-2.5 text-[11px] font-semibold tracking-[0.02em]">
              {tag}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="inline-flex h-[22px] items-center self-start rounded-full bg-sky-tint px-[9px] text-[11px] font-semibold tracking-[0.02em] text-slate-900">
            {material}
          </span>
          {/* Nama maksimal 2 baris; tinggi minimum 2 baris supaya harga di semua kartu sejajar */}
          <h3 className="line-clamp-2 min-h-10 text-sm/5 font-medium lg:min-h-11 lg:text-[15px]/[22px]">
            {name}
          </h3>
          <span className="text-[15px] font-bold">{formatRupiah(price)}</span>
        </div>
      </Link>

      {colors.length > 0 && (
        <ul className="flex items-center gap-1.5" aria-label="Warna tersedia">
          {colors.map((c) => (
            <li
              key={c.hex}
              title={c.name}
              className="size-3.5 rounded-full border border-ink/20"
              style={{ background: c.hex }}
            >
              <span className="sr-only">{c.name}</span>
            </li>
          ))}
        </ul>
      )}

      <WishlistButton productId={id} productName={name} />
    </article>
  );
}
