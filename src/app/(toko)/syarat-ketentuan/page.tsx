import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage, StaticSection } from "@/components/ui/StaticPage";

export const metadata: Metadata = {
  title: "Syarat & ketentuan — kynara",
  description: "Syarat dan ketentuan berbelanja di kynara.",
};

export default function SyaratKetentuanPage() {
  return (
    <StaticPage
      eyebrow="Bantuan"
      title="Syarat & ketentuan"
      intro="Dengan membuat akun atau memesan di kynara, kamu menyetujui ketentuan berikut."
      updated="30 September 2026"
    >
      <StaticSection title="1. Akun">
        <ul>
          <li>Data yang kamu isi (nama, email, nomor HP, alamat) harus benar supaya pesanan bisa dikirim.</li>
          <li>Kamu bertanggung jawab menjaga kerahasiaan password akunmu.</li>
          <li>Kami dapat menonaktifkan akun yang dipakai untuk penipuan atau penyalahgunaan.</li>
        </ul>
      </StaticSection>

      <StaticSection title="2. Harga & stok">
        <ul>
          <li>Harga tertera dalam Rupiah dan dapat berubah sewaktu-waktu. Harga yang berlaku adalah harga saat pesanan dibuat.</li>
          <li>Stok dipesan untukmu saat pesanan dibuat, dan dilepas kembali kalau pembayaran tidak diselesaikan.</li>
          <li>Warna di foto bisa sedikit berbeda dengan aslinya karena pengaturan layar.</li>
        </ul>
      </StaticSection>

      <StaticSection title="3. Pembayaran">
        <ul>
          <li>Pesanan harus dibayar dalam 24 jam sejak dibuat. Lewat dari itu, pesanan dibatalkan otomatis.</li>
          <li>Pembayaran diproses oleh penyedia pembayaran resmi. kynara tidak menyimpan data kartu atau rekeningmu.</li>
        </ul>
      </StaticSection>

      <StaticSection title="4. Pengiriman">
        <ul>
          <li>Pesanan yang sudah dibayar dikirim di hari kerja berikutnya lewat kurir yang kamu pilih.</li>
          <li>Perkiraan waktu tiba berasal dari kurir dan bisa berubah di luar kendali kami.</li>
          <li>Pastikan alamat lengkap. Paket yang kembali karena alamat salah dikirim ulang dengan ongkos dari pemesan.</li>
        </ul>
      </StaticSection>

      <StaticSection title="5. Tukar & retur">
        <p>
          Ketentuan tukar dan retur ada di halaman{" "}
          <Link href="/kebijakan-retur" className="font-semibold text-slate-700 underline">
            Kebijakan retur
          </Link>
          .
        </p>
      </StaticSection>

      <StaticSection title="6. Perubahan ketentuan">
        <p>
          Ketentuan ini dapat diperbarui. Tanggal pembaruan terakhir tertulis di atas halaman ini. Ketentuan yang
          berlaku adalah yang aktif saat pesanan dibuat.
        </p>
      </StaticSection>
    </StaticPage>
  );
}
