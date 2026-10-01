import type { Database } from "@/types/database";

// Aturan perpindahan status pesanan oleh admin.
// Sumber kebenarannya fungsi database admin_update_order; salinan di sini hanya untuk tampilan
// (pilihan di dropdown), supaya admin tidak ditawari status yang pasti ditolak database.

export type OrderStatus = Database["public"]["Enums"]["order_status"];

export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  menunggu_pembayaran: ["dibatalkan"], // lunas hanya dari konfirmasi gateway, bukan dari admin
  diproses: ["dikirim", "dibatalkan"],
  dikirim: ["selesai"],
  selesai: [],
  dibatalkan: [],
  kedaluwarsa: [],
};

// Nomor resi boleh diisi/dikoreksi selama paket belum selesai
export const canEditTracking = (status: OrderStatus) => status === "diproses" || status === "dikirim";

export const TRACKING_PATTERN = /^[A-Za-z0-9-]{6,40}$/;

// Kode error dari database -> pesan untuk admin
const ERRORS: Record<string, string> = {
  RESI_WAJIB: 'Status "Dikirim" wajib diisi nomor resi.',
  RESI_TIDAK_VALID: "Nomor resi 6–40 karakter, hanya huruf, angka, dan tanda strip.",
  PERPINDAHAN_TIDAK_BOLEH: "Status itu tidak bisa dipilih dari status sekarang. Muat ulang halaman, ya.",
  PESANAN_TIDAK_ADA: "Pesanan tidak ditemukan.",
  BUKAN_ADMIN: "Sesi admin berakhir. Silakan masuk lagi.",
};

export function adminOrderError(message: string): string {
  const code = Object.keys(ERRORS).find((k) => message.includes(k));
  return code ? ERRORS[code] : "Gagal menyimpan. Coba lagi sebentar lagi.";
}
