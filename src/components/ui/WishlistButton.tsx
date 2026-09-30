"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { HeartIcon } from "@/components/icons";

// Tombol hati: menyimpan/menghapus produk dari tabel wishlists.
// Belum login -> diarahkan ke halaman Masuk (lalu kembali ke halaman ini).
// variant "card": pojok kartu produk (area sentuh 44×44, lingkaran putih 34×34)
// variant "detail": tombol bulat 52×52 di samping "Tambah ke Keranjang"
export function WishlistButton({
  productId,
  productName,
  variant = "card",
}: {
  productId: string;
  productName: string;
  variant?: "card" | "detail";
}) {
  const { wishlist, toggleWishlist } = useAuth();
  const saved = wishlist.has(productId);
  const label = saved ? `Hapus ${productName} dari wishlist` : `Simpan ${productName} ke wishlist`;
  const heart = <HeartIcon size={variant === "card" ? 18 : 22} className={saved ? "fill-current text-error" : ""} />;

  if (variant === "detail") {
    return (
      <button
        type="button"
        aria-pressed={saved}
        aria-label={label}
        onClick={() => toggleWishlist(productId)}
        className="flex size-[52px] shrink-0 items-center justify-center rounded-full border border-line-strong bg-paper text-ink"
      >
        {heart}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={label}
      onClick={() => toggleWishlist(productId)}
      className="absolute top-1 right-1 flex size-11 items-center justify-center rounded-full text-ink"
    >
      <span className="flex size-[34px] items-center justify-center rounded-full bg-[rgba(255,253,249,0.92)]">
        {heart}
      </span>
    </button>
  );
}
