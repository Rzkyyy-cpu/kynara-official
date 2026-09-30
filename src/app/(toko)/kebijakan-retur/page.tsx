import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage, StaticSection } from "@/components/ui/StaticPage";
import { site, whatsappDisplay, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kebijakan retur — kynara",
  description: "Syarat dan cara tukar atau retur produk kynara untuk produk cacat atau salah kirim.",
};

const hari = site.hariRetur ?? "[X]";

export default function KebijakanReturPage() {
  return (
    <StaticPage
      eyebrow="Bantuan"
      title="Kebijakan retur"
      intro={`Tukar atau retur bisa diajukan maksimal ${hari} hari setelah paket diterima, untuk produk cacat atau salah kirim.`}
      updated="30 September 2026"
    >
      <StaticSection title="Yang bisa diretur">
        <ul>
          <li>Produk cacat produksi: sobek, noda, jahitan lepas, atau lubang.</li>
          <li>Produk tidak sesuai pesanan: salah warna, salah ukuran, atau salah model.</li>
          <li>Jumlah barang kurang dari yang tertulis di pesanan.</li>
        </ul>
      </StaticSection>

      <StaticSection title="Yang tidak bisa diretur">
        <ul>
          <li>Berubah pikiran, atau ukuran tidak cocok padahal sudah sesuai yang tertulis di halaman produk.</li>
          <li>Perbedaan warna tipis karena pengaturan layar HP.</li>
          <li>Produk yang sudah dipakai, dicuci, atau labelnya dilepas.</li>
          <li>Pengajuan yang melewati {hari} hari sejak paket diterima.</li>
        </ul>
      </StaticSection>

      <StaticSection title="Syarat pengajuan">
        <ul>
          <li>
            <strong>Video unboxing wajib</strong>: rekam tanpa jeda dari paket masih tersegel sampai produk
            dikeluarkan.
          </li>
          <li>Foto bagian yang cacat atau tidak sesuai.</li>
          <li>Nomor pesanan (bisa dilihat di Akun &gt; Pesanan).</li>
        </ul>
      </StaticSection>

      <StaticSection title="Cara mengajukan">
        <ol>
          <li>
            Hubungi kami lewat{" "}
            <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-700 underline">
              WhatsApp {whatsappDisplay}
            </Link>{" "}
            dalam {hari} hari setelah paket diterima, kirim nomor pesanan, video unboxing, dan foto.
          </li>
          <li>Kami cek dan beri jawaban paling lambat 2 hari kerja.</li>
          <li>Kalau disetujui, kirim produk kembali ke alamat yang kami berikan. Ongkos kirim retur kami ganti.</li>
          <li>Setelah produk kami terima, kami kirim pengganti atau kembalikan dana sesuai pilihanmu.</li>
        </ol>
      </StaticSection>

      <StaticSection title="Pengembalian dana">
        <p>
          Dana dikembalikan ke rekening atau e-wallet atas nama pemesan dalam 3 hari kerja setelah produk retur
          kami terima, sebesar harga produk yang diretur. Kalau seluruh pesanan diretur karena kesalahan kami,
          ongkos kirim awal ikut dikembalikan.
        </p>
      </StaticSection>
    </StaticPage>
  );
}
