// Ikon SVG disalin dari design-handoff/source supaya tidak perlu library ikon.
// Semua ikon memakai currentColor, jadi warnanya ikut warna teks induknya.

type IconProps = { size?: number; className?: string };

function Svg({
  size = 22,
  className,
  strokeWidth = 1.6,
  children,
}: IconProps & { strokeWidth?: number; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export const MenuIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </Svg>
);

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);

export const UserIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </Svg>
);

export const BagIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 8h14l-1 12H6L5 8z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </Svg>
);

export const HomeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" />
  </Svg>
);

export const GridIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </Svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Svg strokeWidth={1.8} {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Svg strokeWidth={1.8} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const HeartIcon = (p: IconProps) => (
  <Svg strokeWidth={1.7} {...p}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </Svg>
);

export const WhatsAppIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20l1.3-3.9A8 8 0 1 1 8.2 19z" />
    <path d="M9.5 9.5c.3 2.3 2.2 4.4 4.8 5l1.2-1.4-1.8-.9-.8.8c-1-.4-1.9-1.3-2.3-2.3l.8-.8-.9-1.8z" />
  </Svg>
);

export const ChatIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20l1.3-3.9A8 8 0 1 1 8.2 19z" />
  </Svg>
);

export const InstagramIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="5" />
    <circle cx="12" cy="12" r="3.5" />
    <circle cx="17" cy="7" r="0.8" fill="currentColor" />
  </Svg>
);

export const TikTokIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" />
    <path d="M14 4c.5 2.5 2.5 4 5 4" />
  </Svg>
);

export const ClockIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" />
  </Svg>
);

// Siluet pengganti foto produk (dipakai selama foto asli belum ada)
export const PlaceholderFigure = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 80 100"
    preserveAspectRatio="xMidYMax meet"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M40 12c-11 0-19 9-19 21 0 5 1.5 9.5 3.5 13C15 52 8 64 6 100h68c-2-36-9-48-18.5-54 2-3.5 3.5-8 3.5-13 0-12-8-21-19-21z"
      fill="#FFFFFF"
      fillOpacity="0.4"
    />
  </svg>
);
