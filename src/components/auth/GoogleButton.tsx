"use client";

import { useFormStatus } from "react-dom";
import { signInWithGoogle } from "@/app/(auth)/actions";

// Tombol "Masuk/Daftar dengan Google". Berupa form kecil yang memanggil server action,
// lalu server mengarahkan browser ke halaman login Google.
function Inner({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className="inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full border border-line-strong bg-paper px-5 text-[15px] font-semibold text-ink disabled:opacity-70"
    >
      <span
        aria-hidden="true"
        className="inline-flex size-[22px] items-center justify-center rounded-full border-[1.5px] border-ink text-xs font-bold"
      >
        G
      </span>
      {pending ? "Mengalihkan ke Google…" : label}
    </button>
  );
}

export function GoogleButton({ label, next }: { label: string; next?: string }) {
  return (
    <form action={signInWithGoogle}>
      {next && <input type="hidden" name="next" value={next} />}
      <Inner label={label} />
    </form>
  );
}
