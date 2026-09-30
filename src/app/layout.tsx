import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Layout paling luar: hanya <html>, <body>, dan font.
// Navbar/footer ada di (toko)/layout.tsx, karena halaman login (auth) memakai tampilan tanpa navbar.
// Folder berkurung seperti (toko) dan (auth) = "route group": hanya pengelompokan, tidak muncul di URL.

// next/font mengunduh font saat build lalu menyajikannya dari server kita sendiri,
// jadi browser pengunjung tidak perlu memuat dari Google (lebih cepat & tanpa layout bergeser).
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "kynara — Kerudung & Busana Muslimah",
  description:
    "Kerudung dan busana muslimah dengan bahan pilihan dan jahitan rapi, untuk dipakai setiap hari.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} ${playfair.variable} antialiased`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
