import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

// Avatar bulat berisi inisial (foto profil menyusul setelah Storage siap di Fase 7)
export function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  const cls = { sm: "size-12 text-base", md: "size-[52px] text-base", lg: "size-14 text-lg" }[size];
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-slate-700 font-bold text-white ${cls}`}>
      {initials}
    </span>
  );
}

// Judul halaman akun: di HP ada tombol kembali ke /akun, di desktop judul serif besar.
export function AccountTitle({ title, mobileTitle }: { title: string; mobileTitle?: string }) {
  return (
    <div className="-ml-3 flex items-center gap-1 lg:ml-0">
      <Link href="/akun" aria-label="Kembali ke Akun" className="flex size-11 items-center justify-center lg:hidden">
        <ChevronLeftIcon />
      </Link>
      <h1 className="font-serif text-[28px]/9 font-medium tracking-[-0.01em] lg:text-[40px]/[48px]">
        {mobileTitle ? (
          <>
            <span className="lg:hidden">{mobileTitle}</span>
            <span className="hidden lg:inline">{title}</span>
          </>
        ) : (
          title
        )}
      </h1>
    </div>
  );
}

// Kartu putih pembungkus bagian (Data diri, Buku alamat, Ubah password)
export function SectionCard({ title, aside, children }: { title?: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-line bg-paper p-5 lg:p-7">
      {(title || aside) && (
        <div className="flex items-center justify-between gap-3">
          {title && <h2 className="text-lg font-bold lg:text-xl">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
