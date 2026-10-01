import type { TimelineStep } from "@/lib/order-status";

// Timeline status pesanan: vertikal di HP (mobile-akun-checkout/11), horizontal di desktop (desktop-akun-checkout/10).

function dotClass(s: TimelineStep) {
  if (s.failed) return "border-status-batal bg-status-batal text-white";
  if (s.state === "done") return "border-slate-700 bg-slate-700 text-white";
  if (s.state === "current") return "border-ink bg-ink text-white";
  return "border-line-strong bg-paper text-muted";
}

function mark(s: TimelineStep, i: number) {
  if (s.failed) return "✕";
  return s.state === "done" ? "✓" : String(i + 1);
}

// Garis penghubung ke langkah berikutnya: biru kalau langkah berikutnya sudah dicapai
function lineClass(steps: TimelineStep[], i: number) {
  const next = steps[i + 1];
  if (!next) return "bg-transparent";
  return next.state !== "todo" ? "bg-slate-700" : "bg-line";
}

export function OrderTimeline({ steps, className = "" }: { steps: TimelineStep[]; className?: string }) {
  return (
    <>
      {/* HP: vertikal */}
      <ol className={`flex flex-col lg:hidden ${className}`}>
        {steps.map((s, i) => (
          <li key={s.label} aria-current={s.state === "current" ? "step" : undefined} className="grid grid-cols-[28px_1fr] gap-3.5">
            <div className="flex flex-col items-center">
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${dotClass(s)}`}>
                {mark(s, i)}
              </span>
              <span className={`min-h-[22px] w-0.5 grow ${lineClass(steps, i)}`} />
            </div>
            <div className="flex flex-col gap-0.5 pt-[3px] pb-[18px]">
              <span className={`text-[15px] ${s.state === "current" ? "font-bold" : "font-medium"} ${s.state === "todo" ? "text-muted" : "text-ink"}`}>
                {s.label}
              </span>
              {s.time && <span className="text-xs text-muted">{s.time}</span>}
            </div>
          </li>
        ))}
      </ol>

      {/* Desktop: horizontal */}
      <ol
        className="hidden rounded-2xl border border-line bg-paper px-10 py-8 lg:grid"
        style={{ gridTemplateColumns: `repeat(${Math.max(steps.length, 2)}, minmax(0, 1fr))` }}
      >
        {steps.map((s, i) => (
          <li key={s.label} aria-current={s.state === "current" ? "step" : undefined} className="flex flex-col gap-3">
            <div className="flex items-center">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${dotClass(s)}`}>
                {mark(s, i)}
              </span>
              <span className={`mx-3 h-[3px] grow rounded-sm ${lineClass(steps, i)}`} />
            </div>
            <div className="flex flex-col gap-1 pr-4">
              <span className={`text-base ${s.state === "current" ? "font-bold" : "font-medium"} ${s.state === "todo" ? "text-muted" : "text-ink"}`}>
                {s.label}
              </span>
              {s.time && <span className="text-[13px]/[19px] text-muted">{s.time}</span>}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
