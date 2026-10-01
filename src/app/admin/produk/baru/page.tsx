import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/ProductForm";
import { ToastProvider } from "@/components/admin/Toast";
import { getAdminCategories, getMaterials } from "@/lib/admin/catalog";

export const metadata: Metadata = { title: "Tambah produk — Admin kynara" };

export default async function AdminProdukBaruPage() {
  const [categories, materials] = await Promise.all([getAdminCategories(), getMaterials()]);
  return (
    <ToastProvider>
      <ProductForm product={null} categories={categories} materials={materials} />
    </ToastProvider>
  );
}
