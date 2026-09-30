import { levelWord, materials } from "@/lib/content";

// 3 bar kecil: bar yang "menyala" sebanyak level (1–3). Teks di sebelahnya untuk pembaca layar.
function Level({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-2 lg:gap-2.5">
      <span className="flex gap-[3px]" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-1.5 w-3 rounded-[3px] lg:w-3.5 ${n <= value ? "bg-slate-700" : "bg-line-strong"}`}
          />
        ))}
      </span>
      <span className="text-[13px] lg:text-sm">{levelWord(value)}</span>
    </span>
  );
}

const COLS = "lg:grid-cols-[1.1fr_2fr_1fr_1fr_1.7fr]";

// Perbandingan bahan. HP: kartu yang digeser ke samping. Desktop: tabel.
export function MaterialGuide() {
  return (
    <>
      {/* HP: kartu geser. -mx-5 px-5 supaya kartu bisa digeser sampai tepi layar */}
      <div role="list" className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:hidden">
        {materials.map((m) => (
          <div
            key={m.name}
            role="listitem"
            className="flex w-[264px] shrink-0 snap-start flex-col gap-3.5 rounded-2xl border border-line bg-paper p-5"
          >
            <h3 className="font-serif text-[22px] font-medium">{m.name}</h3>
            <p className="min-h-[42px] text-sm/[21px] text-muted">{m.desc}</p>
            <div className="h-px bg-line" />
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted">Adem</span>
              <Level value={m.adem} />
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted">Mudah dibentuk</span>
              <Level value={m.bentuk} />
            </div>
            <div className="flex flex-col gap-0.5 text-[13px]">
              <span className="text-muted">Cocok untuk</span>
              <span className="font-semibold">{m.fit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: tabel. role="table" dkk. supaya pembaca layar tetap membacanya sebagai tabel */}
      <div role="table" aria-label="Perbandingan bahan" className="hidden overflow-hidden rounded-2xl border border-line bg-paper lg:block">
        <div
          role="row"
          className={`grid h-[52px] items-center bg-table-head px-7 text-xs font-semibold tracking-[0.08em] text-ink-soft uppercase ${COLS}`}
        >
          {["Bahan", "Karakter", "Adem", "Mudah dibentuk", "Cocok untuk"].map((h) => (
            <span key={h} role="columnheader">
              {h}
            </span>
          ))}
        </div>
        {materials.map((m) => (
          <div
            key={m.name}
            role="row"
            className={`grid min-h-[76px] items-center border-t border-line px-7 text-[15px] ${COLS}`}
          >
            <span role="rowheader" className="font-serif text-xl">
              {m.name}
            </span>
            <span role="cell" className="pr-6 leading-[22px] text-muted">
              {m.desc}
            </span>
            <span role="cell">
              <Level value={m.adem} />
            </span>
            <span role="cell">
              <Level value={m.bentuk} />
            </span>
            <span role="cell" className="leading-[22px]">
              {m.fit}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
