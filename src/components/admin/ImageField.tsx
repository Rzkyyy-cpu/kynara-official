"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { AlertIcon, TrashIcon } from "@/components/icons";
import { useImageUpload } from "@/components/admin/useImageUpload";
import { IMAGE_RULES, type ImageKind } from "@/lib/admin/images";

// Satu foto (kategori, banner desktop/HP). Foto lama baru dihapus dari Storage saat form DISIMPAN,
// jadi kalau admin batal, foto lama tetap aman.
export function ImageField({
  kind,
  value,
  onChange,
  label,
  aspect = "aspect-[4/5]",
  className = "",
}: {
  kind: ImageKind;
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
  aspect?: string;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useImageUpload(kind);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    const res = await upload(file);
    if (res.ok) onChange(res.url);
    else setError(res.error);
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[13px] font-semibold">{label}</span>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={uploading}
          aria-label={value ? `Ganti ${label.toLowerCase()}` : `Unggah ${label.toLowerCase()}`}
          className={`relative ${aspect} w-full max-w-[220px] overflow-hidden rounded-[10px] ${
            value ? "bg-line" : `border-[1.5px] border-dashed ${error ? "border-upload-error-line bg-admin-row-error" : "border-line-dashed bg-bg"}`
          } flex flex-col items-center justify-center gap-1 text-xs font-semibold text-slate-700`}
        >
          {value && <Image src={value} alt="" fill sizes="220px" className="object-cover" />}
          {!value && !uploading && (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 16V5M7 10l5-5 5 5" />
                <path d="M5 19h14" />
              </svg>
              {IMAGE_RULES[kind].label}
            </>
          )}
          {uploading && <span className="relative rounded-full bg-paper/90 px-2 py-1">Mengunggah…</span>}
        </button>
        {value && (
          <div className="flex flex-col items-start gap-2">
            <button type="button" onClick={() => input.current?.click()} className="h-9 rounded-full border border-line-strong bg-paper px-3.5 text-[13px] font-semibold">
              Ganti foto
            </button>
            <button type="button" onClick={() => onChange(null)} className="flex h-9 items-center gap-1.5 px-1 text-[13px] font-semibold text-error">
              <TrashIcon size={16} /> Hapus
            </button>
          </div>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => (pick(e.target.files?.[0]), (e.target.value = ""))} />
      {error ? (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-error">
          <AlertIcon size={14} /> {error}
        </p>
      ) : (
        <p className="text-xs text-muted">{IMAGE_RULES[kind].label} · JPG/PNG/WebP · maks. 2 MB</p>
      )}
    </div>
  );
}
