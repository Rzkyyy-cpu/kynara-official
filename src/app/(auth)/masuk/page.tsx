import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading, AuthSplit, OrDivider } from "@/components/auth/AuthSplit";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { LoginForm } from "@/components/auth/LoginForm";
import { Alert } from "@/components/form/Alert";
import { safeNextPath } from "@/lib/validation/auth";

export const metadata: Metadata = { title: "Masuk — kynara" };

// Pesan untuk ?error=... (dikirim /auth/callback atau aksi Google)
const ERRORS: Record<string, string> = {
  tautan: "Tautan sudah kedaluwarsa atau sudah pernah dipakai. Silakan masuk, atau minta tautan baru.",
  google: "Login dengan Google belum berhasil. Coba lagi, atau masuk dengan email.",
};

export default async function MasukPage({ searchParams }: PageProps<"/masuk">) {
  const sp = await searchParams;
  const next = safeNextPath(sp.next);
  const error = typeof sp.error === "string" ? ERRORS[sp.error] : undefined;

  return (
    <AuthSplit
      tone="slate"
      asideBottom={
        <p className="max-w-[420px] font-serif text-[34px]/[44px] font-medium italic">Tenang dipakai, anggun dilihat.</p>
      }
    >
      <AuthHeading title="Masuk" subtitle="Masuk untuk melacak pesanan dan menyimpan wishlist." />
      {error && <Alert tone="error">{error}</Alert>}
      <GoogleButton label="Masuk dengan Google" next={next} />
      <OrDivider>atau dengan email</OrDivider>
      <LoginForm next={next} />
      <p className="text-center text-sm">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-bold text-slate-700">
          Daftar
        </Link>
      </p>
    </AuthSplit>
  );
}
