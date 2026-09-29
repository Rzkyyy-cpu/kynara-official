"use client";

import { useState } from "react";
import { HeartIcon } from "@/components/icons";

// Tombol hati di pojok kartu produk. Area sentuh 44×44, lingkaran putih 34×34.
// SEMENTARA: hanya menyimpan status di tampilan. Disambungkan ke tabel wishlists di Fase 3.
export function WishlistButton({ productName }: { productName: string }) {
  const [saved, setSaved] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Hapus ${productName} dari wishlist` : `Simpan ${productName} ke wishlist`}
      onClick={() => setSaved((s) => !s)}
      className="absolute top-1 right-1 flex size-11 items-center justify-center rounded-full text-ink"
    >
      <span className="flex size-[34px] items-center justify-center rounded-full bg-[rgba(255,253,249,0.92)]">
        <HeartIcon size={18} className={saved ? "fill-current text-error" : ""} />
      </span>
    </button>
  );
}
