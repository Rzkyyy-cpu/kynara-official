// Aturan foto per jenis (admin-desktop/04, 05, 06). Tipe & ukuran file juga dijaga bucket Storage;
// resolusi minimum hanya bisa dicek di browser (dibaca dari gambarnya sebelum diunggah).

export type ImageKind = "produk" | "kategori" | "banner-desktop" | "banner-hp";

export const IMAGE_RULES: Record<ImageKind, { minW: number; minH: number; label: string; folder: string }> = {
  produk: { minW: 1080, minH: 1350, label: "Rasio 4:5 · min. 1080 × 1350 px", folder: "produk" },
  kategori: { minW: 800, minH: 1000, label: "Min. 800 × 1000 px", folder: "kategori" },
  "banner-desktop": { minW: 1440, minH: 640, label: "1440 × 640 px", folder: "banner" },
  "banner-hp": { minW: 800, minH: 1000, label: "4:5 · min. 800 × 1000 px", folder: "banner" },
};

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1).replace(".", ",");

// null = boleh diunggah; selain itu pesan untuk admin
export function imageProblem(file: { type: string; size: number }, kind: ImageKind, size?: { width: number; height: number }): string | null {
  if (!IMAGE_TYPES[file.type]) return "Format harus JPG, PNG, atau WebP.";
  if (file.size > MAX_IMAGE_BYTES) return `File ${mb(file.size)} MB, maks. 2 MB.`;
  if (size) {
    const { minW, minH } = IMAGE_RULES[kind];
    if (size.width < minW || size.height < minH) return `Foto ${size.width} × ${size.height} px, min. ${minW} × ${minH} px.`;
  }
  return null;
}
