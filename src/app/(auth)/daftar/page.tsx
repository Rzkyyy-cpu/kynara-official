import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading, AuthSplit, OrDivider } from "@/components/auth/AuthSplit";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { CheckIcon } from "@/components/icons";

// Halaman akun tidak perlu muncul di Google (noindex), tapi description tetap dipakai saat link dibagikan.
export const metadata: Metadata = {
  title: "Daftar — kynara",
  description: "Buat akun kynara gratis supaya belanja berikutnya lebih cepat dan pesanan mudah dilacak.",
  robots: { index: false },
};

const BENEFITS = [
  "Checkout lebih cepat, alamat tersimpan",
  "Pantau status dan resi pesanan",
  "Simpan produk favorit di wishlist",
];

export default function DaftarPage() {
  return (
    <AuthSplit
      tone="pink"
      asideBottom={
        <ul className="flex max-w-[380px] flex-col gap-3 rounded-2xl bg-[rgba(255,253,249,0.9)] px-6 py-5 text-[15px]">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-2.5">
              <CheckIcon size={18} className="shrink-0 text-slate-700" />
              {b}
            </li>
          ))}
        </ul>
      }
    >
      <AuthHeading title="Buat akun" subtitle="Daftar sekali, belanja berikutnya jadi lebih cepat." />
      <GoogleButton label="Daftar dengan Google" />
      <OrDivider>atau isi data</OrDivider>
      <RegisterForm />
      <p className="text-center text-sm">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-bold text-slate-700">
          Masuk
        </Link>
      </p>
    </AuthSplit>
  );
}
