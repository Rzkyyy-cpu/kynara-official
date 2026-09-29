import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { DEMO_CART_COUNT } from "@/lib/navigation";
import "./globals.css";

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
});

export const metadata: Metadata = {
  title: "kynara — Kerudung & Busana Muslimah",
  description:
    "Kerudung dan busana muslimah dengan bahan pilihan dan jahitan rapi, untuk dipakai setiap hari.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} ${playfair.variable} antialiased`}>
      {/* pb-16 di HP supaya konten paling bawah tidak tertutup bottom nav */}
      <body className="flex min-h-dvh flex-col pb-16 font-sans lg:pb-0">
        <Navbar cartCount={DEMO_CART_COUNT} />
        <main className="flex-1">{children}</main>
        <Footer />
        <BottomNav cartCount={DEMO_CART_COUNT} />
      </body>
    </html>
  );
}
