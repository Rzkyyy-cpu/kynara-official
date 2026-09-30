import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { getAddresses } from "@/lib/account";
import { toAddressCard } from "@/lib/address-view";
import { requireUser } from "@/lib/auth";
import { loadCheckoutCart } from "@/lib/checkout";
import { getProvinces } from "@/lib/wilayah";

export const metadata: Metadata = { title: "Checkout — kynara", robots: { index: false } };

// Checkout wajib login (pesanan selalu milik akun). Proxy sudah mengarahkan tamu ke /masuk;
// requireUser di sini adalah lapis kedua.
// Isi keranjang diambil dari DATABASE, bukan dari browser.
export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const [cart, addresses] = await Promise.all([loadCheckoutCart(user.id), getAddresses(user.id)]);

  // Keranjang kosong atau ada stok yang berubah: kembali ke keranjang (di sana peringatannya ditampilkan)
  if (cart.items.length === 0 || cart.issues.length > 0) redirect("/keranjang");

  return (
    <CheckoutFlow
      items={cart.items.map((i) => ({
        variantId: i.variantId,
        productName: i.productName,
        variantText: `${i.colorName} · ${i.sizeDetail ?? i.sizeName}`,
        colorHex: i.colorHex,
        imageUrl: i.imageUrl,
        price: i.price,
        quantity: i.quantity,
      }))}
      subtotal={cart.subtotal}
      addresses={addresses.map(toAddressCard)}
      provinces={getProvinces()}
    />
  );
}
