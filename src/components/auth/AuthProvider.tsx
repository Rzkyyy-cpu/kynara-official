"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toggleWishlist as toggleWishlistAction } from "@/app/(toko)/akun/actions";
import { createClient } from "@/lib/supabase/client";

// "Context" = papan pengumuman bersama untuk semua komponen di bawahnya.
// Isinya: siapa yang sedang login dan produk apa saja di wishlist-nya.
// Navbar, drawer, dan tombol hati cukup membaca papan ini, tanpa masing-masing bertanya ke Supabase.

type AuthUser = { id: string; email: string; name: string };

type AuthState = {
  user: AuthUser | null;
  ready: boolean; // false selama status login belum diketahui (hindari tombol "Masuk" berkedip)
  wishlist: Set<string>;
  toggleWishlist: (productId: string) => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    // Dipanggil sekali saat halaman dibuka (INITIAL_SESSION), lalu setiap login/logout.
    // Data sesi di sini hanya untuk TAMPILAN; semua keputusan hak akses tetap di server & RLS.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(
        u
          ? {
              id: u.id,
              email: u.email ?? "",
              name: (u.user_metadata?.full_name ?? u.user_metadata?.name ?? "") as string,
            }
          : null,
      );
      setReady(true);
      if (!u) {
        setWishlist(new Set());
        return;
      }
      // setTimeout: jangan memanggil Supabase langsung di dalam callback ini (bisa macet, sesuai dokumentasi Supabase)
      setTimeout(async () => {
        const { data } = await supabase.from("wishlists").select("product_id");
        setWishlist(new Set((data ?? []).map((w) => w.product_id)));
      }, 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!user) {
        router.push(`/masuk?next=${encodeURIComponent(location.pathname + location.search)}`);
        return;
      }
      const save = !wishlist.has(productId);
      // Ubah tampilan dulu (optimistic), batalkan kalau server menolak
      const apply = (on: boolean) =>
        setWishlist((prev) => {
          const next = new Set(prev);
          if (on) next.add(productId);
          else next.delete(productId);
          return next;
        });
      apply(save);
      const res = await toggleWishlistAction(productId, save);
      if (!res.ok) apply(!save);
    },
    [user, wishlist, router],
  );

  const value = useMemo(() => ({ user, ready, wishlist, toggleWishlist }), [user, ready, wishlist, toggleWishlist]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}
