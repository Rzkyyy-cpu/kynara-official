import { AlertIcon, CheckIcon } from "@/components/icons";

// Kotak pesan di atas form: merah untuk error, biru muda untuk berhasil/info (sesuai desain akun).
export function Alert({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const isError = tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex gap-2.5 rounded-input px-3.5 py-3 text-sm/[21px] ${
        isError ? "bg-error-bg text-error" : "bg-sky-tint font-semibold text-status-kirim"
      }`}
    >
      {isError ? <AlertIcon size={20} className="shrink-0" /> : <CheckIcon size={20} className="shrink-0" />}
      <span>{children}</span>
    </div>
  );
}
