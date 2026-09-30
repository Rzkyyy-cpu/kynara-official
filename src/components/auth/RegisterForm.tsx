"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { register } from "@/app/(auth)/actions";
import { Alert } from "@/components/form/Alert";
import { Checkbox, PasswordField, TextField } from "@/components/form/Field";
import { SubmitButton } from "@/components/form/SubmitButton";
import { Button } from "@/components/ui/Button";
import { initialFormState } from "@/lib/form";

export function RegisterForm() {
  const [state, action] = useActionState(register, initialFormState);
  const [agree, setAgree] = useState(state.values?.agree === "on");
  const fe = state.fieldErrors ?? {};

  if (state.success) {
    return (
      <div className="flex flex-col gap-5">
        <Alert tone="success">{state.success}</Alert>
        <p className="text-sm/[21px] text-muted">
          Belum menerima email dalam 5 menit? Cek folder spam, atau daftar ulang dengan email yang sama.
        </p>
        <Button href="/masuk" fullWidth>
          Ke halaman Masuk
        </Button>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {/* Nama & WhatsApp: berdampingan di desktop, bertumpuk di HP */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
        <TextField
          label="Nama lengkap"
          name="fullName"
          autoComplete="name"
          defaultValue={state.values?.fullName}
          error={fe.fullName}
          required
        />
        <TextField
          label="Nomor WhatsApp"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="08xx xxxx xxxx"
          defaultValue={state.values?.phone}
          error={fe.phone}
          required
        />
      </div>
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="nama@email.com"
        defaultValue={state.values?.email}
        error={fe.email}
        required
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        placeholder="Minimal 8 karakter"
        hint="Gunakan minimal 8 karakter, campur huruf dan angka."
        error={fe.password}
        required
      />
      {/* Tombol Buat Akun nonaktif sampai persetujuan dicentang (sesuai desain) */}
      <Checkbox name="agree" checked={agree} onChange={(e) => setAgree(e.target.checked)} error={fe.agree}>
        Saya setuju dengan{" "}
        <Link href="/syarat-ketentuan" className="text-slate-700 underline">
          Syarat &amp; Ketentuan
        </Link>{" "}
        dan{" "}
        <Link href="/kebijakan-privasi" className="text-slate-700 underline">
          Kebijakan Privasi
        </Link>
        .
      </Checkbox>
      <SubmitButton fullWidth disabled={!agree}>
        Buat Akun
      </SubmitButton>
    </form>
  );
}
