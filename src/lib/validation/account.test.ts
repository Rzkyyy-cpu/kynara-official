import { describe, expect, it } from "vitest";
import { addressSchema, changePasswordSchema, profileSchema } from "@/lib/validation/account";

const validAddress = {
  label: "Rumah",
  recipientName: "Nadia Azzahra",
  phone: "081234567890",
  provinceCode: "32",
  cityCode: "32.73",
  districtCode: "32.73.02",
  postalCode: "40132",
  street: "Jl. Contoh No. 12, RT 03/RW 05",
  landmark: "",
  id: "",
};

describe("addressSchema", () => {
  it("menerima alamat yang benar; patokan kosong jadi null, id kosong diabaikan", () => {
    const r = addressSchema.parse(validAddress);
    expect(r.landmark).toBeNull();
    expect(r.id).toBeUndefined();
    expect(r.isDefault).toBe(false);
  });

  it("menolak kode pos yang bukan 5 angka", () => {
    const r = addressSchema.safeParse({ ...validAddress, postalCode: "4013" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch(/5 angka/);
  });

  it("menolak label di luar pilihan", () => {
    expect(addressSchema.safeParse({ ...validAddress, label: "Gudang" }).success).toBe(false);
  });

  it("menolak kode wilayah yang formatnya salah", () => {
    expect(addressSchema.safeParse({ ...validAddress, districtCode: "32.73" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...validAddress, provinceCode: "" }).success).toBe(false);
  });

  it("menolak alamat yang terlalu pendek", () => {
    expect(addressSchema.safeParse({ ...validAddress, street: "Jl" }).success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("tanggal lahir boleh kosong", () => {
    const r = profileSchema.parse({ fullName: "Nadia", phone: "081234567890", birthDate: "" });
    expect(r.birthDate).toBeNull();
  });

  it("menolak tanggal lahir di masa depan", () => {
    expect(profileSchema.safeParse({ fullName: "Nadia", phone: "081234567890", birthDate: "2999-01-01" }).success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("password baru harus berbeda dari yang lama", () => {
    const r = changePasswordSchema.safeParse({ currentPassword: "rahasia123", password: "rahasia123", confirm: "rahasia123" });
    expect(r.success).toBe(false);
    expect(r.error?.issues.some((i) => /berbeda/.test(i.message))).toBe(true);
  });
});
