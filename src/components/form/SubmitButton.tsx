"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

// Tombol kirim yang otomatis menampilkan spinner "Memproses…" selama server action berjalan.
// useFormStatus membaca status <form> terdekat, jadi tombol ini harus berada DI DALAM <form>.
export function SubmitButton({
  children,
  pendingLabel = "Memproses…",
  ...rest
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "outline" | "ghost";
  size?: "lg" | "md" | "sm";
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} {...rest}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
