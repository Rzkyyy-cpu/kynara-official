// Hook PostToolUse (Edit/Write): jalankan ESLint pada file .ts/.tsx yang baru diubah.
// Kalau ada masalah, hasilnya dikirim balik ke Claude supaya langsung diperbaiki.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

let input = "";
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  let filePath = "";
  try {
    const data = JSON.parse(input);
    filePath = data.tool_input?.file_path ?? data.tool_response?.filePath ?? "";
  } catch {
    process.exit(0);
  }
  if (!/\.(ts|tsx|mjs|js)$/i.test(filePath) || !existsSync(filePath)) process.exit(0);

  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const rel = path.relative(root, filePath).replace(/\\/g, "/");
  // Hanya kode proyek; lewati node_modules, .next, dan skrip hook ini sendiri
  if (rel.startsWith("..") || /^(node_modules|\.next|\.claude)\//.test(rel)) process.exit(0);

  const eslint = path.join(root, "node_modules", "eslint", "bin", "eslint.js");
  if (!existsSync(eslint)) process.exit(0);

  try {
    execFileSync(process.execPath, [eslint, "--max-warnings", "0", "--format", "stylish", filePath], { cwd: root, encoding: "utf8" });
  } catch (err) {
    const out = `${err.stdout ?? ""}${err.stderr ?? ""}`.trim();
    if (out) {
      process.stdout.write(
        JSON.stringify({ decision: "block", reason: `ESLint menemukan masalah di ${rel}:\n${out.slice(0, 3000)}` }),
      );
    }
  }
  process.exit(0);
});
