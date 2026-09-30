// Label & warna badge status pesanan (token --color-status-* di globals.css).

export const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  menunggu_pembayaran: { label: "Menunggu Pembayaran", cls: "bg-status-bayar-bg text-status-bayar" },
  diproses: { label: "Diproses", cls: "bg-status-proses-bg text-status-proses" },
  dikirim: { label: "Dikirim", cls: "bg-status-kirim-bg text-status-kirim" },
  selesai: { label: "Selesai", cls: "bg-status-selesai-bg text-status-selesai" },
  dibatalkan: { label: "Dibatalkan", cls: "bg-status-batal-bg text-status-batal" },
  kedaluwarsa: { label: "Kedaluwarsa", cls: "bg-status-batal-bg text-status-batal" },
};

// Waktu dalam zona WIB: "28 Sep 2026, 14.20"
export function formatDateTime(iso: string, withYear = true) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  })
    .format(new Date(iso))
    .replace(" pukul ", ", ");
}
