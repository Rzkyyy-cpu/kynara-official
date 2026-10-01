import "server-only";

import { type Address, MAX_ADDRESSES } from "@/lib/account";
import { type CartItemView, getUserCartLines, getVariantDetails } from "@/lib/cart/server";
import { type CartLine, type StockIssue, calcTotals, reconcileStock } from "@/lib/cart/totals";
import { formatAddress } from "@/lib/format";
import type { ShippingDestination } from "@/lib/shipping";
import { createClient } from "@/lib/supabase/server";
import type { CheckoutAddressInput } from "@/lib/validation/cart";
import { checkoutAddressSchema } from "@/lib/validation/cart";
import { resolveRegion } from "@/lib/wilayah";

// Logika checkout di SERVER. Semua angka (harga, berat, ongkir) dihitung di sini dari database,
// browser hanya mengirim pilihan: alamat mana dan kurir mana.

export type CheckoutItem = CartItemView & { quantity: number };

export type CheckoutCart = {
  items: CheckoutItem[];
  issues: StockIssue[];
  subtotal: number;
  weightGram: number;
  itemCount: number;
};

export async function loadCheckoutCart(userId: string): Promise<CheckoutCart> {
  const lines: CartLine[] = await getUserCartLines(userId);
  const details = await getVariantDetails(lines.map((l) => l.variantId));
  const { issues } = reconcileStock(lines, (id) => {
    const d = details.get(id);
    return d ? { stock: d.stock, available: true } : undefined;
  });
  const items = lines.flatMap((l) => {
    const d = details.get(l.variantId);
    return d ? [{ ...d, quantity: l.quantity }] : [];
  });
  const totals = calcTotals(items.map((i) => ({ price: i.price, quantity: i.quantity, weightGram: i.weightGram })));
  return { items, issues, subtotal: totals.subtotal, weightGram: totals.weightGram, itemCount: totals.itemCount };
}

// Salinan alamat yang disimpan di orders.shipping_address (seperti label paket yang sudah ditempel)
export type AddressSnapshot = {
  label: string;
  recipient_name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  postal_code: string;
  street: string;
  landmark: string | null;
};

export type ResolvedAddress = {
  snapshot: AddressSnapshot;
  destination: ShippingDestination;
  savedId: string | null; // id buku alamat (kalau alamat tersimpan / baru saja disimpan)
};

type Result<T> = { ok: true; value: T } | { ok: false; error?: string; fieldErrors?: Record<string, string> };

function fromRow(a: Address): ResolvedAddress {
  return {
    snapshot: {
      label: a.label,
      recipient_name: a.recipient_name,
      phone: a.phone,
      province: a.province,
      city: a.city,
      district: a.district,
      postal_code: a.postal_code,
      street: a.street,
      landmark: a.landmark,
    },
    destination: {
      province: a.province,
      city: a.city,
      district: a.district,
      postalCode: a.postal_code,
    },
    savedId: a.id,
  };
}

// Pilihan alamat dari browser -> alamat yang sudah dicek.
// Alamat tersimpan dibaca lewat koneksi bersesi (RLS: hanya alamat milik user ini).
// Alamat baru divalidasi Zod + data wilayah resmi, lalu (kalau diminta) disimpan ke buku alamat.
export async function resolveCheckoutAddress(
  userId: string,
  input: CheckoutAddressInput,
  { allowSave }: { allowSave: boolean },
): Promise<Result<ResolvedAddress>> {
  const parsed = checkoutAddressSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[issue.path.length - 1] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const supabase = await createClient();
  const data = parsed.data;

  if (data.kind === "saved") {
    const { data: row } = await supabase
      .from("addresses")
      .select("*")
      .eq("id", data.addressId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!row) return { ok: false, error: "Alamat tidak ditemukan. Pilih alamat lain, ya." };
    return { ok: true, value: fromRow(row) };
  }

  const a = data.address;
  const region = resolveRegion(a.provinceCode, a.cityCode, a.districtCode);
  if (!region) return { ok: false, fieldErrors: { districtCode: "Pilih ulang provinsi, kota, dan kecamatan." } };

  const row = {
    label: a.label,
    recipient_name: a.recipientName,
    phone: a.phone,
    province: region.province,
    city: region.city,
    district: region.district,
    postal_code: a.postalCode,
    street: a.street,
    landmark: a.landmark,
  };

  if (data.save && allowSave) {
    const { count } = await supabase
      .from("addresses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((count ?? 0) >= MAX_ADDRESSES) {
      return { ok: false, error: `Buku alamat sudah penuh (maks. ${MAX_ADDRESSES}). Hapus centang "Simpan ke buku alamat".` };
    }
    const { data: saved, error } = await supabase
      .from("addresses")
      .insert({ ...row, user_id: userId, is_default: count === 0 })
      .select("*")
      .single();
    if (error) {
      console.error("checkout save address:", error.message);
      return { ok: false, error: "Alamat gagal disimpan. Coba lagi sebentar lagi." };
    }
    return { ok: true, value: fromRow(saved) };
  }

  return {
    ok: true,
    value: {
      snapshot: row,
      destination: { province: row.province, city: row.city, district: row.district, postalCode: row.postal_code },
      savedId: null,
    },
  };
}

// Ringkasan alamat untuk ditampilkan di langkah 2 & 3
export function addressSummary(s: AddressSnapshot) {
  return { label: s.label, name: s.recipient_name, phone: s.phone, text: formatAddress(s) };
}
export type AddressSummary = ReturnType<typeof addressSummary>;

// Kode error dari fungsi database create_order -> pesan untuk pembeli
export function orderErrorMessage(message: string): string {
  if (message.includes("STOK_KURANG")) return "Stok salah satu produk baru saja habis atau berkurang. Cek keranjangmu lagi, ya.";
  if (message.includes("ITEM_TIDAK_TERSEDIA")) return "Ada produk di keranjang yang sudah tidak tersedia. Cek keranjangmu lagi, ya.";
  if (message.includes("TOTAL_BERUBAH")) return "Harga atau ongkir baru saja berubah. Periksa ringkasan pesanan lalu coba lagi.";
  if (message.includes("KERANJANG_KOSONG")) return "Keranjangmu kosong.";
  return "Pesanan gagal dibuat. Coba lagi sebentar lagi.";
}
