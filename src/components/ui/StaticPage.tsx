import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";

// Kerangka halaman teks (Panduan, Tentang, Kebijakan): breadcrumb, judul serif, lalu isi.
// Lebar isi dibatasi ±720px supaya baris teks tidak terlalu panjang dan nyaman dibaca.
export function StaticPage({
  eyebrow,
  title,
  crumb,
  intro,
  updated,
  wide = false,
  children,
}: {
  eyebrow: string;
  title: string;
  crumb?: string; // label breadcrumb kalau judulnya terlalu panjang
  intro?: string;
  updated?: string; // "Terakhir diperbarui" untuk halaman kebijakan
  wide?: boolean; // Panduan memakai lebar penuh karena ada tabel bahan
  children: React.ReactNode;
}) {
  return (
    <Container className="flex flex-col gap-8 pt-4 pb-16 lg:gap-12 lg:pt-10 lg:pb-24">
      <div className="flex max-w-[720px] flex-col gap-4">
        <Breadcrumb items={[{ label: "Beranda", href: "/" }, { label: crumb ?? title }]} />
        <span className="text-eyebrow font-semibold text-slate-700 uppercase">{eyebrow}</span>
        <h1 className="font-serif text-section font-medium lg:text-section-lg">{title}</h1>
        {intro && <p className="text-[15px]/6 text-muted lg:text-[17px]/7">{intro}</p>}
        {updated && <p className="text-[13px] text-muted">Terakhir diperbarui: {updated}</p>}
      </div>
      <div className={`flex flex-col gap-10 lg:gap-14 ${wide ? "" : "max-w-[720px]"}`}>{children}</div>
    </Container>
  );
}

// Satu bagian berjudul. Gaya daftar (bullet/nomor) hanya untuk <ul>/<ol> anak langsung,
// supaya komponen lain di dalamnya (mis. kartu bahan) tidak ikut terkena.
// scroll-mt supaya judul tidak tertutup navbar sticky saat dibuka lewat #anchor.
export function StaticSection({
  id,
  title,
  children,
  className = "",
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`flex scroll-mt-24 flex-col gap-4 ${className}`}>
      <h2 className="font-serif text-2xl font-medium lg:text-[28px]/9">{title}</h2>
      <div className="flex flex-col gap-3 text-[15px]/[26px] text-ink [&>ol]:flex [&>ol]:list-decimal [&>ol]:flex-col [&>ol]:gap-2 [&>ol]:pl-5 [&>ul]:flex [&>ul]:list-disc [&>ul]:flex-col [&>ul]:gap-2 [&>ul]:pl-5 [&>ul>li]:pl-1 [&>ol>li]:pl-1">
        {children}
      </div>
    </section>
  );
}
