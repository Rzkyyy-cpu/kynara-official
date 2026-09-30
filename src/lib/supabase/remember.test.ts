import { describe, expect, it } from "vitest";
import { applyRemember } from "@/lib/supabase/remember";

describe("applyRemember ('Ingat saya')", () => {
  const opts = { path: "/", maxAge: 34560000, sameSite: "lax" };

  it("dicentang: cookie tetap berumur panjang", () => {
    expect(applyRemember(opts, true)).toEqual(opts);
  });

  it("tidak dicentang: umur cookie dihapus (hilang saat browser ditutup)", () => {
    expect(applyRemember(opts, false)).toEqual({ path: "/", sameSite: "lax" });
  });

  it("perintah hapus cookie (maxAge 0, saat logout) tidak diubah", () => {
    expect(applyRemember({ path: "/", maxAge: 0 }, false)).toEqual({ path: "/", maxAge: 0 });
  });
});
