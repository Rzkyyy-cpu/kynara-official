"use client";

import { useEffect, useState } from "react";
import { SelectField } from "@/components/form/Field";

// Tiga dropdown berantai: Provinsi -> Kota/Kab. -> Kecamatan.
// Daftar provinsi dikirim dari server; kota & kecamatan diambil dari /api/wilayah/<kode>
// saat dibutuhkan (bukan dari API RajaOngkir, supaya kuota ongkir tidak terpakai).

type Region = [code: string, name: string];

async function fetchChildren(code: string): Promise<Region[]> {
  const res = await fetch(`/api/wilayah/${code}`);
  return res.ok ? res.json() : [];
}

export function RegionSelect({
  provinces,
  initial,
  errors,
}: {
  provinces: Region[];
  initial: { provinceCode: string; cityCode: string; districtCode: string };
  errors: Record<string, string>;
}) {
  const [province, setProvince] = useState(initial.provinceCode);
  const [city, setCity] = useState(initial.cityCode);
  const [district, setDistrict] = useState(initial.districtCode);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);

  // Saat mengubah alamat lama: muat daftar kota & kecamatan untuk pilihan yang tersimpan
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (initial.provinceCode) {
        const c = await fetchChildren(initial.provinceCode);
        if (!cancelled) setCities(c);
      }
      if (initial.cityCode) {
        const d = await fetchChildren(initial.cityCode);
        if (!cancelled) setDistricts(d);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initial.provinceCode, initial.cityCode]);

  async function pickProvince(code: string) {
    setProvince(code);
    setCity("");
    setDistrict("");
    setCities([]);
    setDistricts([]);
    if (code) setCities(await fetchChildren(code));
  }

  async function pickCity(code: string) {
    setCity(code);
    setDistrict("");
    setDistricts([]);
    if (code) setDistricts(await fetchChildren(code));
  }

  // "Kabupaten Bandung" -> "Kab. Bandung" supaya muat di dropdown sempit HP
  const short = (name: string) => name.replace(/^Kabupaten /, "Kab. ");

  return (
    <>
      <SelectField
        label="Provinsi"
        name="provinceCode"
        value={province}
        onChange={(e) => pickProvince(e.target.value)}
        error={errors.provinceCode}
      >
        <option value="">Pilih provinsi</option>
        {provinces.map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </SelectField>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Kota/Kab."
          name="cityCode"
          value={city}
          onChange={(e) => pickCity(e.target.value)}
          disabled={!province}
          error={errors.cityCode}
        >
          <option value="">Pilih</option>
          {cities.map(([code, name]) => (
            <option key={code} value={code}>
              {short(name)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Kecamatan"
          name="districtCode"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          disabled={!city}
          error={errors.districtCode}
        >
          <option value="">Pilih</option>
          {districts.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </SelectField>
      </div>
    </>
  );
}
