import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Vitest = alat untuk menjalankan tes otomatis (npm test).
// Tes ditulis di file *.test.ts di samping kode yang dites.
export default defineConfig({
  resolve: {
    // Samakan alias "@/..." dengan tsconfig.json
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/*.db.test.ts"], // tes database dijalankan terpisah: npm run test:db
  },
});
