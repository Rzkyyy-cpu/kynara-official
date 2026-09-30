import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <Container className="flex flex-col gap-5 pt-5 pb-12 lg:pt-7">
      <span className="sr-only" role="status">
        Memuat produk…
      </span>
      <Skeleton className="h-4 w-56" />
      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
        <Skeleton className="aspect-[4/5] rounded-card" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-11 w-60 rounded-full" />
          <Skeleton className="h-12 w-72" />
          <Skeleton className="h-[52px] w-full rounded-full" />
        </div>
      </div>
    </Container>
  );
}
