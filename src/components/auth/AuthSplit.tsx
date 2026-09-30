import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

// Kerangka halaman Masuk & Daftar (desktop-akun-checkout/01-02, mobile-akun-checkout/01-02):
//  - Desktop: dua kolom. Kiri panel berwarna dengan logo, siluet, dan isi bawah; kanan form.
//  - HP: header kecil (tombol kembali + logo di tengah), lalu form. Panel disembunyikan.
export function AuthSplit({
  tone,
  asideBottom,
  children,
}: {
  tone: "slate" | "pink";
  asideBottom: React.ReactNode;
  children: React.ReactNode;
}) {
  const dark = tone === "slate";
  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-2">
      <aside
        className={`relative m-6 mr-0 hidden flex-col justify-between overflow-hidden rounded-[20px] p-10 lg:flex ${
          dark ? "bg-slate text-white" : "bg-pink text-ink"
        }`}
      >
        <svg
          viewBox="0 0 80 100"
          preserveAspectRatio="xMidYMax meet"
          aria-hidden="true"
          className="absolute bottom-0 left-[22%] h-[82%] w-[56%]"
        >
          <path
            d="M40 12c-11 0-19 9-19 21 0 5 1.5 9.5 3.5 13C15 52 8 64 6 100h68c-2-36-9-48-18.5-54 2-3.5 3.5-8 3.5-13 0-12-8-21-19-21z"
            fill="#FFFFFF"
            fillOpacity={dark ? 0.28 : 0.3}
          />
        </svg>
        <Link href="/" className="relative self-start font-serif text-[32px] font-medium">
          kynara
        </Link>
        <div className="relative">{asideBottom}</div>
      </aside>

      <div className="flex flex-col">
        {/* Header HP */}
        <header className="grid h-14 grid-cols-[44px_1fr_44px] items-center px-2 lg:hidden">
          <Link href="/" aria-label="Kembali ke beranda" className="flex size-11 items-center justify-center">
            <ChevronLeftIcon />
          </Link>
          <Link href="/" className="text-center font-serif text-2xl font-medium">
            kynara
          </Link>
        </header>
        <main className="flex flex-1 justify-center px-5 py-6 lg:items-center lg:p-10">
          <div className="flex w-full max-w-[440px] flex-col gap-5">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-serif text-[32px]/10 font-medium tracking-[-0.01em] lg:text-[40px]/[48px]">{title}</h1>
      <p className="text-[15px]/6 text-muted">{subtitle}</p>
    </div>
  );
}

export function OrDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[13px] text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
      {children}
    </div>
  );
}
