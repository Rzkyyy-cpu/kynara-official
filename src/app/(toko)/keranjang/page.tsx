import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

// Isi keranjang berbeda untuk tiap pengunjung, jadi tidak perlu diindeks mesin pencari.
export const metadata: Metadata = { title: "Keranjang — kynara", robots: { index: false } };

// Isi keranjang disimpan di browser (tamu) atau di database (user login),
// jadi halaman ini dirender di browser oleh CartView.
export default function KeranjangPage() {
  return <CartView />;
}
