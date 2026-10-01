import { z } from "zod";
import type { ShippingDestination, ShippingRate } from "@/lib/shipping/types";

// Bagian "penerjemah" RajaOngkir: mengubah jawaban API menjadi bentuk ShippingRate.
// Dipisah dari pemanggil API supaya bisa dites dengan contoh JSON, tanpa memakai kuota.

// Kurir yang ditawarkan ke pembeli. Semua dihitung dalam SATU hit API ("jne:jnt:sicepat").
export const COURIERS = ["jne", "jnt", "sicepat"] as const;

const COURIER_NAMES: Record<string, string> = { jne: "JNE", jnt: "J&T Express", sicepat: "SiCepat" };

// Kode layanan -> nama yang dimengerti pembeli (CTC = layanan JNE untuk tujuan dalam kota)
const SERVICE_NAMES: Record<string, string> = {
  REG: "Reguler",
  CTC: "Reguler",
  EZ: "Reguler",
  OKE: "Ekonomis",
  YES: "YES (Yakin Esok Sampai)",
  CTCYES: "YES (Yakin Esok Sampai)",
  BEST: "BEST (Besok Sampai)",
};

// Tidak cocok untuk paket kerudung: kargo/truk (minimal berat besar) dan Super Speed (ratusan ribu rupiah)
const EXCLUDED_SERVICES = /^(JTR|GOKIL|CARGO|TRUCK)|SPS$/i;

// Jawaban API divalidasi Zod: kalau bentuknya berubah, kita tahu (lalu pakai tarif flat), bukan crash diam-diam.
const meta = z.object({ code: z.number(), message: z.string().optional() });

export const destinationResponseSchema = z.object({
  meta,
  data: z
    .array(
      z.object({
        id: z.union([z.number(), z.string()]),
        label: z.string(),
        province_name: z.string(),
        district_name: z.string(),
        city_name: z.string(),
        zip_code: z.string().nullish(),
      }),
    )
    .nullable(),
});
export type DestinationRow = NonNullable<z.infer<typeof destinationResponseSchema>["data"]>[number];

export const costResponseSchema = z.object({
  meta,
  data: z
    .array(
      z.object({
        code: z.string(),
        service: z.string(),
        description: z.string().nullish(),
        cost: z.number(),
        etd: z.string().nullish(),
      }),
    )
    .nullable(),
});
export type CostRow = NonNullable<z.infer<typeof costResponseSchema>["data"]>[number];

// Isi cache tarif dibaca ulang dengan Zod: kalau bentuk ShippingRate berubah di versi kode berikutnya,
// catatan lama dianggap tidak ada (ditanya ulang), bukan dipakai mentah-mentah.
export const cachedRatesSchema = z.array(
  z.object({
    id: z.string(),
    courier: z.string(),
    service: z.string(),
    label: z.string(),
    cost: z.number().int().positive(),
    etd: z.object({ min: z.number(), max: z.number() }).nullable(),
    available: z.boolean(),
  }),
);

// "Coblong" -> "COBLONG", "KAB. BANDUNG" -> "KABUPATENBANDUNG"
function norm(s: string) {
  return s
    .toUpperCase()
    .replace(/^KAB\.?\s+/, "KABUPATEN ")
    .replace(/[^A-Z0-9]/g, "");
}

// Tanpa awalan Kota/Kabupaten: "Kota Bandung" -> "BANDUNG"
function bare(s: string) {
  return norm(s).replace(/^(KOTA|KABUPATEN)/, "");
}

// Data wilayah resmi menulis "Daerah Istimewa Yogyakarta", RajaOngkir menulis "DI YOGYAKARTA".
// RajaOngkir juga masih memakai provinsi Papua sebelum pemekaran 2022 (data asli: Merauke = "PAPUA").
function province(s: string) {
  return norm(s)
    .replace(/^DAERAHISTIMEWA/, "DI")
    .replace(/^DAERAHKHUSUSIBUKOTA/, "DKI")
    .replace(/^PAPUA(SELATAN|TENGAH|PEGUNUNGAN)$/, "PAPUA")
    .replace(/^PAPUABARATDAYA$/, "PAPUABARAT");
}

// Kunci catatan ID tujuan, dari data wilayah resmi (bukan teks bebas pembeli)
export function destinationKey(d: ShippingDestination) {
  return [d.province, d.city, d.district, d.postalCode].map((x) => x.trim().toUpperCase()).join("|");
}

// Pilih hasil pencarian yang provinsi, kota, DAN kecamatannya sama dengan alamat. Nama kecamatan bisa kembar,
// di provinsi lain (Soreang: Kab. Bandung dan Parepare) maupun di provinsi yang sama (Sukasari).
// RajaOngkir menulis kota tanpa "Kota"/"Kabupaten" (contoh "BANDUNG"), jadi kota dicocokkan tanpa awalan,
// lalu kode pos dan awalan yang sama dipakai sebagai penentu kalau masih ada beberapa kandidat. Tidak ada yang cocok -> null (jangan menebak ID wilayah lain).
export function pickDestination(rows: DestinationRow[], d: ShippingDestination): DestinationRow | null {
  const sameDistrict = rows.filter(
    (r) =>
      province(r.province_name) === province(d.province) &&
      bare(r.city_name) === bare(d.city) &&
      norm(r.district_name) === norm(d.district),
  );
  if (sameDistrict.length === 0) return null;
  const cityScore = (city: string) => (norm(city) === norm(d.city) ? 2 : bare(city) === bare(d.city) ? 1 : 0);
  const score = (r: DestinationRow) => (r.zip_code === d.postalCode ? 4 : 0) + cityScore(r.city_name);
  return [...sameDistrict].sort((a, b) => score(b) - score(a))[0];
}

// "2-3 day" / "1 day" / "2 - 3 HARI" / "" -> { min, max } | null ("0" = tidak diisi kurir)
export function parseEtd(etd: string | null | undefined): ShippingRate["etd"] {
  const nums = (etd ?? "").match(/\d+/g)?.map(Number).filter((n) => n > 0) ?? [];
  if (nums.length === 0) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return { min, max };
}

export function toRates(rows: CostRow[]): ShippingRate[] {
  const allowed = new Set<string>(COURIERS);
  return rows
    .filter((r) => allowed.has(r.code.toLowerCase()) && r.cost > 0 && !EXCLUDED_SERVICES.test(r.service))
    .map((r) => {
      const courier = r.code.toLowerCase();
      return {
        id: `${courier}:${r.service}`,
        courier,
        service: r.service,
        label: `${COURIER_NAMES[courier]} ${SERVICE_NAMES[r.service.toUpperCase()] ?? r.service}`,
        cost: Math.ceil(r.cost), // rupiah bulat
        etd: parseEtd(r.etd),
        available: true,
      };
    })
    .sort((a, b) => a.cost - b.cost);
}
