"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { forgotPassword } from "@/app/(auth)/actions";
import { Alert } from "@/components/form/Alert";
import { TextField } from "@/components/form/Field";
import { SubmitButton } from "@/components/form/SubmitButton";
import { MailIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { initialFormState } from "@/lib/form";

const RESEND_SECONDS = 60;

// "nadia@gmail.com" -> "na***@gmail.com" (sesuai desain, email tidak ditampilkan utuh)
const maskEmail = (email: string) => email.replace(/^(.{0,2})[^@]*/, "$1***");

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPassword, initialFormState);

  if (state.success) return <SentView email={state.success} resend={action} />;

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[32px]/10 font-medium lg:text-4xl/[44px]">Lupa password</h1>
        <p className="text-[15px]/6 text-muted">Masukkan email akunmu. Kami kirim tautan untuk membuat password baru.</p>
      </div>
      <form action={action} noValidate className="flex flex-col gap-5">
        {state.error && <Alert tone="error">{state.error}</Alert>}
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          defaultValue={state.values?.email}
          error={state.fieldErrors?.email}
          required
        />
        <SubmitButton fullWidth pendingLabel="Mengirim…">
          Kirim Tautan Reset
        </SubmitButton>
      </form>
      <Link href="/masuk" className="flex min-h-11 items-center justify-center text-[15px] font-semibold text-slate-700 lg:hidden">
        Kembali ke halaman Masuk
      </Link>
    </>
  );
}

// Tampilan "Cek emailmu" + tombol kirim ulang dengan hitung mundur.
// Jawabannya sengaja tidak menyebut apakah email terdaftar (lihat forgotPassword di actions.ts).
function SentView({ email, resend }: { email: string; resend: (formData: FormData) => void }) {
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  return (
    <div role="status" className="flex flex-col items-center gap-4 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-sky-tint text-slate-700">
        <MailIcon size={34} />
      </span>
      <h1 className="font-serif text-[32px]/10 font-medium">Cek emailmu</h1>
      <p className="text-[15px]/6 text-muted">
        Kalau <strong className="text-ink">{maskEmail(email)}</strong> terdaftar, tautan reset sudah dikirim ke sana. Cek juga
        folder spam kalau belum masuk dalam 5 menit.
      </p>
      <Button href="/masuk" fullWidth>
        Kembali ke Masuk
      </Button>
      <form action={resend} onSubmit={() => setSeconds(RESEND_SECONDS)} className="w-full">
        <input type="hidden" name="email" value={email} />
        <SubmitButton variant="outline" fullWidth disabled={seconds > 0} pendingLabel="Mengirim…">
          {seconds > 0 ? `Kirim ulang dalam 00:${String(seconds).padStart(2, "0")}` : "Kirim ulang tautan"}
        </SubmitButton>
      </form>
    </div>
  );
}
