import { describe, expect, it } from "vitest";
import { billableKg, flatCost, flatProvider, zoneOf } from "@/lib/shipping/flat";

const tujuan = (province: string) => ({ province, city: "-", district: "-", postalCode: "00000" });

describe("tarif flat cadangan", () => {
  it("berat dibulatkan ke atas per kg, minimal 1 kg", () => {
    expect(billableKg(0)).toBe(1);
    expect(billableKg(450)).toBe(1);
    expect(billableKg(1001)).toBe(2);
  });

  it("zona ditentukan dari provinsi", () => {
    expect(zoneOf("Jawa Barat")).toBe(1);
    expect(zoneOf("Bali")).toBe(2);
    expect(zoneOf("Sumatera Selatan")).toBe(2);
    expect(zoneOf("Papua")).toBe(3);
  });

  it("Jawa Rp5.000/kg, maksimal Rp10.000", () => {
    expect(flatCost("Jawa Barat", 550)).toBe(5_000);
    expect(flatCost("Jawa Timur", 1_500)).toBe(10_000);
    expect(flatCost("Banten", 7_000)).toBe(10_000);
  });

  it("Bali & Sumatera bagian selatan Rp10.000/kg, maksimal Rp20.000", () => {
    expect(flatCost("Bali", 900)).toBe(10_000);
    expect(flatCost("Lampung", 4_000)).toBe(20_000);
  });

  it("provinsi lain tarif tetap Rp40.000", () => {
    expect(flatCost("Papua", 200)).toBe(40_000);
    expect(flatCost("Aceh", 5_000)).toBe(40_000);
  });

  it("menghasilkan satu pilihan reguler yang bisa dipilih", async () => {
    const rates = await flatProvider.getRates({ destination: tujuan("Jawa Tengah"), weightGram: 300 });
    expect(rates).toHaveLength(1);
    expect(rates[0]).toMatchObject({ id: "flat:REG", cost: 5_000, available: true });
  });
});
