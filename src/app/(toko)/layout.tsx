import { AuthProvider } from "@/components/auth/AuthProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getCategories } from "@/lib/catalog";
import { DEMO_CART_COUNT } from "@/lib/navigation";

// Data katalog (kategori, produk, stok) disimpan sementara paling lama 60 detik, lalu diambil ulang.
// Stok yang tampil boleh sedikit terlambat karena saat checkout server selalu mengecek ulang (Fase 4).
export const revalidate = 60;

// Layout halaman toko: navbar, footer, dan bottom nav.
// AuthProvider membaca status login DI BROWSER, supaya halaman katalog tidak perlu membaca cookie
// di server (kalau membaca cookie, halaman tidak bisa di-cache dan jadi lebih lambat).
export default async function TokoLayout({ children }: LayoutProps<"/">) {
  const categories = await getCategories();

  return (
    <AuthProvider>
      {/* pb-16 di HP supaya konten paling bawah tidak tertutup bottom nav */}
      <div className="flex min-h-dvh flex-col pb-16 lg:pb-0">
        <Navbar cartCount={DEMO_CART_COUNT} categories={categories} />
        <main className="flex-1">{children}</main>
        <Footer categories={categories} />
        <BottomNav cartCount={DEMO_CART_COUNT} />
      </div>
    </AuthProvider>
  );
}
