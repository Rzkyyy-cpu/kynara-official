// Mengubah CSV data wilayah menjadi satu file JSON ringkas: src/data/wilayah.json
// Sumber data (lisensi MIT): https://github.com/caturseptian/laravel-indonesian-territory
//   folder database/data: provinces.csv, regencies.csv, districts.csv
// Cara pakai: node scripts/build-wilayah.mjs <folder-berisi-csv>
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) throw new Error("Pakai: node scripts/build-wilayah.mjs <folder-csv>");

// Parser CSV sederhana: mendukung nilai berkutip yang berisi koma.
function parseCsv(file) {
  const lines = readFileSync(join(dir, file), "utf8").trim().split(/\r?\n/);
  return lines.slice(1).map((line) =>
    [...line.matchAll(/("([^"]*)"|[^,]*)(,|$)/g)]
      .filter((m) => m.index < line.length || m[0] !== "")
      .map((m) => (m[2] ?? m[1]).trim()),
  );
}

const provinces = parseCsv("provinces.csv").map(([code, name]) => [code, name]);
const cities = {};
for (const [code, prov, , name] of parseCsv("regencies.csv")) (cities[prov] ??= []).push([code, name]);
const districts = {};
for (const [code, reg, name] of parseCsv("districts.csv")) (districts[reg] ??= []).push([code, name]);

const out = {
  source: "Kepmendagri 300.2.2-2138/2025 via github.com/caturseptian/laravel-indonesian-territory (MIT)",
  provinces,
  cities,
  districts,
};
writeFileSync("src/data/wilayah.json", JSON.stringify(out));
console.log(`${provinces.length} provinsi, ${Object.values(cities).flat().length} kota/kab, ${Object.values(districts).flat().length} kecamatan`);
