"use client";

import { useActionState } from "react";
import { resetPassword } from "@/app/(auth)/actions";
import { Alert } from "@/components/form/Alert";
import { PasswordField } from "@/components/form/Field";
import { SubmitButton } from "@/components/form/SubmitButton";
import { initialFormState } from "@/lib/form";

export function ResetPasswordForm() {
  const [state, action] = useActionState(resetPassword, initialFormState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <PasswordField
        label="Password baru"
        name="password"
        autoComplete="new-password"
        placeholder="Minimal 8 karakter"
        hint="Gunakan minimal 8 karakter, campur huruf dan angka."
        error={fe.password}
        required
      />
      <PasswordField
        label="Ulangi password baru"
        name="confirm"
        autoComplete="new-password"
        error={fe.confirm}
        required
      />
      <SubmitButton fullWidth>Simpan Password</SubmitButton>
    </form>
  );
}
