import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

// Gambar pratinjau 1200×630 saat link kynara dibagikan (WhatsApp, Facebook, X).
// Dibuat SEKALI saat build dari JSX di bawah, lalu disajikan sebagai file PNG biasa.
// Halaman produk menggantinya dengan foto produk (lihat generateMetadata di produk/[slug]).
// ImageResponse tidak membaca class Tailwind, jadi warna ditulis langsung (nilai token globals.css).
export const alt = "kynara — Kerudung & Busana Muslimah";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#fff6f5" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px" }}>
          <div style={{ fontSize: 120, color: "#34496a", letterSpacing: -2 }}>{site.name}</div>
          <div style={{ marginTop: 12, fontSize: 40, color: "#4a6588" }}>Kerudung & Busana Muslimah</div>
          <div style={{ marginTop: 32, fontSize: 28, lineHeight: 1.4, color: "#5e5a62", maxWidth: 640 }}>{site.tagline}</div>
        </div>
        {/* Blok warna dari palet (pink, sky, blush) sebagai pengganti foto */}
        <div style={{ width: 360, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 3, background: "#f4c9cb" }} />
          <div style={{ flex: 2, background: "#9fc7d5" }} />
          <div style={{ flex: 1, background: "#fde9e9" }} />
        </div>
      </div>
    ),
    size,
  );
}
