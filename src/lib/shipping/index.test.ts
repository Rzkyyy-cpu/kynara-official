import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ShippingRate } from "@/lib/shipping/types";

// Logika pintu ongkir (getRates): provider asli diganti tiruan, supaya tidak menyentuh API maupun database.
vi.mock("server-only", () => ({}));
const realRates = vi.fn<() => Promise<ShippingRate[]>>();
vi.mock("@/lib/shipping/rajaongkir", () => ({ rajaongkirProvider: { name: "rajaongkir", getRates: () => realRates() } }));

const { getRates, findRate, MAX_PARCEL_GRAM, ShippingError } = await import("@/lib/shipping");

const bandung = { province: "Jawa Barat", city: "Kota Bandung", district: "Coblong", postalCode: "40132" };
const jne: ShippingRate = { id: "jne:REG", courier: "jne", service: "REG", label: "JNE Reguler", cost: 9000, etd: { min: 1, max: 2 }, available: true };

describe("getRates", () => {
  beforeEach(() => {
    realRates.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("memakai tarif asli kalau RajaOngkir menjawab", async () => {
    realRates.mockResolvedValue([jne]);
    expect(await getRates({ destination: bandung, weightGram: 400 })).toEqual({ rates: [jne], isFallback: false });
  });

  it("API gagal -> tarif flat", async () => {
    realRates.mockRejectedValue(new Error("HTTP 500"));
    const q = await getRates({ destination: bandung, weightGram: 400 });
    expect(q.isFallback).toBe(true);
    expect(q.rates).toMatchObject([{ id: "flat:REG", cost: 5000 }]);
  });

  it("tidak ada kurir yang melayani -> tarif flat", async () => {
    realRates.mockResolvedValue([]);
    expect((await getRates({ destination: bandung, weightGram: 400 })).isFallback).toBe(true);
  });

  it("paket lebih dari batas berat ditolak dengan pesan untuk pembeli, tanpa memanggil API", async () => {
    await expect(getRates({ destination: bandung, weightGram: MAX_PARCEL_GRAM + 1 })).rejects.toBeInstanceOf(ShippingError);
    expect(realRates).not.toHaveBeenCalled();
  });
});

describe("findRate", () => {
  it("hanya mengambil pilihan yang ada di hitungan server", () => {
    expect(findRate([jne], "jne:REG")).toBe(jne);
    expect(findRate([jne], "jne:YES")).toBeNull();
    expect(findRate([{ ...jne, available: false }], "jne:REG")).toBeNull();
  });
});
