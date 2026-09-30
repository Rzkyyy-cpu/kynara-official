"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/(auth)/actions";
import { Alert } from "@/components/form/Alert";
import { Checkbox, PasswordField, TextField } from "@/components/form/Field";
import { SubmitButton } from "@/components/form/SubmitButton";
import { initialFormState } from "@/lib/form";

// useActionState: menghubungkan <form> dengan server action.
// "state" berisi hasil terakhir dari server (error per kolom, pesan umum), "action" dipasang di <form>.
export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(login, initialFormState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      {state.error && (
        <Alert tone="error">
          {state.error}{" "}
          {state.error.includes("belum cocok") && (
            <>
              Coba lagi, atau{" "}
              <Link href="/lupa-password" className="font-semibold text-error underline">
                reset password
              </Link>
              .
            </>
          )}
        </Alert>
      )}
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
        autoComplete="current-password"
        placeholder="Minimal 8 karakter"
        error={fe.password}
        required
        labelAside={
          <Link href="/lupa-password" className="flex min-h-8 items-center text-[13px] font-semibold text-slate-700">
            Lupa password?
          </Link>
        }
      />
      <Checkbox name="remember" defaultChecked={state.values?.remember === "on"}>
        Ingat saya di perangkat ini
      </Checkbox>
      <SubmitButton fullWidth>Masuk</SubmitButton>
    </form>
  );
}
