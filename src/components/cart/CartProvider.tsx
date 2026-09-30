"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { addToCart, getMyCart, mergeGuestCart, setCartQuantity } from "@/app/(toko)/keranjang/actions";
import { useAuth } from "@/components/auth/AuthProvider";
import { GUEST_CART_KEY, readGuestCart, writeGuestCart } from "@/lib/cart/storage";
import { type CartLine, MAX_CART_LINES, clampQuantity } from "@/lib/cart/totals";

// Papan bersama isi keranjang (id varian + jumlah) untuk badge navbar, tombol beli, dan halaman keranjang.
//  - Tamu: disimpan di localStorage.
//  - User login: disimpan di database lewat server action.
//  - Saat tamu login: isi localStorage digabung ke database, lalu localStorage dikosongkan.

// added = berhasil, full = sudah mencapai stok/batas keranjang, error = gagal menyimpan
export type AddResult = "added" | "full" | "error";

type CartState = {
  lines: CartLine[];
  ready: boolean;
  count: number; // total pcs, untuk badge
  add: (variantId: string, quantity: number, stock: number) => Promise<AddResult>;
  setQuantity: (variantId: string, quantity: number, stock: number) => Promise<void>;
  remove: (variantId: string) => Promise<void>;
  reload: () => Promise<void>;
};

const CartContext = createContext<CartState | null>(null);

function upsertLine(lines: CartLine[], variantId: string, quantity: number): CartLine[] {
  if (quantity <= 0) return lines.filter((l) => l.variantId !== variantId);
  if (lines.some((l) => l.variantId === variantId)) {
    return lines.map((l) => (l.variantId === variantId ? { ...l, quantity } : l));
  }
  return [...lines, { variantId, quantity }];
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const userId = user?.id ?? null;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  // Salinan terbaru "lines" untuk dibaca di dalam fungsi async tanpa membuat ulang fungsinya
  const linesRef = useRef(lines);
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  const reload = useCallback(async () => {
    if (!userId) {
      setLines(readGuestCart());
      return;
    }
    const db = await getMyCart();
    if (db) setLines(db);
  }, [userId]);

  // Setiap status login berubah: muat keranjang yang sesuai (dan gabungkan keranjang tamu kalau baru login)
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    (async () => {
      if (!userId) {
        setLines(readGuestCart());
      } else {
        const guest = readGuestCart();
        const merged = await mergeGuestCart(guest);
        if (cancelled) return;
        if (merged) {
          if (guest.length) writeGuestCart([]); // hanya dikosongkan kalau penggabungan berhasil
          setLines(merged);
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, userId]);

  // Tamu membuka toko di dua tab: perubahan di satu tab ikut terlihat di tab lain
  useEffect(() => {
    if (userId) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === GUEST_CART_KEY) setLines(readGuestCart());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [userId]);

  const setQuantity = useCallback(
    async (variantId: string, quantity: number, stock: number) => {
      const q = clampQuantity(quantity, stock);
      const before = linesRef.current;
      const next = upsertLine(before, variantId, q);
      linesRef.current = next;
      setLines(next); // tampilan berubah dulu (optimistic)
      if (!userId) {
        writeGuestCart(next);
        return;
      }
      const res = await setCartQuantity(variantId, q);
      if (!res.ok) setLines(before);
      else if (res.quantity !== q) setLines((cur) => upsertLine(cur, variantId, res.quantity)); // stok server lebih sedikit
    },
    [userId],
  );

  const add = useCallback(
    async (variantId: string, quantity: number, stock: number): Promise<AddResult> => {
      const current = linesRef.current.find((l) => l.variantId === variantId)?.quantity ?? 0;
      if (current === 0 && linesRef.current.length >= MAX_CART_LINES) return "full";
      if (!userId) {
        const q = clampQuantity(current + quantity, stock);
        if (q <= current) return "full"; // sudah sebanyak stok
        const next = upsertLine(linesRef.current, variantId, q);
        linesRef.current = next;
        setLines(next);
        writeGuestCart(next);
        return "added";
      }
      const res = await addToCart(variantId, quantity);
      if (res.ok) setLines((cur) => upsertLine(cur, variantId, res.quantity));
      if (!res.ok) return "error";
      return res.quantity > current ? "added" : "full";
    },
    [userId],
  );

  const remove = useCallback((variantId: string) => setQuantity(variantId, 0, 0), [setQuantity]);

  const value = useMemo(
    () => ({
      lines,
      ready,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      add,
      setQuantity,
      remove,
      reload,
    }),
    [lines, ready, add, setQuantity, remove, reload],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart harus dipakai di dalam <CartProvider>");
  return ctx;
}
