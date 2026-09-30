// Format angka ke Rupiah tanpa desimal, contoh 79000 -> "Rp79.000" (sesuai desain, tanpa spasi).
export function formatRupiah(value: number): string {
  return "Rp" + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
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
