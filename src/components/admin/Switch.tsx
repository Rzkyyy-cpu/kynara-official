"use client";

// Toggle on/off (admin-desktop: Tampil, Beranda, Aktif). role="switch" supaya pembaca layar
// membacakan "aktif/nonaktif". Area klik 44px walau tampilannya 40×24.
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group -m-2.5 inline-flex p-2.5 disabled:cursor-wait disabled:opacity-60"
    >
      <span className={`relative block h-6 w-10 rounded-full transition-colors ${checked ? "bg-switch-on" : "bg-switch-off"}`}>
        <span
          className={`absolute top-[3px] size-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-[left] ${
            checked ? "left-[19px]" : "left-[3px]"
          }`}
        />
      </span>
    </button>
  );
}
