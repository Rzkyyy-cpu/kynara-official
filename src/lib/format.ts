// Format angka ke Rupiah tanpa desimal, contoh 79000 -> "Rp79.000" (sesuai desain, tanpa spasi).
export function formatRupiah(value: number): string {
  return "Rp" + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}

// Rupiah ringkas untuk angka besar di dashboard admin: 18400000 -> "Rp18,4 jt", 146000 -> "Rp146 rb"
export function formatRupiahShort(value: number): string {
  const one = (n: number) => n.toFixed(1).replace(/\.0$/, "").replace(".", ",");
  if (Math.abs(value) >= 1_000_000) return `Rp${one(value / 1_000_000)} jt`;
  if (Math.abs(value) >= 1_000) return `Rp${Math.round(value / 1_000)} rb`;
  return formatRupiah(value);
}

// Nomor HP Indonesia -> format wa.me: "0812-3456-7890" -> "6281234567890". Null kalau bukan nomor HP.
export function waNumber(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (/^08\d{7,12}$/.test(digits)) return `62${digits.slice(1)}`;
  if (/^628\d{7,12}$/.test(digits)) return digits;
  return null;
}

// "Nadia Azzahra" -> "NA" untuk avatar bulat
export function initials(name: string | null | undefined, email: string) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return email.slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// Alamat dalam satu baris, seperti di kartu alamat desain
export function formatAddress(a: { street: string; district: string; city: string; province: string; postal_code: string }) {
  return `${a.street}, Kec. ${a.district}, ${a.city}, ${a.province} ${a.postal_code}`;
}

// Tampilan nomor HP: 081234567890 -> 0812-3456-7890
export function formatPhone(phone: string | null) {
  if (!phone) return "";
  return phone.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3");
}
