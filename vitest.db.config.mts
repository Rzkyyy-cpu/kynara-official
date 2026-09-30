import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tes yang menyentuh DATABASE sungguhan (npm run test:db). Sengaja dipisah dari `npm test`,
// supaya tes biasa tidak pernah menulis ke Supabase tanpa disengaja.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.db.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
