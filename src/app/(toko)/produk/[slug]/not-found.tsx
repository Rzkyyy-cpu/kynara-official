import { SearchIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";

// Tampil saat notFound() dipanggil, misalnya link produk salah atau produk sudah disembunyikan
export default function ProductNotFound() {
  return (
    <Container>
      <EmptyState
        icon={<SearchIcon size={28} />}
        title="Produk tidak ditemukan"
        description="Mungkin produknya sudah tidak dijual atau tautannya salah ketik."
      >
        <Button href="/koleksi" size="md">
          Lihat Koleksi
        </Button>
        <Button href="/" variant="outline" size="md">
          Ke Beranda
        </Button>
      </EmptyState>
    </Container>
  );
}
