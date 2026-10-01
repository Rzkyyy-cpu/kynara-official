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

// ---------- Timeline halaman status pesanan (desktop-akun-checkout/10, mobile-akun-checkout/11) ----------

export type TimelineStep = { label: string; time: string; state: "done" | "current" | "todo"; failed?: boolean };

export type TimelineInput = {
  status: string;
  created_at: string;
  paid_at: string | null;
  tracking_number: string | null;
  history: { status: string; note: string | null; created_at: string }[];
};

// Judul besar di atas timeline: [label kecil, judul, keterangan, kelas warna label]
export const ORDER_HEADLINE: Record<string, [string, string, string, string]> = {
  menunggu_pembayaran: ["Menunggu pembayaran", "Satu langkah lagi", "Diproses setelah pembayaran diterima", "text-status-bayar"],
  diproses: ["Diproses", "Pesananmu sedang dikemas", "Kami kabari lewat WhatsApp saat dikirim", "text-status-proses"],
  dikirim: ["Dikirim", "Paket sedang dalam perjalanan", "Lacak paket dengan nomor resi di bawah", "text-slate-900"],
  selesai: ["Selesai", "Pesanan sudah diterima", "Terima kasih sudah belanja di kynara", "text-status-selesai"],
  kedaluwarsa: ["Kedaluwarsa", "Batas waktu pembayaran habis", "Stok sudah kami lepas lagi. Silakan pesan ulang kalau masih berminat", "text-status-batal"],
  dibatalkan: ["Dibatalkan", "Pesanan dibatalkan", "Stok sudah kami lepas lagi. Silakan pesan ulang kalau masih berminat", "text-status-batal"],
};

const FLOW = ["menunggu_pembayaran", "diproses", "dikirim", "selesai"] as const;

// Catatan riwayat yang BUKAN perubahan status (hanya penanda masalah bayar), dilewati timeline.
// Catatan lain (DIBATALKAN_ADMIN, PERLU_REFUND) menempel di baris perubahan status yang asli.
const ISSUE_NOTES: Record<string, PaymentIssue> = {
  PEMBAYARAN_TERLAMBAT: "late",
  PEMBAYARAN_GANDA: "duplicate",
  PERLU_REFUND: "refund",
};
const RESOLVED_NOTE = "MASALAH_BAYAR_DITANGANI";
const isMarkerRow = (note: string | null) => note === RESOLVED_NOTE || note === "PEMBAYARAN_TERLAMBAT" || note === "PEMBAYARAN_GANDA";

// Menyusun langkah timeline dari status sekarang + riwayat status (waktu tiap perubahan).
export function orderTimeline(o: TimelineInput): TimelineStep[] {
  const at = (status: string) => {
    const row = [...o.history].reverse().find((h) => h.status === status && !isMarkerRow(h.note));
    return row ? formatDateTime(row.created_at) : null;
  };
  const created = formatDateTime(o.created_at);

  // Pesanan gagal: cukup dua langkah, yang kedua ditandai gagal
  if (o.status === "kedaluwarsa" || o.status === "dibatalkan") {
    return [
      { label: ORDER_STATUS.menunggu_pembayaran.label, time: created, state: "done" },
      { label: ORDER_STATUS[o.status].label, time: at(o.status) ?? "", state: "current", failed: true },
    ];
  }

  const idx = Math.max(0, FLOW.indexOf(o.status as (typeof FLOW)[number]));
  const times = [
    created,
    o.paid_at ? `${formatDateTime(o.paid_at)} · Pembayaran diterima` : at("diproses"),
    [at("dikirim"), o.tracking_number && `Resi ${o.tracking_number}`].filter(Boolean).join(" · "),
    at("selesai") ?? "Konfirmasi setelah paket diterima",
  ];
  return FLOW.map((status, i) => {
    const done = i < idx || (o.status === "selesai" && i === FLOW.length - 1);
    return {
      label: ORDER_STATUS[status].label,
      time: i <= idx || i === FLOW.length - 1 ? times[i] || "" : "Menunggu",
      state: done ? "done" : i === idx ? "current" : "todo",
    };
  });
}

// Uang pembeli yang perlu ditangani admin di luar sistem:
//   late      = dibayar setelah pesanan kedaluwarsa/dibatalkan (dicatat apply_payment_status)
//   duplicate = dibayar dua kali (mis. VA lama dan QR baru)
//   refund    = pesanan lunas dibatalkan admin (dicatat admin_update_order)
// Masalah dianggap selesai kalau setelahnya ada catatan MASALAH_BAYAR_DITANGANI dari admin.
export type PaymentIssue = "late" | "duplicate" | "refund";

export function paymentIssue(history: TimelineInput["history"]): PaymentIssue | null {
  let issue: PaymentIssue | null = null;
  // Riwayat diurutkan dari lama ke baru; yang terakhir menang
  for (const h of history) {
    if (h.note && ISSUE_NOTES[h.note]) issue = ISSUE_NOTES[h.note];
    else if (h.note === RESOLVED_NOTE) issue = null;
  }
  return issue;
}
