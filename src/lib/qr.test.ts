import { describe, expect, it } from "vitest";
import { qrPath } from "./qr";

describe("gambar QR", () => {
  it("menghasilkan kotak-kotak untuk teks QRIS", () => {
    const { size, d } = qrPath("00020101021126660014ID.CO.QRIS.WWW0215ID20232156789960303UMI5204599953033605405100005802ID5912KYNARA TES6007BANDUNG6304D2F3");
    expect(size).toBeGreaterThanOrEqual(21); // QR terkecil 21x21
    expect(d.startsWith("M")).toBe(true);
  });
});
