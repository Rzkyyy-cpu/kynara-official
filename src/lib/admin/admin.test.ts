import { describe, expect, it } from "vitest";
import { changeLabel, chartScale } from "@/lib/admin/chart";
import { toCsv } from "@/lib/admin/csv";
import { NEXT_STATUS, adminOrderError } from "@/lib/admin/order-rules";
import { formatRupiahShort, waNumber } from "@/lib/format";
import { orderFiltersSchema, periodSchema, updateOrderSchema } from "@/lib/validation/admin";

describe("CSV pesanan", () => {
  it("membungkus teks dengan kutip dan menggandakan kutip di dalamnya", () => {
    const csv = toCsv(["Nama", "Total"], [['Nadia "Nad" A.', 238000]]);
    expect(csv).toBe('﻿"Nama","Total"\r\n"Nadia ""Nad"" A.",238000\r\n');
  });

  it("menjinakkan sel yang bisa dibaca Excel sebagai rumus", () => {
    const csv = toCsv(["Nama"], [['=HYPERLINK("http://jahat")'], ["+62812"], ["-1"], ["@SUM(A1)"]]);
    expect(csv).toContain(`"'=HYPERLINK(""http://jahat"")"`);
    expect(csv).toContain(`"'+62812"`);
    expect(csv).toContain(`"'-1"`);
    expect(csv).toContain(`"'@SUM(A1)"`);
  });

  it("sel kosong tetap punya kolom", () => {
    expect(toCsv(["A", "B"], [[null, "x"]])).toContain('\r\n,"x"\r\n');
  });
});

describe("filter & input admin", () => {
  it("parameter URL tidak dikenal kembali ke nilai bawaan", () => {
    expect(orderFiltersSchema.parse({ status: "hapus-semua", rentang: "999", kurir: "dhl", hal: "-3" })).toEqual({
      status: "semua",
      q: "",
      rentang: "30",
      kurir: "semua",
      hal: 1,
    });
    expect(periodSchema.parse("tahun")).toBe("30");
    expect(periodSchema.parse(["7", "30"])).toBe("7");
  });

  it("pencarian dengan karakter filter PostgREST (koma, kurung, kutip) dibuang", () => {
    expect(orderFiltersSchema.parse({ q: "x,status.eq.selesai" }).q).toBe("");
    expect(orderFiltersSchema.parse({ q: 'a"b' }).q).toBe("");
    expect(orderFiltersSchema.parse({ q: "  Nadia A. " }).q).toBe("Nadia A.");
    expect(orderFiltersSchema.parse({ q: "KYN-260928-0142" }).q).toBe("KYN-260928-0142");
  });

  it("nomor resi divalidasi, kosong berarti tidak diisi", () => {
    const base = { nomor: "KYN-260928-0142", status: "dikirim" };
    expect(updateOrderSchema.parse({ ...base, resi: " JNE0123456781 " }).resi).toBe("JNE0123456781");
    expect(updateOrderSchema.parse({ ...base, resi: "" }).resi).toBeUndefined();
    expect(updateOrderSchema.safeParse({ ...base, resi: "<b>x</b>" }).success).toBe(false);
    expect(updateOrderSchema.safeParse({ ...base, nomor: "1 or 1=1" }).success).toBe(false);
    expect(updateOrderSchema.safeParse({ ...base, status: "lunas" }).success).toBe(false);
  });

  it("admin tidak ditawari menandai lunas, dan status akhir terkunci", () => {
    expect(NEXT_STATUS.menunggu_pembayaran).toEqual(["dibatalkan"]);
    expect(NEXT_STATUS.selesai).toEqual([]);
    expect(NEXT_STATUS.kedaluwarsa).toEqual([]);
  });

  it("kode error database diterjemahkan", () => {
    expect(adminOrderError('P0001: RESI_WAJIB')).toContain("wajib diisi nomor resi");
    expect(adminOrderError("timeout")).toContain("Coba lagi");
  });
});

describe("angka ringkasan", () => {
  it("rupiah ringkas", () => {
    expect(formatRupiahShort(18_400_000)).toBe("Rp18,4 jt");
    expect(formatRupiahShort(2_000_000)).toBe("Rp2 jt");
    expect(formatRupiahShort(146_000)).toBe("Rp146 rb");
    expect(formatRupiahShort(500)).toBe("Rp500");
  });

  it("perbandingan dengan periode lalu", () => {
    expect(changeLabel(112, 100)).toEqual({ text: "▲ 12% dari periode lalu", tone: "up" });
    expect(changeLabel(95, 100)).toEqual({ text: "▼ 5% dari periode lalu", tone: "down" });
    expect(changeLabel(100, 100).text).toBe("Stabil");
    expect(changeLabel(50, 0).text).toBe("Belum ada pembanding");
  });

  it("skala sumbu Y bulat dan selalu di atas nilai tertinggi", () => {
    expect(chartScale(1_180_000)).toEqual([1_500_000, 1_000_000, 500_000, 0]);
    expect(chartScale(1_200_000)).toEqual([1_500_000, 1_000_000, 500_000, 0]);
    expect(chartScale(90_000)).toEqual([150_000, 100_000, 50_000, 0]);
    expect(chartScale(0)).toEqual([0, 0, 0, 0]);
  });

  it("nomor WhatsApp pembeli", () => {
    expect(waNumber("081234567890")).toBe("6281234567890");
    expect(waNumber("0812-3456-7890")).toBe("6281234567890");
    expect(waNumber("6281234567890")).toBe("6281234567890");
    expect(waNumber("022123456")).toBeNull();
    expect(waNumber(null)).toBeNull();
  });
});
