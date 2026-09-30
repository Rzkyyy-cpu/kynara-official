// Kotak abu-abu berdenyut sebagai pengganti konten yang sedang dimuat (state loading di komponen-state)
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-input bg-line ${className}`} aria-hidden="true" />;
}

export function ProductGridSkeleton({ count = 8, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 lg:gap-6 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-2.5">
          <Skeleton className="aspect-[4/5] rounded-photo" />
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}
