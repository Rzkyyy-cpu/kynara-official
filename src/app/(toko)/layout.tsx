import { AuthProvider } from "@/components/auth/AuthProvider";
import { CartProvider } from "@/components/cart/CartProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getCategories } from "@/lib/catalog";

// Data katalog (kategori, produk, stok) disimpan sementara paling lama 60 detik, lalu diambil ulang.
// Stok yang tampil boleh sedikit terlambat karena saat checkout server selalu mengecek ulang.
export const revalidate = 60;

// Layout halaman toko: navbar, footer, dan bottom nav.
// AuthProvider membaca status login DI BROWSER, supaya halaman katalog tidak perlu membaca cookie
// di server (kalau membaca cookie, halaman tidak bisa di-cache dan jadi lebih lambat).
// CartProvider (di dalamnya) menyimpan isi keranjang untuk badge dan tombol beli.
export default async function TokoLayout({ children }: LayoutProps<"/">) {
  const categories = await getCategories();

  return (
    <AuthProvider>
      <CartProvider>
        {/* pb-16 di HP supaya konten paling bawah tidak tertutup bottom nav */}
        <div className="flex min-h-dvh flex-col pb-16 lg:pb-0">
          <Navbar categories={categories} />
          <main className="flex-1">{children}</main>
          <Footer categories={categories} />
          <BottomNav />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
