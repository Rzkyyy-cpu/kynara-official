"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

// Komponen kolom form sesuai desain akun: label 13px tebal, input tinggi 48px sudut 12px,
// border merah + pesan di bawah kalau ada error. Pesan error dihubungkan ke input lewat
// aria-describedby, supaya pembaca layar ikut membacakannya.

export const inputCls =
  "h-12 w-full rounded-input border bg-paper px-3.5 text-[15px] text-ink placeholder:text-muted " +
  "focus:outline-2 focus:outline-offset-1 focus:outline-slate disabled:bg-bg disabled:text-muted";

const borderCls = (error?: string) => (error ? "border-error-field" : "border-line-strong");

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  labelAside?: React.ReactNode; // mis. link "Lupa password?" di kanan label
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">;

function FieldShell({
  id,
  label,
  error,
  hint,
  optional,
  labelAside,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  labelAside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-5 items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-semibold">
          {label} {optional && <span className="font-normal text-muted">(opsional)</span>}
        </label>
        {labelAside}
      </div>
      {children}
      {error ? (
        <span id={`${id}-err`} className="text-xs font-medium text-error-field">
          {error}
        </span>
      ) : (
        hint && (
          <span id={`${id}-hint`} className="text-xs text-muted">
            {hint}
          </span>
        )
      )}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-err` : hint ? `${id}-hint` : undefined;

export function TextField({ label, name, error, hint, optional, labelAside, id, className = "", ...input }: FieldProps) {
  const fid = id ?? `f-${name}`;
  return (
    <FieldShell id={fid} label={label} error={error} hint={hint} optional={optional} labelAside={labelAside}>
      <input
        id={fid}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fid, error, hint)}
        className={`${inputCls} ${borderCls(error)} ${className}`}
        {...input}
      />
    </FieldShell>
  );
}

// Password dengan tombol mata untuk menampilkan/menyembunyikan isian
export function PasswordField({ label, name, error, hint, labelAside, id, ...input }: FieldProps) {
  const [show, setShow] = useState(false);
  const fid = id ?? `f-${name}`;
  return (
    <FieldShell id={fid} label={label} error={error} hint={hint} labelAside={labelAside}>
      <div className="relative">
        <input
          id={fid}
          name={name}
          type={show ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fid, error, hint)}
          className={`${inputCls} ${borderCls(error)} pr-[52px]`}
          {...input}
        />
        <button
          type="button"
          aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          aria-pressed={show}
          onClick={() => setShow((s) => !s)}
          className="absolute top-0.5 right-0.5 flex size-11 items-center justify-center text-muted"
        >
          {show ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
        </button>
      </div>
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  name,
  error,
  optional,
  id,
  ...rest
}: { label: string; name: string; error?: string; optional?: boolean } & Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "name"
>) {
  const fid = id ?? `f-${name}`;
  return (
    <FieldShell id={fid} label={label} error={error} optional={optional}>
      <textarea
        id={fid}
        name={name}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fid, error)}
        className={`${inputCls} h-auto min-h-24 py-3 ${borderCls(error)}`}
        {...rest}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  name,
  error,
  id,
  children,
  ...rest
}: { label: string; name: string; error?: string } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name">) {
  const fid = id ?? `f-${name}`;
  return (
    <FieldShell id={fid} label={label} error={error}>
      <select
        id={fid}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fid, error)}
        className={`${inputCls} ${borderCls(error)} truncate pr-8`}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function Checkbox({
  name,
  children,
  error,
  ...rest
}: { name: string; children: React.ReactNode; error?: string } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "name" | "type"
>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex min-h-8 cursor-pointer items-start gap-2.5 text-sm/[21px]">
        <input
          type="checkbox"
          name={name}
          aria-invalid={error ? true : undefined}
          className="mt-0.5 size-[18px] shrink-0 accent-slate-700"
          {...rest}
        />
        <span>{children}</span>
      </label>
      {error && <span className="text-xs font-medium text-error-field">{error}</span>}
    </div>
  );
}
