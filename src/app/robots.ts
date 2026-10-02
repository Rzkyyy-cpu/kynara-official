import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// robots.txt = papan "dilarang masuk" untuk mesin pencari. Ini hanya permintaan sopan, BUKAN
// pengaman: halaman akun & admin tetap dijaga login + RLS. Tujuannya agar Google tidak
// membuang waktu merayapi halaman pribadi yang isinya kosong bagi pengunjung tanpa login.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/akun", "/checkout", "/keranjang", "/api/", "/auth/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
