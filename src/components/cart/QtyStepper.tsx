// Tombol − jumlah + (desain keranjang: tinggi 44px, sudut bulat penuh).
export function QtyStepper({
  value,
  max,
  onChange,
  label,
  className = "",
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
  label: string; // nama produk, untuk pembaca layar
  className?: string;
}) {
  return (
    <div className={`flex h-11 items-center rounded-full border border-line-strong bg-paper ${className}`}>
      <button
        type="button"
        aria-label={`Kurangi ${label}`}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        className="flex size-11 items-center justify-center text-lg disabled:text-disabled"
      >
        −
      </button>
      <span className="min-w-6 flex-1 text-center text-sm font-semibold lg:text-base" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Tambah ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="flex size-11 items-center justify-center text-lg disabled:text-disabled"
      >
        +
      </button>
    </div>
  );
}
