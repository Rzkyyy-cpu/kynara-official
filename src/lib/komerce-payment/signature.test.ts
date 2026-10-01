import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyCallbackSignature } from "./signature";

const KEY = "kunci-callback-tes-9f2c";
const body = '{"payment_id":"KOMPAY-1699012345-A1B2C3","order_id":"KYN-260928-0142-1","status":"PAID","amount":238000}';
const hex = createHmac("sha256", KEY).update(body).digest("hex");

describe("verifikasi signature callback Komerce", () => {
  it("menerima segel HMAC-SHA256 yang benar (hex huruf kecil/besar, atau base64)", () => {
    expect(verifyCallbackSignature(body, hex, KEY)).toBe(true);
    expect(verifyCallbackSignature(body, hex.toUpperCase(), KEY)).toBe(true);
    expect(verifyCallbackSignature(body, Buffer.from(hex, "hex").toString("base64"), KEY)).toBe(true);
  });

  it("menolak kalau isi body diubah, walau hanya spasi", () => {
    expect(verifyCallbackSignature(body.replace("238000", "1000"), hex, KEY)).toBe(false);
    expect(verifyCallbackSignature(body.replace('"PAID"', '"PAID" '), hex, KEY)).toBe(false);
  });

  it("menolak segel dari kunci lain, segel rusak, atau header kosong", () => {
    const other = createHmac("sha256", "kunci-lain").update(body).digest("hex");
    expect(verifyCallbackSignature(body, other, KEY)).toBe(false);
    expect(verifyCallbackSignature(body, hex.slice(0, -2), KEY)).toBe(false);
    expect(verifyCallbackSignature(body, "bukan-segel", KEY)).toBe(false);
    expect(verifyCallbackSignature(body, "", KEY)).toBe(false);
    expect(verifyCallbackSignature(body, null, KEY)).toBe(false);
  });

  it("menolak semua callback kalau Callback Key belum diisi", () => {
    expect(verifyCallbackSignature(body, hex, undefined)).toBe(false);
    expect(verifyCallbackSignature(body, hex, "")).toBe(false);
  });
});
