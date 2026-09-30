import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema, resetPasswordSchema, safeNextPath } from "@/lib/validation/auth";

// Pesan error pertama untuk kolom tertentu (atau undefined kalau lolos)
function errorOf(schema: { safeParse: (v: unknown) => { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } } }, input: unknown, field: string) {
  const r = schema.safeParse(input);
  return r.success ? undefined : r.error?.issues.find((i) => i.path[0] === field)?.message;
}

const validRegister = {
  fullName: "Nadia Azzahra",
  phone: "0812-3456-7890",
  email: "Nadia@Email.com ",
  password: "rahasia123",
  agree: "on",
};

describe("registerSchema", () => {
  it("menerima data yang benar dan merapikan email & nomor HP", () => {
    const r = registerSchema.parse(validRegister);
    expect(r.email).toBe("nadia@email.com");
    expect(r.phone).toBe("081234567890");
    expect(r.agree).toBe(true);
  });

  it("mengubah +62 menjadi 08", () => {
    expect(registerSchema.parse({ ...validRegister, phone: "+62 812 3456 7890" }).phone).toBe("081234567890");
  });

  it("menolak nomor HP yang bukan 08xx", () => {
    expect(errorOf(registerSchema, { ...validRegister, phone: "12345" }, "phone")).toMatch(/diawali 08/);
  });

  it("menolak password tanpa angka / terlalu pendek", () => {
    expect(errorOf(registerSchema, { ...validRegister, password: "rahasiasaja" }, "password")).toMatch(/angka/);
    expect(errorOf(registerSchema, { ...validRegister, password: "ab1" }, "password")).toMatch(/minimal 8/);
  });

  it("menolak email yang formatnya salah", () => {
    expect(errorOf(registerSchema, { ...validRegister, email: "nadia@" }, "email")).toMatch(/Format email/);
  });

  it("wajib menyetujui syarat & ketentuan", () => {
    const { agree: _omit, ...rest } = validRegister;
    void _omit;
    expect(errorOf(registerSchema, rest, "agree")).toMatch(/Syarat/);
  });
});

describe("loginSchema", () => {
  it("tidak menilai kekuatan password saat login, hanya wajib diisi", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(errorOf(loginSchema, { email: "a@b.co", password: "" }, "password")).toMatch(/Isi password/);
  });

  it("checkbox 'Ingat saya' tidak dicentang = false", () => {
    expect(loginSchema.parse({ email: "a@b.co", password: "x" }).remember).toBe(false);
    expect(loginSchema.parse({ email: "a@b.co", password: "x", remember: "on" }).remember).toBe(true);
  });
});

describe("resetPasswordSchema", () => {
  it("password dan ulangan harus sama", () => {
    expect(errorOf(resetPasswordSchema, { password: "rahasia123", confirm: "rahasia124" }, "confirm")).toMatch(/sama persis/);
    expect(resetPasswordSchema.safeParse({ password: "rahasia123", confirm: "rahasia123" }).success).toBe(true);
  });
});

describe("safeNextPath (mencegah open redirect)", () => {
  it("mengizinkan path di situs sendiri", () => {
    expect(safeNextPath("/akun/wishlist")).toBe("/akun/wishlist");
    expect(safeNextPath("/koleksi?kategori=pashmina")).toBe("/koleksi?kategori=pashmina");
  });

  it("menolak alamat situs lain", () => {
    expect(safeNextPath("https://penipu.com")).toBe("/akun");
    expect(safeNextPath("//penipu.com")).toBe("/akun");
    expect(safeNextPath("/\\penipu.com")).toBe("/akun");
    expect(safeNextPath(undefined)).toBe("/akun");
    expect(safeNextPath(["/akun"])).toBe("/akun");
  });
});
