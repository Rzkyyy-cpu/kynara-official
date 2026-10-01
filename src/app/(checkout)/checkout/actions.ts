"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser, siteOrigin } from "@/lib/auth";
import {
  type AddressSummary,
  addressSummary,
  loadCheckoutCart,
  orderErrorMessage,
  resolveCheckoutAddress,
} from "@/lib/checkout";
import { startPayment } from "@/lib/payments";
import { LIMITS, TOO_MANY, checkRateLimit } from "@/lib/rate-limit";
import { type ShippingRate, ShippingError, findRate, getRates } from "@/lib/shipping";
import { createAdminClient } from "@/lib/supabase/admin";
import { type CheckoutAddressInput, type PlaceOrderInput, placeOrderSchema } from "@/lib/validation/cart";

const NOT_LOGGED_IN = "Sesi login berakhir. Silakan masuk lagi.";
const CART_CHANGED = "Isi keranjang berubah. Cek keranjangmu lagi, ya.";

type Fail = { ok: false; error?: string; fieldErrors?: Record<string, string> };

export type QuoteResult =
  | {
      ok: true;
      address: AddressSummary;
      addressInput: CheckoutAddressInput; // alamat baru yang disimpan berubah jadi { kind: "saved" }
      rates: ShippingRate[];
      weightGram: number;
      subtotal: number;
    }
  | Fail;

// Langkah 1 -> 2: cek alamat, lalu hitung pilihan ongkir dari berat keranjang di database.
export async function quoteShipping(input: CheckoutAddressInput): Promise<QuoteResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: NOT_LOGGED_IN };
  if (!(await checkRateLimit(`ship:${user.id}`, LIMITS.shippingQuote))) return { ok: false, error: TOO_MANY };

  const address = await resolveCheckoutAddress(user.id, input, { allowSave: true });
  if (!address.ok) return address;

  const cart = await loadCheckoutCart(user.id);
  if (cart.items.length === 0 || cart.issues.length > 0) return { ok: false, error: CART_CHANGED };

  try {
    const rates = await getRates({ destination: address.value.destination, weightGram: cart.weightGram });
    if (address.value.savedId) revalidatePath("/akun", "layout"); // alamat baru muncul di buku alamat
    return {
      ok: true,
      address: addressSummary(address.value.snapshot),
      addressInput: address.value.savedId ? { kind: "saved", addressId: address.value.savedId } : input,
      rates,
      weightGram: cart.weightGram,
      subtotal: cart.subtotal,
    };
  } catch (e) {
    console.error("shipping rates:", e);
    return { ok: false, error: e instanceof ShippingError ? e.message : "Ongkos kirim gagal dihitung. Coba lagi sebentar lagi." };
  }
}

// Langkah 3: buat pesanan + VA/QR, lalu arahkan ke halaman pesanan untuk membayar. Semua dihitung ulang di server; dari browser hanya dipakai
// pilihan alamat, id kurir, dan total yang DILIHAT pembeli (untuk memastikan angkanya sama).
export async function placeOrder(input: PlaceOrderInput): Promise<Fail> {
  const user = await getUser();
  if (!user) return { ok: false, error: NOT_LOGGED_IN };

  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data checkout belum lengkap." };
  if (!(await checkRateLimit(`checkout:${user.id}`, LIMITS.checkout))) return { ok: false, error: TOO_MANY };

  const address = await resolveCheckoutAddress(user.id, input.address, { allowSave: false }) // divalidasi ulang di dalam;
  if (!address.ok) return { ok: false, error: address.error ?? "Periksa lagi alamat pengiriman." };

  const cart = await loadCheckoutCart(user.id);
  if (cart.items.length === 0 || cart.issues.length > 0) return { ok: false, error: CART_CHANGED };

  let rate: ShippingRate | null;
  try {
    const rates = await getRates({ destination: address.value.destination, weightGram: cart.weightGram });
    rate = findRate(rates, parsed.data.rateId);
  } catch (e) {
    console.error("shipping rates:", e);
    return { ok: false, error: "Ongkos kirim gagal dihitung. Coba lagi sebentar lagi." };
  }
  if (!rate) return { ok: false, error: "Kurir yang dipilih tidak tersedia. Pilih kurir lain, ya." };

  // Fungsi database create_order hanya bisa dijalankan dengan kunci server (service_role).
  // user.id berasal dari sesi yang sudah dicek getUser(), bukan dari browser.
  const { data, error } = await createAdminClient().rpc("create_order", {
    p_user_id: user.id,
    p_shipping_address: address.value.snapshot,
    p_courier: rate.courier,
    p_courier_service: rate.label,
    p_shipping_cost: rate.cost,
    p_expected_total: parsed.data.expectedTotal,
  });
  if (error) {
    console.error("create_order:", error.message);
    return { ok: false, error: orderErrorMessage(error.message) };
  }

  const order = data as { order_number: string };
  revalidatePath("/akun/pesanan");
  revalidatePath("/", "layout"); // stok di katalog berubah

  // Pesanan sudah tersimpan. Langsung buat VA/QR dengan metode yang dipilih.
  // Kalau gagal (mis. layanan pembayaran gangguan), pembeli bisa mencoba lagi dari halaman pesanan.
  let ready = false;
  try {
    ready = (await startPayment(user, order.order_number, parsed.data.payment, await siteOrigin())).ok;
  } catch (e) {
    console.error("startPayment:", e instanceof Error ? e.message : e);
  }
  redirect(`/akun/pesanan/${order.order_number}?baru=1${ready ? "" : "&bayar=gagal"}`);
}
