// Status banner beranda berdasarkan tanggal WIB (admin-desktop/06: Aktif, Terjadwal, Nonaktif).

export type BannerStatus = "aktif" | "terjadwal" | "berakhir" | "draf";

export const BANNER_STATUS: Record<BannerStatus, { label: string; cls: string }> = {
  aktif: { label: "Aktif", cls: "bg-status-kirim-bg text-status-kirim" },
  terjadwal: { label: "Terjadwal", cls: "bg-status-proses-bg text-status-proses" },
  berakhir: { label: "Berakhir", cls: "bg-status-selesai-bg text-status-selesai" },
  draf: { label: "Draf", cls: "bg-status-selesai-bg text-status-selesai" },
};

// Tanggal hari ini di WIB, format "2026-10-01" (sama dengan kolom date di database)
export const todayWib = (now = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta" }).format(now);

type BannerDates = { is_published: boolean; starts_at: string; ends_at: string | null };

export function bannerStatus(b: BannerDates, today = todayWib()): BannerStatus {
  if (!b.is_published) return "draf";
  if (b.ends_at && b.ends_at < today) return "berakhir";
  if (b.starts_at > today) return "terjadwal";
  return "aktif";
}

// Banner yang tampil di hero = banner AKTIF paling atas (urutan admin)
export function heroBanner<T extends BannerDates & { sort_order: number }>(banners: T[], today = todayWib()): T | null {
  return [...banners].sort((a, b) => a.sort_order - b.sort_order).find((b) => bannerStatus(b, today) === "aktif") ?? null;
}
