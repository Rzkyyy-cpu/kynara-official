import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Button } from "@/components/ui/Button";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Buat password baru — kynara" };

// Dibuka dari tautan di email reset. /auth/callback sudah menukar tautan itu menjadi sesi sementara,
// jadi di sini user dianggap "login" dan boleh mengganti password-nya.
export default async function ResetPasswordPage() {
  const user = await getUser();

  return (
    <AuthCard>
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[32px]/10 font-medium lg:text-4xl/[44px]">Buat password baru</h1>
        <p className="text-[15px]/6 text-muted">
          {user ? "Password baru dipakai untuk masuk berikutnya." : "Tautan reset sudah kedaluwarsa atau sudah dipakai."}
        </p>
      </div>
      {user ? (
        <ResetPasswordForm />
      ) : (
        <Button href="/lupa-password" fullWidth>
          Minta tautan baru
        </Button>
      )}
    </AuthCard>
  );
}
