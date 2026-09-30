import Image from "next/image";
import { PlaceholderFigure } from "@/components/icons";

// Foto kecil produk di keranjang & ringkasan checkout.
// Selama foto asli belum ada, dipakai kotak warna varian + siluet (sama seperti kartu produk).
export function CartThumb({
  imageUrl,
  tone,
  alt,
  className = "",
}: {
  imageUrl: string | null;
  tone: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`relative aspect-[4/5] shrink-0 overflow-hidden rounded-photo ${className}`} style={{ background: tone }}>
      {imageUrl ? (
        <Image src={imageUrl} alt={alt} fill sizes="96px" className="object-cover" />
      ) : (
        <PlaceholderFigure className="absolute bottom-0 left-[18%] h-[80%] w-[64%]" />
      )}
    </div>
  );
}
