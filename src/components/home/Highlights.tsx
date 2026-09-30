import { LeafIcon, RulerIcon, ScissorsIcon, TruckIcon } from "@/components/icons";
import { highlights } from "@/lib/content";

const ICONS = { leaf: LeafIcon, scissors: ScissorsIcon, ruler: RulerIcon, truck: TruckIcon };

// 4 keunggulan kynara. HP: ikon di kiri teks. Desktop: grid 2×2, ikon di atas teks.
export function Highlights() {
  return (
    <ul className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-x-10 lg:gap-y-8">
      {highlights.map(({ icon, title, text }) => {
        const Icon = ICONS[icon];
        return (
          <li key={title} className="grid grid-cols-[44px_1fr] gap-3.5 lg:flex lg:flex-col lg:gap-2.5">
            <span className="flex size-11 items-center justify-center rounded-full bg-paper text-slate-700 lg:size-12">
              <Icon size={20} />
            </span>
            <div className="flex flex-col gap-1 lg:gap-2.5">
              <h3 className="text-base font-semibold lg:text-[17px]">{title}</h3>
              <p className="text-sm/[22px] text-muted lg:text-[15px]/6">{text}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
