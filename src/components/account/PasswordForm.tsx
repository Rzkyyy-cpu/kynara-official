"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/(toko)/akun/actions";
import { Alert } from "@/components/form/Alert";
import { PasswordField } from "@/components/form/Field";
import { SubmitButton } from "@/components/form/SubmitButton";
import { initialFormState } from "@/lib/form";

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, initialFormState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.success && <Alert tone="success">{state.success}</Alert>}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-x-5">
        <PasswordField label="Password lama" name="currentPassword" autoComplete="current-password" error={fe.currentPassword} />
        <PasswordField
          label="Password baru"
          name="password"
          autoComplete="new-password"
          error={fe.password}
          hint="Minimal 8 karakter, campur huruf dan angka."
        />
        <PasswordField label="Ulangi password baru" name="confirm" autoComplete="new-password" error={fe.confirm} />
      </div>
      <SubmitButton variant="outline" size="md" pendingLabel="Memperbarui…" className="w-full lg:w-auto lg:self-start">
        Perbarui Password
      </SubmitButton>
    </form>
  );
}
