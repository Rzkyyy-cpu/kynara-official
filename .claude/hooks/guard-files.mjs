// Hook PreToolUse (Edit/Write): tolak perubahan ke file yang dilarang CLAUDE.md.
// - design-handoff/  -> acuan desain, tidak boleh diubah
// - .env, .env.local, dll. -> berisi kunci rahasia (kecuali .env.example)
let input = "";
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  let filePath = "";
  try {
    filePath = JSON.parse(input).tool_input?.file_path ?? "";
  } catch {
    process.exit(0); // input tidak terbaca: jangan menghalangi
  }
  const p = filePath.replace(/\\/g, "/");
  const name = p.split("/").pop() ?? "";

  let reason = "";
  if (/(^|\/)design-handoff\//i.test(p)) {
    reason = "design-handoff/ adalah acuan desain dan tidak boleh diubah (CLAUDE.md).";
  } else if (/^\.env(\..+)?$/i.test(name) && name.toLowerCase() !== ".env.example") {
    reason = `${name} berisi kunci rahasia dan hanya boleh diubah manual oleh pemilik proyek.`;
  }

  if (reason) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: `Diblokir hook proyek: ${reason} Minta izin eksplisit ke pengguna dan minta dia menonaktifkan hook via /hooks bila memang perlu.`,
        },
      }),
    );
  }
  process.exit(0);
});
