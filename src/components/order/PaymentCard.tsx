"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { checkPayment, choosePayment } from "@/app/(toko)/akun/pesanan/[nomor]/actions";
import { Alert } from "@/components/form/Alert";
import { type MethodOption, PaymentMethodPicker, methodTag, toChoice } from "@/components/payment/PaymentMethodPicker";
import { Button } from "@/components/ui/Button";
import { formatRupiah } from "@/lib/format";
import { type PaymentChoice, bankName } from "@/lib/komerce-payment/status";
import { formatDateTime } from "@/lib/order-status";

// Kartu "Selesaikan pembayaran" di status pesanan (desktop-akun-checkout/10, mobile-akun-checkout/11).
// VA: nomor + tombol Salin. QRIS: gambar QR (berlaku 5 menit) + tombol "Buat QR baru".
// Selama menunggu, halaman dimuat ulang dari server tiap 20 detik: begitu callback Komerce masuk,
// status berubah sendiri tanpa pembeli menekan apa pun.

export type ActivePayment = {
  method: "va" | "qris";
  channel: string | null;
  vaNumber: string | null;
  qr: { size: number; d: string } | null;
  paymentUrl: string | null;
  expiresAt: string;
};

type Props = {
  orderNumber: string;
  orderExpiresAt: string;
  total: number;
  active: ActivePayment | null;
  methods: MethodOption[];
  vaDisabledReason: string | null;
  initialError: string | null;
};

function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

// "8808123456789012" -> "8808 1234 5678 9012" (lebih mudah dibaca & diketik ulang)
const groupDigits = (v: string) => v.replace(/(.{4})(?=.)/g, "$1 ");

export function PaymentCard({ orderNumber, orderExpiresAt, total, active, methods, vaDisabledReason, initialError }: Props) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null); // null sampai di browser, supaya sama dengan HTML server
  const [error, setError] = useState<string | null>(initialError);
  const [info, setInfo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [changing, setChanging] = useState(!active);
  const [choice, setChoice] = useState<PaymentChoice | null>(() => {
    if (active) return active.method === "va" && active.channel ? { type: "va", bank: active.channel } : { type: "qris" };
    const first = methods.find((m) => !(m.type === "va" && vaDisabledReason));
    return first ? toChoice(first) : null;
  });
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  // Muat ulang data dari server (bukan bertanya ke Komerce) selama ada kode bayar aktif
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 20_000);
    return () => window.clearInterval(id);
  }, [active, router]);

  const orderDeadline = new Date(orderExpiresAt).getTime();
  const orderExpired = now !== null && now >= orderDeadline;
  const qrExpired = active?.method === "qris" && now !== null && now >= new Date(active.expiresAt).getTime();

  const create = (c: PaymentChoice | null) =>
    startTransition(async () => {
      if (!c) return;
      setError(null);
      setInfo(null);
      const res = await choosePayment(orderNumber, c);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setChanging(false);
      router.refresh();
    });

  const check = () =>
    startTransition(async () => {
      setError(null);
      setInfo(null);
      const res = await checkPayment(orderNumber);
      if (!res.ok) setError(res.error);
      else if (res.status === "menunggu_pembayaran") {
        setInfo("Pembayaran belum kami terima. Kalau baru saja membayar, tunggu sebentar lalu cek lagi.");
      }
      router.refresh();
    });

  const copy = async () => {
    if (!active?.vaNumber) return;
    try {
      await navigator.clipboard.writeText(active.vaNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard ditolak browser: nomor tetap bisa diseleksi manual
    }
  };

  const timer = now === null ? "--:--:--" : countdown(orderDeadline - now);

  return (
    <section className="flex flex-col gap-3.5 rounded-2xl border border-pay-line bg-pay-bg p-5 lg:gap-4 lg:p-7">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[15px] font-bold lg:text-[17px]">Selesaikan pembayaran</span>
          <span className="text-[13px] text-muted lg:text-sm">Batas waktu {formatDateTime(orderExpiresAt)} WIB</span>
        </div>
        <span className="text-[15px] font-bold text-status-bayar tabular-nums lg:text-[22px]">{timer}</span>
      </div>

      {orderExpired ? (
        <p className="text-sm font-semibold text-status-batal">
          Batas waktu pembayaran sudah habis. Pesanan akan dibatalkan otomatis dan stok dilepas lagi.
        </p>
      ) : (
        <>
          {active && !changing && active.method === "va" && active.vaNumber && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted lg:text-[13px]">Nomor {bankName(active.channel ?? "")} Virtual Account</span>
              <div className="flex items-center justify-between gap-3">
                <strong className="text-lg tracking-[0.04em] whitespace-nowrap select-all min-[380px]:text-xl lg:text-[26px]">{groupDigits(active.vaNumber)}</strong>
                <button
                  type="button"
                  onClick={copy}
                  className="h-9 shrink-0 rounded-full border border-line-strong bg-paper px-3.5 text-[13px] font-semibold"
                >
                  {copied ? "Tersalin" : (
                    <>
                      Salin<span className="hidden lg:inline"> nomor</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {active && !changing && active.method === "qris" && active.qr && (
            <div className="flex flex-col items-center gap-2 lg:flex-row lg:items-center lg:gap-6">
              <div className="relative rounded-xl bg-paper p-3">
                <svg
                  viewBox={`-2 -2 ${active.qr.size + 4} ${active.qr.size + 4}`}
                  className={`size-52 ${qrExpired ? "opacity-15" : ""}`}
                  shapeRendering="crispEdges"
                  role="img"
                  aria-label="Kode QRIS untuk membayar pesanan ini"
                >
                  <path d={active.qr.d} fill="#000" />
                </svg>
                {qrExpired && (
                  <span className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm font-bold">
                    QR sudah kedaluwarsa
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center gap-1 text-center text-sm lg:items-start lg:text-left">
                <span>Scan pakai GoPay, OVO, DANA, ShopeePay, atau m-banking.</span>
                {!qrExpired && now !== null && (
                  <span className="font-semibold text-status-bayar tabular-nums">
                    QR berlaku {countdown(new Date(active.expiresAt).getTime() - now).slice(3)}
                  </span>
                )}
                {qrExpired && (
                  <Button size="md" loading={pending} onClick={() => create({ type: "qris" })} className="mt-1">
                    Buat QR baru
                  </Button>
                )}
              </div>
            </div>
          )}

          {changing && (
            <div className="flex flex-col gap-3">
              <PaymentMethodPicker methods={methods} value={choice} onChange={setChoice} vaDisabledReason={vaDisabledReason} />
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <Button size="md" fullWidth className="lg:w-auto" loading={pending} disabled={!choice} onClick={() => create(choice)}>
                  {choice ? `Bayar pakai ${methodTag(choice)}` : "Pilih metode dulu"}
                </Button>
                {active && (
                  <button type="button" onClick={() => setChanging(false)} className="min-h-11 px-3 text-sm font-semibold text-slate-700">
                    Batal ganti
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted">Jumlah</span>
            <strong>{formatRupiah(total)}</strong>
          </div>
        </>
      )}

      {error && <Alert tone="error">{error}</Alert>}
      {info && <Alert tone="success">{info}</Alert>}

      {!orderExpired && active && !changing && (
        <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
          {active.paymentUrl && (
            <Button href={active.paymentUrl} variant="outline" size="md" target="_blank" rel="noopener noreferrer" className="w-full lg:w-auto">
              Lihat cara bayar
            </Button>
          )}
          <button type="button" disabled={pending} onClick={check} className="min-h-11 px-3 text-sm font-semibold text-slate-700 disabled:text-disabled">
            Sudah bayar? Cek status
          </button>
          <button type="button" disabled={pending} onClick={() => setChanging(true)} className="min-h-11 px-3 text-sm font-semibold text-slate-700 disabled:text-disabled">
            Ganti metode
          </button>
        </div>
      )}
    </section>
  );
}
