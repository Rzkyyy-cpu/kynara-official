"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { AlertIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/icons";
import { useImageUpload } from "@/components/admin/useImageUpload";
import { IMAGE_RULES } from "@/lib/admin/images";

// Foto produk (admin-desktop/04, "Foto produk"). Foto pertama = sampul di kartu produk.
// Urutan diubah dengan tombol panah (pengganti seret, tanpa library tambahan).

export const MAX_PRODUCT_IMAGES = 8;

export function ProductImages({ images, onChange }: { images: string[]; onChange: React.Dispatch<React.SetStateAction<string[]>> }) {
  const input = useRef<HTMLInputElement>(null);
  const { upload } = useImageUpload("produk");
  const [pending, setPending] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  async function addFiles(files: File[]) {
    setErrors([]);
    const room = MAX_PRODUCT_IMAGES - images.length - pending;
    if (files.length > room) setErrors([`Maksimal ${MAX_PRODUCT_IMAGES} foto. ${files.length - Math.max(room, 0)} file tidak diunggah.`]);
    const accepted = files.slice(0, Math.max(room, 0));
    setPending((n) => n + accepted.length);
    await Promise.all(
      accepted.map(async (file) => {
        const res = await upload(file);
        setPending((n) => n - 1);
        // Bentuk fungsi: beberapa unggahan selesai di waktu berbeda, masing-masing menambah ke daftar TERBARU
        if (res.ok) onChange((current) => [...current, res.url]);
        else setErrors((e) => [...e, `${file.name}: ${res.error}`]);
      }),
    );
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...images];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  }

  const btn = "flex size-7 items-center justify-center rounded-full bg-paper/95 text-ink shadow-sm disabled:opacity-40";

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {images.map((url, i) => (
          <li key={url} className="relative aspect-[4/5] overflow-hidden rounded-[10px] bg-line">
            <Image src={url} alt={`Foto ${i + 1}`} fill sizes="160px" className="object-cover" />
            {i === 0 && (
              <span className="absolute top-1.5 left-1.5 flex h-5 items-center rounded-full bg-paper px-2 text-[10px] font-bold">Sampul</span>
            )}
            <button type="button" onClick={() => onChange(images.filter((u) => u !== url))} aria-label={`Hapus foto ${i + 1}`} className={`${btn} absolute top-1.5 right-1.5`}>
              <CloseIcon size={14} />
            </button>
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Geser foto ${i + 1} ke kiri`} className={btn}>
                <ChevronLeftIcon size={14} />
              </button>
              <button type="button" disabled={i === images.length - 1} onClick={() => move(i, 1)} aria-label={`Geser foto ${i + 1} ke kanan`} className={btn}>
                <ChevronRightIcon size={14} />
              </button>
            </div>
          </li>
        ))}
        {Array.from({ length: pending }, (_, i) => (
          <li key={`p${i}`} aria-busy="true" className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-[10px] bg-status-selesai-bg p-3 text-xs font-semibold">
            Mengunggah…
            <span className="h-1.5 w-full overflow-hidden rounded-full bg-line-strong">
              <span className="block h-full w-1/2 animate-pulse bg-slate-700" />
            </span>
          </li>
        ))}
        {images.length + pending < MAX_PRODUCT_IMAGES && (
          <li>
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-dashed border-line-dashed text-xs font-semibold text-slate-700 hover:bg-bg"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 16V5M7 10l5-5 5 5" />
                <path d="M5 19h14" />
              </svg>
              Unggah foto
            </button>
          </li>
        )}
      </ul>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          addFiles([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
      {errors.map((err) => (
        <p key={err} role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-error">
          <AlertIcon size={14} className="shrink-0" /> {err}
        </p>
      ))}
      <p className="text-xs text-muted">
        {IMAGE_RULES.produk.label} · JPG/PNG/WebP · maks. 2 MB. Foto pertama jadi sampul di kartu produk; pakai panah untuk mengubah urutan.
      </p>
    </div>
  );
}
