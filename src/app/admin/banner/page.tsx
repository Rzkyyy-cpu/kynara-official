import type { Metadata } from "next";
import { BannerManager } from "@/components/admin/BannerManager";
import { ToastProvider } from "@/components/admin/Toast";
import { getAdminBanners, getAdminCategories, getProductLinks } from "@/lib/admin/catalog";

export const metadata: Metadata = { title: "Banner beranda — Admin kynara" };

// Banner beranda (admin-desktop/06)
export default async function AdminBannerPage() {
  const [banners, categories, products] = await Promise.all([getAdminBanners(), getAdminCategories(), getProductLinks()]);
  return (
    <ToastProvider>
      <BannerManager banners={banners} categories={categories} products={products} />
    </ToastProvider>
  );
}
