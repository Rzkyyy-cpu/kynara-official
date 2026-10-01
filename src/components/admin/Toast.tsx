"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckIcon, CloseIcon } from "@/components/icons";

// Notifikasi kecil di pojok bawah setelah admin mengubah pesanan (admin-desktop/02).
// Satu Provider per halaman, supaya notifikasi dari baris mana pun tampil di tempat yang sama.

type Toast = { title: string; waUrl?: string | null };

const ToastContext = createContext<(t: Toast) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<(Toast & { id: number }) | null>(null);
  const show = useCallback((t: Toast) => setToast({ ...t, id: Date.now() }), []);

  // Hilang sendiri setelah 8 detik
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div role="status" aria-live="polite" className="fixed inset-x-4 bottom-4 z-50 lg:inset-x-auto lg:right-10 lg:bottom-8 lg:w-[380px]">
        {toast && (
          <div className="flex items-start gap-3 rounded-input bg-ink px-4 py-3.5 text-bg shadow-[0_12px_32px_rgba(43,43,43,0.25)]">
            <CheckIcon size={20} className="shrink-0 text-toast-check" />
            <div className="flex grow flex-col gap-1 text-sm">
              <strong>{toast.title}</strong>
              {toast.waUrl && (
                <>
                  <span className="text-[13px] text-toast-sub">Kirim notifikasi ke pembeli lewat WhatsApp?</span>
                  <a href={toast.waUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold underline">
                    Kirim pesan
                  </a>
                </>
              )}
            </div>
            <button type="button" onClick={() => setToast(null)} aria-label="Tutup notifikasi" className="-m-1 p-1">
              <CloseIcon size={18} />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
