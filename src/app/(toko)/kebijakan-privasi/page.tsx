import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage, StaticSection } from "@/components/ui/StaticPage";
import { whatsappDisplay, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kebijakan privasi — kynara",
  description: "Data apa yang dikumpulkan kynara, untuk apa, dan bagaimana kami menjaganya.",
};

export default function KebijakanPrivasiPage() {
  return (
    <StaticPage
      eyebrow="Bantuan"
      title="Kebijakan privasi"
      intro="Kami hanya mengumpulkan data yang diperlukan untuk memproses pesananmu, dan tidak menjualnya ke siapa pun."
      updated="30 September 2026"
    >
      <StaticSection title="Data yang kami kumpulkan">
        <ul>
          <li>Data akun: nama, email, nomor HP, dan tanggal lahir (opsional).</li>
          <li>Alamat pengiriman yang kamu simpan di buku alamat.</li>
          <li>Riwayat pesanan, isi keranjang, wishlist, dan ulasan yang kamu tulis.</li>
          <li>Kalau masuk dengan Google: nama, email, dan foto profil dari akun Google-mu.</li>
        </ul>
      </StaticSection>

      <StaticSection title="Untuk apa data dipakai">
        <ul>
          <li>Memproses, mengirim, dan memberi kabar status pesanan.</li>
          <li>Menghubungimu kalau ada kendala pesanan atau pengajuan retur.</li>
          <li>Menjaga keamanan akun, misalnya membatasi percobaan masuk yang mencurigakan.</li>
        </ul>
      </StaticSection>

      <StaticSection title="Dengan siapa data dibagikan">
        <p>Hanya dengan pihak yang dibutuhkan untuk menyelesaikan pesanan:</p>
        <ul>
          <li>Kurir pengiriman: nama, nomor HP, dan alamat tujuan.</li>
          <li>Penyedia pembayaran: nomor pesanan dan jumlah tagihan. Data kartu atau rekening tidak pernah melewati server kami.</li>
          <li>Penyedia layanan hosting dan database tempat data disimpan dengan aman.</li>
        </ul>
      </StaticSection>

      <StaticSection title="Cookie">
        <p>
          Kami memakai cookie untuk menjaga sesi login dan isi keranjang. Kami tidak memakai cookie iklan atau
          pelacak pihak ketiga.
        </p>
      </StaticSection>

      <StaticSection title="Hakmu">
        <p>
          Kamu bisa melihat dan mengubah data akun di halaman Akun kapan saja. Untuk meminta salinan data atau
          penghapusan akun, hubungi kami lewat{" "}
          <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-700 underline">
            WhatsApp {whatsappDisplay}
          </Link>
          . Data pesanan yang sudah dibayar tetap kami simpan sesuai kewajiban pencatatan transaksi.
        </p>
      </StaticSection>
    </StaticPage>
  );
}
