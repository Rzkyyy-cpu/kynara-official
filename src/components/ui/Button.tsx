import Link from "next/link";

// Tombol sesuai komponen-state/01-sistem-desain.
// Aturan desain: satu tombol "primary" per layar.

type Variant = "primary" | "outline" | "ghost";
type Size = "lg" | "md" | "sm"; // tinggi 52 / 48 / 40 (sm untuk admin)

const base =
  "inline-flex items-center justify-center gap-2 rounded-full border font-semibold leading-none whitespace-nowrap transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate " +
  "disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-disabled";

const variants: Record<Variant, string> = {
  primary: "border-transparent bg-slate-600 text-white hover:bg-slate-700",
  outline: "border-ink bg-transparent text-ink hover:bg-paper",
  ghost: "border-transparent bg-transparent text-slate-700 hover:underline",
};

const sizes: Record<Size, string> = {
  lg: "h-[52px] px-6 text-[15px]",
  md: "h-12 px-5 text-[15px]",
  sm: "h-10 px-4 text-sm",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
};

// Kalau diberi href, tombol dirender sebagai link (<a>); kalau tidak, sebagai <button>.
type ButtonProps = CommonProps &
  (
    | ({ href: string } & Omit<React.ComponentProps<typeof Link>, "href" | "className">)
    | ({ href?: undefined; loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>)
  );

export function Button({ variant = "primary", size = "lg", fullWidth, className = "", children, ...rest }: ButtonProps) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`;

  if (rest.href !== undefined) {
    return (
      <Link {...rest} className={cls}>
        {children}
      </Link>
    );
  }

  const { loading, disabled, type = "button", ...buttonProps } = rest;

  return (
    <button
      {...buttonProps}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      // Saat loading tombol tetap berwarna (bukan abu-abu disabled), sesuai desain
      className={loading ? `${cls} disabled:border-transparent disabled:bg-slate-400 disabled:text-white` : cls}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-[18px] animate-spin rounded-full border-2 border-white/45 border-t-white"
        />
      )}
      {children}
    </button>
  );
}
