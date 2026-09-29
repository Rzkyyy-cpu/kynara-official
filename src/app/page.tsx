import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ProductCard, type ProductCardData } from "@/components/ui/ProductCard";

// SEMENTARA: produk contoh untuk mengecek tampilan komponen.
// Di Fase 2 diganti "Produk terbaru" dari database.
const sampleProducts: ProductCardData[] = [
  {
    href: "#",
    name: "Segi Empat Voal Aruna",
    price: 89000,
    material: "Voal",
    tag: "Baru",
    tone: "#D9C7B0",
    colors: [
      { name: "Pasir", hex: "#D9C7B0" },
      { name: "Sage", hex: "#9DAE9B" },
      { name: "Lilac", hex: "#B8A9BF" },
    ],
  },
  {
    href: "#",
    name: "Pashmina Airflow Sekar",
    price: 79000,
    material: "Airflow",
    tag: "Baru",
    tone: "#B9C4B2",
    colors: [
      { name: "Sage", hex: "#9DAE9B" },
      { name: "Pasir", hex: "#D9C7B0" },
      { name: "Cokelat", hex: "#8E735E" },
    ],
  },
  {
    href: "#",
    name: "Bergo Instan Nara",
    price: 95000,
    material: "Jersey",
    tone: "#8E735E",
    colors: [
      { name: "Cokelat", hex: "#8E735E" },
      { name: "Hitam", hex: "#2B2B2B" },
    ],
  },
  {
    href: "#",
    name: "Pashmina Satin Lembayung Panjang Edisi Lebaran",
    price: 99000,
    material: "Satin",
    tag: "Stok terbatas",
    tone: "#B8A9BF",
    colors: [{ name: "Lilac", hex: "#B8A9BF" }],
  },
];

export default function HomePage() {
  return (
    <Container className="flex flex-col gap-10 py-10 lg:gap-16 lg:py-20">
      <section className="flex flex-col items-start gap-4">
        <span className="text-eyebrow font-semibold text-slate-700 uppercase">Koleksi terbaru</span>
        <h1 className="font-serif text-display font-medium lg:text-display-lg">
          Tenang dipakai,
          <br />
          anggun dilihat.
        </h1>
        <p className="max-w-md text-[15px]/6 text-muted lg:text-base/[26px]">
          Beranda masih kosong. Isi lengkapnya (hero, kategori, produk terbaru) dibuat di Fase 2.
        </p>
        <Button href="/koleksi">Belanja Sekarang</Button>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-serif text-section font-medium lg:text-section-lg">Contoh kartu produk</h2>
        {/* Grid produk: 2 kolom gap 12 di HP, 4 kolom gap 24 di desktop */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
          {sampleProducts.map((p) => (
            <ProductCard key={p.name} product={p} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-section font-medium lg:text-section-lg">Contoh tombol</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline">Lihat semua</Button>
          <Button variant="ghost">Reset</Button>
          <Button disabled>Stok habis</Button>
          <Button loading>Memproses…</Button>
          <Button size="sm" variant="outline">
            Admin 40px
          </Button>
        </div>
      </section>
    </Container>
  );
}
