import { describe, expect, it } from "vitest";
import { guestCartSchema } from "@/lib/cart/storage";
import { MAX_CART_LINES, MAX_QTY } from "@/lib/cart/totals";
import { cartLinesSchema } from "@/lib/validation/cart";

// Skema keranjang tamu di browser (zod/mini) harus menerima & menolak data yang sama
// dengan skema server (zod lengkap). Kalau salah satunya diubah, tes ini mengingatkan.
const ID = "3f2c1a9e-8b7d-4c6e-9f0a-1b2c3d4e5f60";
const line = (quantity: unknown, variantId: unknown = ID) => ({ variantId, quantity });

const cases: [string, unknown][] = [
  ["keranjang kosong", []],
  ["satu baris normal", [line(2)]],
  ["jumlah 0 (dibuang saat dibaca)", [line(0)]],
  ["jumlah maksimal", [line(MAX_QTY)]],
  ["jumlah lewat batas", [line(MAX_QTY + 1)]],
  ["jumlah minus", [line(-1)]],
  ["jumlah pecahan", [line(1.5)]],
  ["jumlah berupa teks", [line("2")]],
  ["id bukan uuid", [line(1, "varian-1")]],
  ["id kosong", [line(1, "")]],
  ["baris tanpa id", [{ quantity: 1 }]],
  ["bukan array", { variantId: ID, quantity: 1 }],
  ["null", null],
  ["baris maksimal", Array.from({ length: MAX_CART_LINES }, () => line(1))],
  ["baris lewat batas", Array.from({ length: MAX_CART_LINES + 1 }, () => line(1))],
];

describe("guestCartSchema", () => {
  it.each(cases)("sama dengan skema server: %s", (_, input) => {
    expect(guestCartSchema.safeParse(input).success).toBe(cartLinesSchema.safeParse(input).success);
  });

  it("membuang harga yang diselipkan ke localStorage", () => {
    const parsed = guestCartSchema.safeParse([{ variantId: ID, quantity: 1, price: 1 }]);
    expect(parsed.success && parsed.data[0]).toEqual({ variantId: ID, quantity: 1 });
  });
});
