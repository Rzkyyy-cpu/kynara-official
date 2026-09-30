// Pembungkus konten: lebar maksimum 1440px, jarak tepi 20px di HP dan 80px di desktop.
// "as" untuk mengganti elemen HTML-nya, misalnya <section> supaya struktur halaman lebih jelas.
export function Container({
  as: Tag = "div",
  className = "",
  children,
}: {
  as?: "div" | "section";
  className?: string;
  children: React.ReactNode;
}) {
  return <Tag className={`mx-auto w-full max-w-[1440px] px-5 lg:px-20 ${className}`}>{children}</Tag>;
}
