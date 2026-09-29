// Pembungkus konten: lebar maksimum 1440px, jarak tepi 20px di HP dan 80px di desktop.
export function Container({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`mx-auto w-full max-w-[1440px] px-5 lg:px-20 ${className}`}>{children}</div>;
}
