import type { Metadata } from "next";
import { AccountTitle } from "@/components/account/AccountHeader";
import { HeartIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductCard } from "@/components/ui/ProductCard";
import { getWishlistProducts } from "@/lib/account";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Wishlist — kynara" };

export default async function WishlistPage() {
  const user = await requireUser("/akun/wishlist");
  const products = await getWishlistProducts(user.id);

  return (
    <>
      <AccountTitle title="Wishlist" />
      {products.length === 0 ? (
        <div className="rounded-2xl border border-line bg-paper">
          <EmptyState
            icon={<HeartIcon size={28} />}
            title="Wishlist masih kosong"
            description="Ketuk ikon hati di produk yang kamu suka, nanti tersimpan di sini."
          >
            <Button href="/koleksi" size="md">
              Lihat Koleksi
            </Button>
          </EmptyState>
        </div>
      ) : (
        <>
          {/* Judul pembaca layar supaya urutan heading tidak loncat dari h1 ke h3 (judul kartu) */}
          <h2 className="sr-only">Produk tersimpan</h2>
          <p className="-mt-2 text-sm text-muted">{products.length} produk tersimpan</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-10">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
