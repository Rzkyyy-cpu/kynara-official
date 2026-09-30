import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Keranjang — kynara" };

// Isi keranjang disimpan di browser (tamu) atau di database (user login),
// jadi halaman ini dirender di browser oleh CartView.
export default function KeranjangPage() {
  return <CartView />;
}
