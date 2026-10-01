import qrcode from "qrcode-generator";

// Mengubah teks QRIS (qr_string dari Komerce) menjadi gambar QR berupa satu <path> SVG.
// Library qrcode-generator (MIT, tanpa dependensi) hanya menghitung kotak hitam-putihnya;
// gambarnya kita susun sendiri, jadi tidak perlu menyisipkan HTML mentah ke halaman.
export function qrPath(text: string) {
  const qr = qrcode(0, "M"); // 0 = ukuran otomatis, M = tahan ±15% kerusakan (standar QRIS)
  qr.addData(text);
  qr.make();
  const size = qr.getModuleCount();
  let d = "";
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (qr.isDark(row, col)) d += `M${col} ${row}h1v1h-1z`;
    }
  }
  return { size, d };
}
