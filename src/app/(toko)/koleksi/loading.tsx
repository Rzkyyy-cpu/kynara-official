import { Container } from "@/components/ui/Container";
import { ProductGridSkeleton, Skeleton } from "@/components/ui/Skeleton";

// Ditampilkan otomatis oleh Next.js selama data halaman Koleksi sedang diambil
export default function Loading() {
  return (
    <Container className="flex flex-col gap-5 pt-5 pb-12 lg:pt-7">
      <span className="sr-only" role="status">
        Memuat katalog…
      </span>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-12 w-full max-w-md rounded-full" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>
      <ProductGridSkeleton count={6} className="lg:grid-cols-3 lg:pl-[230px]" />
    </Container>
  );
}
