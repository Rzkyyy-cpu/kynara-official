// Membuat isi file CSV (dibuka di Excel / Google Sheets).
//
// Keamanan "CSV injection": sel yang diawali = + - @ dianggap RUMUS oleh Excel. Nama pembeli seperti
// =HYPERLINK("situs-jahat",...) bisa berubah jadi link berbahaya saat admin membuka file. Karena itu
// sel teks seperti itu diberi awalan ' supaya dibaca sebagai teks biasa.

type Cell = string | number | null | undefined;

function cell(value: Cell): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);
  const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  // Semua teks dibungkus tanda kutip; tanda kutip di dalamnya digandakan
  return `"${text.replace(/"/g, '""')}"`;
}

// BOM di awal supaya Excel membaca huruf non-ASCII (é, –) dengan benar
export function toCsv(header: string[], rows: Cell[][]): string {
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
