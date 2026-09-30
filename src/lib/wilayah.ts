import "server-only";

import data from "@/data/wilayah.json";

// Data wilayah resmi (Kepmendagri 2025): 38 provinsi, 514 kota/kab, 7.285 kecamatan.
// Disimpan sebagai file di repo (bukan API RajaOngkir) supaya dropdown alamat tidak
// menghabiskan kuota API ongkir gratis (100 hit/hari).
// Bentuk data: [kode, nama]. Kode kota diawali kode provinsinya, contoh "32" -> "32.73" -> "32.73.02".

export type Region = [code: string, name: string];

const provinces = data.provinces as Region[];
const cities = data.cities as unknown as Record<string, Region[]>;
const districts = data.districts as unknown as Record<string, Region[]>;

export function getProvinces(): Region[] {
  return provinces;
}

// Anak dari sebuah kode: provinsi -> daftar kota, kota -> daftar kecamatan.
export function getChildren(code: string): Region[] | null {
  if (/^\d{2}$/.test(code)) return cities[code] ?? null;
  if (/^\d{2}\.\d{2}$/.test(code)) return districts[code] ?? null;
  return null;
}

const nameOf = (list: Region[] | undefined, code: string) => list?.find(([c]) => c === code)?.[1];

// Kode dari form -> nama wilayah. Mengembalikan null kalau kodenya tidak ada
// atau tidak berurutan (mis. kecamatan dari kota lain).
export function resolveRegion(provinceCode: string, cityCode: string, districtCode: string) {
  if (!cityCode.startsWith(`${provinceCode}.`) || !districtCode.startsWith(`${cityCode}.`)) return null;
  const province = nameOf(provinces, provinceCode);
  const city = nameOf(cities[provinceCode], cityCode);
  const district = nameOf(districts[cityCode], districtCode);
  if (!province || !city || !district) return null;
  return { province, city, district };
}

// Kebalikannya: nama tersimpan di database -> kode, untuk mengisi ulang dropdown saat alamat diubah.
export function findRegionCodes(province: string, city: string, district: string) {
  const p = provinces.find(([, n]) => n === province)?.[0];
  const c = p ? cities[p]?.find(([, n]) => n === city)?.[0] : undefined;
  const d = c ? districts[c]?.find(([, n]) => n === district)?.[0] : undefined;
  return { provinceCode: p ?? "", cityCode: c ?? "", districtCode: d ?? "" };
}
