import { describe, expect, it } from "vitest";
import {
  type DestinationRow,
  costResponseSchema,
  destinationKey,
  parseEtd,
  pickDestination,
  toRates,
} from "@/lib/shipping/rajaongkir-map";

const coblong = { province: "Jawa Barat", city: "Kota Bandung", district: "Coblong", postalCode: "40132" };

const row = (r: Partial<DestinationRow>): DestinationRow => ({
  id: 1,
  label: "-",
  province_name: "JAWA BARAT",
  district_name: "COBLONG",
  city_name: "BANDUNG",
  zip_code: "40132",
  ...r,
});

describe("pemilihan ID tujuan RajaOngkir", () => {
  it("hanya menerima kecamatan yang sama dengan alamat", () => {
    expect(pickDestination([row({ district_name: "SUKAJADI" })], coblong)).toBeNull();
    expect(pickDestination([], coblong)).toBeNull();
  });

  it("kecamatan kembar di provinsi lain tidak dipilih (data asli: Soreang)", () => {
    const soreang = { province: "Jawa Barat", city: "Kabupaten Bandung", district: "Soreang", postalCode: "40999" };
    const rows = [
      row({ id: 82025, province_name: "SULAWESI SELATAN", city_name: "PAREPARE", district_name: "SOREANG", zip_code: "91132" }),
      row({ id: 4968, city_name: "BANDUNG", district_name: "SOREANG", zip_code: "40914" }),
    ];
    expect(pickDestination(rows, soreang)?.id).toBe(4968);
    expect(pickDestination([rows[0]], soreang)).toBeNull();
  });

  it("kecamatan kembar di kota lain dalam provinsi yang sama tidak dipilih", () => {
    const sukasari = { province: "Jawa Barat", city: "Kota Bandung", district: "Sukasari", postalCode: "40999" };
    const lain = row({ id: 9, city_name: "SUMEDANG", district_name: "SUKASARI", zip_code: "45366" });
    expect(pickDestination([lain], sukasari)).toBeNull();
    expect(pickDestination([lain, row({ id: 10, district_name: "SUKASARI", zip_code: "40151" })], sukasari)?.id).toBe(10);
  });

  it("nama provinsi resmi dicocokkan dengan singkatan RajaOngkir", () => {
    const sleman = { province: "Daerah Istimewa Yogyakarta", city: "Kabupaten Sleman", district: "Ngaglik", postalCode: "55581" };
    const r = row({ id: 31555, province_name: "DI YOGYAKARTA", city_name: "SLEMAN", district_name: "NGAGLIK", zip_code: "55581" });
    expect(pickDestination([r], sleman)?.id).toBe(31555);
  });

  it("provinsi pemekaran Papua dicocokkan dengan PAPUA (data asli: Merauke)", () => {
    const merauke = { province: "Papua Selatan", city: "Kabupaten Merauke", district: "Merauke", postalCode: "99611" };
    const r = row({ id: 21332, province_name: "PAPUA", city_name: "MERAUKE", district_name: "MERAUKE", zip_code: "99611" });
    expect(pickDestination([r], merauke)?.id).toBe(21332);
  });

  it("dari beberapa kandidat, utamakan kode pos lalu kota yang sama", () => {
    const rows = [
      row({ id: 1, zip_code: "40135" }),
      row({ id: 2, zip_code: "40132", city_name: "KAB. BANDUNG" }),
      row({ id: 3, zip_code: "40132", city_name: "KOTA BANDUNG" }),
    ];
    expect(pickDestination(rows, coblong)?.id).toBe(3);
  });

  it("kunci catatan dari data wilayah, huruf besar", () => {
    expect(destinationKey(coblong)).toBe("JAWA BARAT|KOTA BANDUNG|COBLONG|40132");
  });
});

describe("estimasi tiba", () => {
  it("membaca berbagai format etd", () => {
    expect(parseEtd("2-3 day")).toEqual({ min: 2, max: 3 });
    expect(parseEtd("1 day")).toEqual({ min: 1, max: 1 });
    expect(parseEtd("2 - 3 HARI")).toEqual({ min: 2, max: 3 });
    expect(parseEtd("0")).toBeNull();
    expect(parseEtd("")).toBeNull();
    expect(parseEtd(null)).toBeNull();
  });
});

describe("jawaban cek ongkir -> pilihan kurir", () => {
  const body = {
    meta: { message: "Success Calculate Domestic Shipping cost", code: 200, status: "success" },
    data: [
      { name: "Jalur Nugraha Ekakurir (JNE)", code: "jne", service: "REG", description: "Layanan Reguler", cost: 12000, etd: "2-3 day" },
      { name: "Jalur Nugraha Ekakurir (JNE)", code: "jne", service: "JTR", description: "JNE Trucking", cost: 45000, etd: "3-4 day" },
      { name: "SiCepat Express", code: "sicepat", service: "REG", description: "Reguler", cost: 11000, etd: "1-2 day" },
      { name: "SiCepat Express", code: "sicepat", service: "GOKIL", description: "Cargo", cost: 50000, etd: "" },
      { name: "J&T Express", code: "jnt", service: "EZ", description: "Reguler", cost: 13000, etd: "2-3 day" },
      { name: "POS Indonesia", code: "pos", service: "Pos Reguler", description: "", cost: 9000, etd: "3 day" },
      { name: "JNE", code: "jne", service: "YES", description: "Yakin Esok Sampai", cost: 0, etd: "1 day" },
      { name: "JNE", code: "jne", service: "SPS", description: "Super Speed", cost: 495000, etd: "0" },
      { name: "JNE", code: "jne", service: "CTCSPS", description: "Super Speed", cost: 25000, etd: "0" },
    ],
  };

  it("bentuk jawaban lolos validasi", () => {
    expect(costResponseSchema.safeParse(body).success).toBe(true);
  });

  it("hanya kurir pilihan, tanpa kargo dan tarif nol, urut termurah", () => {
    const rates = toRates(costResponseSchema.parse(body).data ?? []);
    expect(rates.map((r) => r.id)).toEqual(["sicepat:REG", "jne:REG", "jnt:EZ"]);
    expect(rates[1]).toMatchObject({ label: "JNE Reguler", cost: 12000, etd: { min: 2, max: 3 }, available: true });
    for (const r of rates) expect(Number.isInteger(r.cost)).toBe(true);
  });

  it("jawaban yang bentuknya berubah ditolak", () => {
    expect(costResponseSchema.safeParse({ meta: { code: 200 }, data: [{ code: "jne" }] }).success).toBe(false);
  });
});
