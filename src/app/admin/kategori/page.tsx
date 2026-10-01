import type { Metadata } from "next";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { ToastProvider } from "@/components/admin/Toast";
import { getAdminCategories } from "@/lib/admin/catalog";

export const metadata: Metadata = { title: "Kategori — Admin kynara" };

// Kelola kategori (admin-desktop/05)
export default async function AdminKategoriPage() {
  const categories = await getAdminCategories();
  return (
    <ToastProvider>
      <CategoryManager categories={categories} />
    </ToastProvider>
  );
}
