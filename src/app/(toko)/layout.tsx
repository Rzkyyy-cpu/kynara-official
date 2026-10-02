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
          {/* Skip link: tersembunyi, baru muncul saat ditekan Tab pertama kali. Pengguna keyboard &
              pembaca layar bisa langsung lompat ke isi halaman tanpa melewati semua menu navbar. */}
          <a
            href="#konten"
            className="sr-only z-50 rounded-full bg-ink text-sm font-semibold text-bg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:px-4 focus:py-2.5"
          >
            Langsung ke konten
          </a>
          <Navbar categories={categories} />
          <main id="konten" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <Footer categories={categories} />
          <BottomNav />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
