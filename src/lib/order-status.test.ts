import { describe, expect, it } from "vitest";
import { orderTimeline, paymentIssue } from "./order-status";

const created = "2026-09-28T07:20:00.000Z"; // 14.20 WIB
const base = { created_at: created, paid_at: null, tracking_number: null, history: [] };

describe("timeline status pesanan", () => {
  it("menunggu pembayaran: langkah 1 aktif, sisanya menunggu", () => {
    const steps = orderTimeline({ ...base, status: "menunggu_pembayaran" });
    expect(steps.map((s) => s.state)).toEqual(["current", "todo", "todo", "todo"]);
    expect(steps[0].time).toBe("28 Sep 2026, 14.20");
    expect(steps[1].time).toBe("Menunggu");
    expect(steps[3].time).toBe("Konfirmasi setelah paket diterima");
  });

  it("diproses: langkah 1 selesai, waktu bayar tampil", () => {
    const steps = orderTimeline({ ...base, status: "diproses", paid_at: "2026-09-28T07:31:00.000Z" });
    expect(steps.map((s) => s.state)).toEqual(["done", "current", "todo", "todo"]);
    expect(steps[1].time).toBe("28 Sep 2026, 14.31 · Pembayaran diterima");
  });

  it("selesai: semua langkah selesai", () => {
    const steps = orderTimeline({ ...base, status: "selesai", paid_at: created, tracking_number: "JNE01" });
    expect(steps.every((s) => s.state === "done")).toBe(true);
    expect(steps[2].time).toContain("Resi JNE01");
  });

  it("kedaluwarsa: dua langkah, langkah terakhir ditandai gagal", () => {
    const steps = orderTimeline({
      ...base,
      status: "kedaluwarsa",
      history: [
        { status: "menunggu_pembayaran", note: null, created_at: created },
        { status: "kedaluwarsa", note: null, created_at: "2026-09-29T07:30:00.000Z" },
      ],
    });
    expect(steps).toHaveLength(2);
    expect(steps[1]).toMatchObject({ label: "Kedaluwarsa", failed: true, time: "29 Sep 2026, 14.30" });
  });

  it("mendeteksi pembayaran terlambat & ganda", () => {
    expect(paymentIssue([{ status: "kedaluwarsa", note: "PEMBAYARAN_TERLAMBAT", created_at: created }])).toBe("late");
    expect(paymentIssue([{ status: "diproses", note: "PEMBAYARAN_GANDA", created_at: created }])).toBe("duplicate");
    expect(paymentIssue([])).toBeNull();
  });

  it("refund & masalah yang sudah ditangani admin", () => {
    const refund = { status: "dibatalkan", note: "PERLU_REFUND", created_at: created };
    const resolved = { status: "dibatalkan", note: "MASALAH_BAYAR_DITANGANI", created_at: created };
    expect(paymentIssue([refund])).toBe("refund");
    expect(paymentIssue([refund, resolved])).toBeNull();
    // Masalah baru setelah ditangani tetap muncul
    expect(paymentIssue([refund, resolved, { status: "dibatalkan", note: "PEMBAYARAN_GANDA", created_at: created }])).toBe("duplicate");
  });

  it("dibatalkan admin: waktu batal tetap tampil di timeline", () => {
    const steps = orderTimeline({
      ...base,
      status: "dibatalkan",
      history: [
        { status: "menunggu_pembayaran", note: null, created_at: created },
        { status: "dibatalkan", note: "DIBATALKAN_ADMIN", created_at: "2026-09-29T07:30:00.000Z" },
        { status: "dibatalkan", note: "MASALAH_BAYAR_DITANGANI", created_at: "2026-09-30T07:30:00.000Z" },
      ],
    });
    expect(steps[1].time).toBe("29 Sep 2026, 14.30");
  });
});
