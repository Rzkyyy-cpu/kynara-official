// State kosong sesuai komponen-state (contoh: "Belum ada yang cocok").
// Ikon dalam lingkaran, judul serif, penjelasan singkat, lalu tombol/aksi di bawahnya.
export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-5 py-14 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-sky-tint text-slate-700">{icon}</span>
      <h2 className="font-serif text-2xl font-medium">{title}</h2>
      <p className="max-w-sm text-[15px]/6 text-muted">{description}</p>
      {children && <div className="mt-2 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}
