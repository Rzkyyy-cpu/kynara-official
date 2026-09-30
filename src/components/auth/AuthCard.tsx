import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

// Kerangka halaman Lupa password & Buat password baru (desktop/mobile-akun-checkout/03):
//  - Desktop: header dengan logo + "Kembali ke Masuk", isi dalam kartu putih 480px di tengah.
//  - HP: header kecil (kembali + logo), isi langsung tanpa kartu.
export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="grid h-14 grid-cols-[44px_1fr_44px] items-center px-2 lg:flex lg:h-20 lg:justify-between lg:border-b lg:border-line lg:px-20">
        <Link href="/masuk" aria-label="Kembali ke Masuk" className="flex size-11 items-center justify-center lg:hidden">
          <ChevronLeftIcon />
        </Link>
        <Link href="/" className="text-center font-serif text-2xl font-medium lg:text-[30px]">
          kynara
        </Link>
        <Link
          href="/masuk"
          className="hidden min-h-11 items-center gap-1.5 text-[15px] font-semibold text-slate-700 lg:flex"
        >
          <ChevronLeftIcon size={18} /> Kembali ke Masuk
        </Link>
      </header>
      <main className="flex flex-1 justify-center px-5 py-6 lg:items-center">
        <div className="flex w-full max-w-[480px] flex-col gap-5 lg:rounded-[20px] lg:border lg:border-line lg:bg-paper lg:p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
