import { chartScale } from "@/lib/admin/chart";
import { formatRupiah, formatRupiahShort } from "@/lib/format";

// Grafik batang penjualan harian (admin-desktop/01). Dibuat dari <div> biasa, tanpa library grafik.
// Tinggi batang = persentase terhadap angka tertinggi di sumbu Y.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const short = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
};

export function SalesChart({ daily }: { daily: { date: string; sales: number }[] }) {
  const ticks = chartScale(Math.max(0, ...daily.map((d) => d.sales)));
  const top = ticks[0] || 1;
  const total = daily.reduce((s, d) => s + d.sales, 0);
  // 5 label tanggal di bawah: awal, 3 di tengah, akhir
  const labelIdx = [...new Set([0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(p * (daily.length - 1))))];

  return (
    <div
      role="img"
      aria-label={`Penjualan harian ${short(daily[0].date)} sampai ${short(daily.at(-1)!.date)}, total ${formatRupiah(total)}`}
      // HP: tinggi tetap; desktop: mengisi tinggi kartu (ikut tinggi kolom "Perlu tindakan")
      className="grid h-60 grid-cols-[44px_minmax(0,1fr)] gap-2 lg:h-auto lg:min-h-60 lg:grow"
    >
      <div className="flex flex-col justify-between pb-5 text-right text-[11px] text-muted">
        {ticks.map((t, i) => (
          <span key={i}>{t === 0 ? "0" : formatRupiahShort(t).replace("Rp", "")}</span>
        ))}
      </div>
      <div className="flex flex-col">
        <div className="relative flex grow items-end gap-[3px] border-b border-line-strong bg-[linear-gradient(var(--color-line-soft)_1px,transparent_1px)] bg-size-[100%_33.33%] lg:gap-1">
          {daily.map((d) => (
            <span
              key={d.date}
              title={`${short(d.date)} · ${formatRupiah(d.sales)}`}
              className="min-w-0 flex-1 rounded-t-[4px] bg-slate hover:bg-slate-700"
              style={{ height: `${(d.sales / top) * 100}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between pt-1.5 text-[11px] text-muted">
          {labelIdx.map((i) => (
            <span key={i}>{short(daily[i].date)}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
