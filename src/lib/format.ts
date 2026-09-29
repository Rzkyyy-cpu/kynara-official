// Format angka ke Rupiah tanpa desimal, contoh 79000 -> "Rp79.000" (sesuai desain, tanpa spasi).
export function formatRupiah(value: number): string {
  return "Rp" + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}
