import { describe, expect, it } from "vitest";
import { billableKg, mockProvider, zoneOf } from "@/lib/shipping/mock";

const bandung = { province: "Jawa Barat", city: "Kota Bandung", district: "Coblong", postalCode: "40132" };

describe("provider ongkir tiruan", () => {
  it("berat dibulatkan ke atas per kg, minimal 1 kg", () => {
    expect(billableKg(0)).toBe(1);
    expect(billableKg(450)).toBe(1);
    expect(billableKg(1001)).toBe(2);
  });

  it("zona ditentukan dari provinsi", () => {
    expect(zoneOf("Jawa Barat")).toBe(1);
    expect(zoneOf("Bali")).toBe(2);
    expect(zoneOf("Papua")).toBe(3);
  });

  it("tarif Jawa 450 gram sesuai contoh desain, kurir instan tidak tersedia", async () => {
    const rates = await mockProvider.getRates({ destination: bandung, weightGram: 450 });
    const byId = Object.fromEntries(rates.map((r) => [r.id, r]));
    expect(byId["jne:REG"].cost).toBe(12000);
    expect(byId["jnt:EZ"].cost).toBe(13000);
    expect(byId["sicepat:REG"].cost).toBe(11000);
    expect(byId["jne:YES"].cost).toBe(25000);
    expect(byId["instan:INSTANT"].available).toBe(false);
    for (const r of rates) expect(Number.isInteger(r.cost)).toBe(true);
  });

  it("paket lebih berat, ongkir lebih mahal", async () => {
    const [light] = await mockProvider.getRates({ destination: bandung, weightGram: 900 });
    const [heavy] = await mockProvider.getRates({ destination: bandung, weightGram: 2500 });
    expect(heavy.cost).toBe(light.cost * 3);
  });
});
