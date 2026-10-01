import { ORDER_STATUS } from "@/lib/order-status";

// Potongan tampilan yang dipakai berulang di halaman admin (admin-desktop).

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-[28px]/9 font-medium tracking-[-0.01em] lg:text-[32px]/10">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const s = ORDER_STATUS[status] ?? ORDER_STATUS.menunggu_pembayaran;
  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold whitespace-nowrap ${s.cls} ${className}`}>
      {s.label}
    </span>
  );
}

export function PaidBadge({ paid }: { paid: boolean }) {
  return (
    <span
      className={`inline-flex h-[22px] items-center rounded-full px-2 text-[11px] font-bold ${
        paid ? "bg-status-kirim-bg text-status-kirim" : "bg-status-bayar-bg text-status-bayar"
      }`}
    >
      {paid ? "Lunas" : "Belum"}
    </span>
  );
}

export const cardCls = "rounded-card border border-line bg-paper";

// Kelas tabel admin: kepala huruf kapital kecil, garis tipis antar baris
export const thCls = "h-11 px-2.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-muted uppercase";
export const tdCls = "px-2.5 py-3 align-middle";
