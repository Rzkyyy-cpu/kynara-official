import Link from "next/link";
import { ChatIcon, ClockIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/icons";
import { Container } from "@/components/ui/Container";
import { type NavCategory, categoryHref, helpLinks } from "@/lib/navigation";
import { instagramUrl, site, tiktokUrl, whatsappDisplay, whatsappUrl } from "@/lib/site";

// Footer satu komponen untuk HP & desktop.
// HP (footer-mobile): brand -> hubungi kami -> kebijakan retur -> 2 kolom link.
// Desktop (footer-desktop): 4 kolom brand | belanja | bantuan | hubungi kami.
// Urutan diatur dengan class order-*; "lg:contents" membuat kolom link ikut grid induk di desktop.

const labelCls = "text-eyebrow font-semibold uppercase text-footer-label";
const linkCls = "flex min-h-8 items-center text-sm text-footer-ink hover:underline lg:min-h-0";

export function Footer({ categories }: { categories: NavCategory[] }) {
  const socials = [
    { label: "WhatsApp", href: whatsappUrl, Icon: WhatsAppIcon },
    { label: "Instagram", href: instagramUrl, Icon: InstagramIcon },
    { label: "TikTok", href: tiktokUrl, Icon: TikTokIcon },
  ];

  return (
    <footer data-latar="gelap" className="bg-slate-900 text-footer-ink">
      <Container className="grid gap-8 pt-10 pb-5 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr] lg:gap-14 lg:pt-[72px] lg:pb-0">
        {/* Brand */}
        <div className="order-1 flex flex-col gap-3.5 lg:gap-5">
          <span className="font-serif text-[32px] font-medium text-bg lg:text-[34px]">{site.name}</span>
          <p className="max-w-[300px] text-sm/[1.7] text-footer-soft">{site.tagline}</p>
          <div className="flex gap-2.5">
            {socials.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex size-11 items-center justify-center rounded-full border border-footer-ink/30"
              >
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>

        {/* Link Belanja & Bantuan */}
        <div className="order-3 grid grid-cols-2 gap-6 lg:order-2 lg:contents">
          <div className="flex flex-col gap-1 lg:order-2 lg:gap-3">
            <span className={`${labelCls} mb-1.5 lg:mb-1`}>Belanja</span>
            {categories.map((c) => (
              <Link key={c.slug} href={categoryHref(c.slug)} className={linkCls}>
                {c.name}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-1 lg:order-2 lg:gap-3">
            <span className={`${labelCls} mb-1.5 lg:mb-1`}>Bantuan</span>
            {helpLinks.map((l) => (
              <Link key={l.label} href={l.href} className={linkCls}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Hubungi kami + kebijakan retur */}
        <div className="order-2 flex flex-col gap-8 lg:order-3 lg:gap-2">
          <div className="flex flex-col gap-3 lg:gap-2.5">
            <span className={`${labelCls} lg:mb-1.5`}>Hubungi kami</span>
            {/* Di HP, WhatsApp tampil sebagai tombol besar karena ini kontak utama */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-3 rounded-input bg-[rgba(247,242,234,0.08)] px-3.5 text-sm font-semibold text-bg lg:min-h-0 lg:gap-2.5 lg:bg-transparent lg:px-0 lg:font-normal lg:text-footer-ink"
            >
              <ChatIcon size={18} /> WhatsApp {whatsappDisplay}
            </a>
            <span className="flex min-h-8 items-center gap-3 px-3.5 text-sm lg:min-h-0 lg:gap-2.5 lg:px-0">
              <InstagramIcon size={18} /> Instagram @{site.instagram ?? "[USERNAME]"}
            </span>
            <span className="flex min-h-8 items-center gap-3 px-3.5 text-sm lg:min-h-0 lg:gap-2.5 lg:px-0">
              <TikTokIcon size={18} /> TikTok @{site.tiktok ?? "[USERNAME]"}
            </span>
            <span className="flex min-h-8 items-center gap-3 px-3.5 text-sm lg:min-h-0 lg:gap-2.5 lg:px-0">
              <ClockIcon size={18} /> {site.jamLayanan ?? "[Senin–Sabtu, 09.00–17.00 WIB]"}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 rounded-input border border-footer-ink/25 p-4">
            <span className="text-sm font-semibold text-bg">Kebijakan retur</span>
            <span className="text-[13px]/[1.6] text-footer-soft">
              Tukar atau retur maksimal {site.hariRetur ?? "[X]"} hari setelah paket diterima untuk produk cacat
              atau salah kirim. Sertakan video unboxing.
            </span>
            <Link href="/kebijakan-retur" className="text-[13px] font-semibold text-bg underline">
              Baca kebijakan lengkap
            </Link>
          </div>
        </div>

        {/* Baris hak cipta */}
        <div className="order-4 flex flex-col gap-1 border-t border-footer-ink/18 pt-4 text-xs text-footer-label lg:col-span-4 lg:mt-14 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:pt-0 lg:text-[13px]">
          <span>© 2026 kynara. Semua hak dilindungi.</span>
          <span>Transfer bank · E-wallet · QRIS</span>
        </div>
      </Container>
    </footer>
  );
}
