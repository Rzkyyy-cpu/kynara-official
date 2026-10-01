// Fungsi murni untuk angka & grafik di ringkasan admin (tanpa database, mudah dites).

// "▲ 12% dari periode lalu" / "▼ 5% ..." / "Stabil"
export function changeLabel(now: number, before: number): { text: string; tone: "up" | "down" | "flat" } {
  if (before === 0) return now > 0 ? { text: "Belum ada pembanding", tone: "flat" } : { text: "Stabil", tone: "flat" };
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return { text: "Stabil", tone: "flat" };
  return pct > 0
    ? { text: `▲ ${pct}% dari periode lalu`, tone: "up" }
    : { text: `▼ ${Math.abs(pct)}% dari periode lalu`, tone: "down" };
}

// Skala sumbu Y grafik: angka bulat di atas nilai tertinggi (1, 2, 2.5, 5 × 10^n), dibagi 3
export function chartScale(max: number): number[] {
  if (max <= 0) return [0, 0, 0, 0];
  const raw = max / 3;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw)!;
  return [3 * step, 2 * step, step, 0];
}
