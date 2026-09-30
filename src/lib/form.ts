import type { z } from "zod";

// Bentuk hasil yang dikembalikan server action ke form (dipakai dengan useActionState).
export type FormState = {
  error?: string; // pesan umum di kotak merah atas form
  success?: string; // pesan berhasil
  fieldErrors?: Record<string, string>; // pesan per kolom, di bawah input
  values?: Record<string, string>; // isian sebelumnya, supaya form tidak kosong lagi setelah error
};

export const initialFormState: FormState = {};

// FormData -> objek biasa (hanya nilai teks)
export function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  formData.forEach((v, k) => {
    if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  });
  return out;
}

// Error Zod -> satu pesan pertama per kolom
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

// Password tidak pernah dikembalikan ke browser
export function withoutSecrets(values: Record<string, string>) {
  const rest = { ...values };
  for (const k of Object.keys(rest)) if (/password|confirm/i.test(k)) delete rest[k];
  return rest;
}

export function invalid(error: z.ZodError, formData: FormData): FormState {
  return { fieldErrors: fieldErrorsOf(error), values: withoutSecrets(formValues(formData)) };
}
