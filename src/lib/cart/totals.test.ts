import { describe, expect, it } from "vitest";
import { MAX_QTY, calcTotals, clampQuantity, mergeCartLines, reconcileStock } from "@/lib/cart/totals";

describe("calcTotals", () => {
  // Contoh dari desain keranjang: 79.000 + 89.000 + 2 × 29.000 = 226.000, ongkir JNE REG 12.000
  const lines = [
    { price: 79000, quantity: 1, weightGram: 130 },
    { price: 89000, quantity: 1, weightGram: 110 },
    { price: 29000, quantity: 2, weightGram: 60 },
  ];

  it("menghitung subtotal, berat, jumlah pcs, dan total", () => {
    expect(calcTotals(lines, 12000)).toEqual({
      itemCount: 4,
      subtotal: 226000,
      weightGram: 360,
      shippingCost: 12000,
      total: 238000,
    });
  });

  it("keranjang kosong bernilai 0", () => {
    expect(calcTotals([])).toEqual({ itemCount: 0, subtotal: 0, weightGram: 0, shippingCost: 0, total: 0 });
  });

  it("menolak harga, jumlah, dan ongkir yang tidak valid", () => {
    expect(() => calcTotals([{ price: 0, quantity: 1, weightGram: 0 }])).toThrow();
    expect(() => calcTotals([{ price: 1000.5, quantity: 1, weightGram: 0 }])).toThrow();
    expect(() => calcTotals([{ price: 1000, quantity: -1, weightGram: 0 }])).toThrow();
    expect(() => calcTotals(lines, -5000)).toThrow();
  });
});

describe("clampQuantity", () => {
  it("dibatasi stok dan batas maksimal", () => {
    expect(clampQuantity(5, 3)).toBe(3);
    expect(clampQuantity(150, 500)).toBe(MAX_QTY);
    expect(clampQuantity(-2, 10)).toBe(0);
  });
});

describe("mergeCartLines", () => {
  it("varian yang sama dijumlahkan, yang lain digabung", () => {
    const guest = [
      { variantId: "a", quantity: 2 },
      { variantId: "b", quantity: 1 },
    ];
    const db = [
      { variantId: "a", quantity: 1 },
      { variantId: "c", quantity: 4 },
    ];
    expect(mergeCartLines(db, guest)).toEqual([
      { variantId: "a", quantity: 3 },
      { variantId: "c", quantity: 4 },
      { variantId: "b", quantity: 1 },
    ]);
  });

  it("hasil penjumlahan tidak melebihi batas maksimal", () => {
    expect(mergeCartLines([{ variantId: "a", quantity: 90 }], [{ variantId: "a", quantity: 20 }])).toEqual([
      { variantId: "a", quantity: MAX_QTY },
    ]);
  });
});

describe("reconcileStock", () => {
  const stock: Record<string, { stock: number; available: boolean }> = {
    a: { stock: 10, available: true },
    b: { stock: 2, available: true },
    c: { stock: 0, available: true },
    d: { stock: 5, available: false },
  };

  it("mengurangi jumlah yang melebihi stok dan menandai varian yang habis/nonaktif", () => {
    const r = reconcileStock(
      [
        { variantId: "a", quantity: 3 },
        { variantId: "b", quantity: 5 },
        { variantId: "c", quantity: 1 },
        { variantId: "d", quantity: 1 },
        { variantId: "hilang", quantity: 1 },
      ],
      (id) => stock[id],
    );
    expect(r.lines.find((l) => l.variantId === "a")?.quantity).toBe(3);
    expect(r.lines.find((l) => l.variantId === "b")?.quantity).toBe(2);
    expect(r.issues).toEqual([
      { variantId: "b", kind: "reduced", from: 5, to: 2 },
      { variantId: "c", kind: "unavailable" },
      { variantId: "d", kind: "unavailable" },
      { variantId: "hilang", kind: "unavailable" },
    ]);
  });
});
