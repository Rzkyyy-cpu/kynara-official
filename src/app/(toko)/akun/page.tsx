import { redirect } from "next/navigation";

// /akun langsung membuka Riwayat pesanan (halaman utama akun di desain), membawa ?pesan=... kalau ada.
export default async function AkunPage({ searchParams }: PageProps<"/akun">) {
  const { pesan } = await searchParams;
  redirect(typeof pesan === "string" ? `/akun/pesanan?pesan=${encodeURIComponent(pesan)}` : "/akun/pesanan");
}
