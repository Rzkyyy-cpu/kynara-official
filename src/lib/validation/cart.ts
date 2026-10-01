import { z } from "zod";
import { paymentChoiceSchema } from "@/lib/komerce-payment/status";
import { MAX_CART_LINES, MAX_QTY } from "@/lib/cart/totals";
import { addressSchema } from "@/lib/validation/account";

// Isi keranjang dari browser hanya berisi id varian + jumlah. Harga tidak pernah diterima dari browser.
export const cartLineSchema = z.object({
  variantId: z.uuid(),
  quantity: z.int().min(0).max(MAX_QTY),
});

export const cartLinesSchema = z.array(cartLineSchema).max(MAX_CART_LINES);

// Alamat checkout: pilih alamat tersimpan, ATAU isi alamat baru (boleh disimpan ke buku alamat).
export const checkoutAddressSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("saved"), addressId: z.uuid("Pilih alamat pengiriman.") }),
  z.object({
    kind: z.literal("new"),
    address: addressSchema.omit({ id: true, isDefault: true }),
    save: z.boolean(),
  }),
]);

export type CheckoutAddressInput = z.input<typeof checkoutAddressSchema>;

export const placeOrderSchema = z.object({
  address: checkoutAddressSchema,
  rateId: z.string().min(1, "Pilih kurir dulu, ya.").max(60),
  expectedTotal: z.int().min(0),
  agree: z.literal(true, "Centang persetujuan dulu, ya."),
  payment: paymentChoiceSchema,
});

export type PlaceOrderInput = z.input<typeof placeOrderSchema>;
