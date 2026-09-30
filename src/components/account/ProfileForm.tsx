"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/(toko)/akun/actions";
import { Alert } from "@/components/form/Alert";
import { TextField } from "@/components/form/Field";
import { SubmitButton } from "@/components/form/SubmitButton";
import { initialFormState } from "@/lib/form";

export function ProfileForm({
  initial,
  email,
  emailNote,
}: {
  initial: { fullName: string; phone: string; birthDate: string };
  email: string;
  emailNote: string;
}) {
  const [state, action] = useActionState(updateProfile, initialFormState);
  const fe = state.fieldErrors ?? {};
  const v = state.values;

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.success && <Alert tone="success">{state.success}</Alert>}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-x-5">
        <TextField
          label="Nama lengkap"
          name="fullName"
          autoComplete="name"
          defaultValue={v?.fullName ?? initial.fullName}
          error={fe.fullName}
        />
        <TextField
          label="Nomor WhatsApp"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="08xx xxxx xxxx"
          defaultValue={v?.phone ?? initial.phone}
          error={fe.phone}
        />
        {/* Email hanya-baca dulu: mengganti email butuh konfirmasi lewat email (menunggu SMTP siap) */}
        <TextField label="Email" name="email" type="email" value={email} readOnly className="text-muted" hint={emailNote} />
        <TextField
          label="Tanggal lahir"
          name="birthDate"
          type="date"
          optional
          defaultValue={v?.birthDate ?? initial.birthDate}
          error={fe.birthDate}
        />
      </div>
      <SubmitButton size="md" pendingLabel="Menyimpan…" className="w-full lg:w-auto lg:self-start">
        Simpan Perubahan
      </SubmitButton>
    </form>
  );
}
