import { describe, expect, it } from "vitest";
import {
  callbackPaymentId,
  createResponseSchema,
  parseKomerceTime,
  paymentChoiceSchema,
  paymentLabel,
  statusResponseSchema,
  vaExpirySeconds,
} from "./status";

describe("pilihan metode dari browser", () => {
  it("menerima VA dengan kode bank & QRIS", () => {
    expect(paymentChoiceSchema.safeParse({ type: "va", bank: "BCA" }).success).toBe(true);
    expect(paymentChoiceSchema.safeParse({ type: "qris" }).success).toBe(true);
  });
  it("menolak metode/bank aneh", () => {
    expect(paymentChoiceSchema.safeParse({ type: "va" }).success).toBe(false);
    expect(paymentChoiceSchema.safeParse({ type: "va", bank: "bca'; drop" }).success).toBe(false);
    expect(paymentChoiceSchema.safeParse({ type: "ovo" }).success).toBe(false);
  });
});

describe("respons API Komerce (contoh dari dokumentasi)", () => {
  it("create VA", () => {
    const r = createResponseSchema.parse({
      meta: { code: 200 },
      data: {
        payment_id: "KOMPAY-1699012345-A1B2C3",
        payment_url: "https://pay.komerce.id/p/abc123token",
        va_number: "8808123456789",
        bank_code: "BCA",
        amount: 100000,
        status: "PENDING",
        expired_at: "2025-11-04T14:30:00Z",
      },
    });
    expect(r.data.va_number).toBe("8808123456789");
  });

  it("status PAID", () => {
    const r = statusResponseSchema.parse({
      data: { payment_id: "KPAY-7a55/KM/2026", amount: 100000, status: "PAID", paid_at: "2026-01-13 09:13:23" },
    });
    expect(parseKomerceTime(r.data.paid_at)).toBe("2026-01-13T02:13:23.000Z");
  });

  it("menolak status yang tidak dikenal", () => {
    expect(statusResponseSchema.safeParse({ data: { payment_id: "x", amount: 1, status: "LUNAS" } }).success).toBe(false);
  });
});

describe("callback", () => {
  it("mengambil payment_id di atas atau di dalam data", () => {
    expect(callbackPaymentId({ payment_id: "KOMPAY-1", status: "PAID" })).toBe("KOMPAY-1");
    expect(callbackPaymentId({ data: { payment_id: "KOMPAY-2" } })).toBe("KOMPAY-2");
    expect(callbackPaymentId({ halo: 1 })).toBeNull();
    expect(callbackPaymentId("teks")).toBeNull();
  });
});

describe("waktu & label", () => {
  it("membaca waktu ISO dan waktu WIB tanpa zona", () => {
    expect(parseKomerceTime("2025-11-04T14:30:00Z")).toBe("2025-11-04T14:30:00.000Z");
    expect(parseKomerceTime("2026-01-13 10:13:15")).toBe("2026-01-13T03:13:15.000Z");
    expect(parseKomerceTime("kemarin")).toBeNull();
    expect(parseKomerceTime("")).toBeNull();
  });

  it("nama metode", () => {
    expect(paymentLabel("va", "BCA")).toBe("BCA Virtual Account");
    expect(paymentLabel("qris", null)).toBe("QRIS");
    expect(paymentLabel("va", "MANDIRI")).toBe("Mandiri Virtual Account");
    expect(paymentLabel("va", "CIMB")).toBe("CIMB Virtual Account");
    expect(paymentLabel("va", "SAHABAT_SAMPOERNA")).toBe("Sahabat Sampoerna Virtual Account");
  });
});

describe("masa berlaku VA", () => {
  const now = Date.parse("2026-10-01T00:00:00Z");
  it("disamakan dengan sisa batas bayar pesanan", () => {
    expect(vaExpirySeconds("2026-10-02T00:00:00Z", now)).toBe(86_400);
  });
  it("tidak bisa kalau sisa waktu kurang dari 1 jam (minimal Komerce)", () => {
    expect(vaExpirySeconds("2026-10-01T00:59:59Z", now)).toBeNull();
    expect(vaExpirySeconds("2026-10-01T01:00:00Z", now)).toBe(3600);
  });
});
