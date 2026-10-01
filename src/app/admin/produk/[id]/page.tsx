import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ProductForm } from "@/components/admin/ProductForm";
import { ToastProvider } from "@/components/admin/Toast";
import { getAdminCategories, getAdminProduct, getMaterials } from "@/lib/admin/catalog";

export const metadata: Metadata = { title: "Edit produk — Admin kynara" };

export default async function AdminProdukEditPage({ params }: PageProps<"/admin/produk/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [product, categories, materials] = await Promise.all([getAdminProduct(id), getAdminCategories(), getMaterials()]);
  if (!product) notFound();

  return (
    <ToastProvider>
      {/* key: setelah disimpan, updated_at berubah -> form dibuat ulang dengan stok terbaru dari database,
          supaya simpan berikutnya menghitung selisih dari angka yang benar */}
      <ProductForm key={product.updated_at} product={product} categories={categories} materials={materials} />
    </ToastProvider>
  );
}
