import { programs } from "@/lib/data";

const STYLE = [
  { ring: "border-violet-300/70 text-violet-200", rot: "-rotate-12", pos: "left-0 top-2" },
  { ring: "border-cyan-300/70 text-cyan-200", rot: "rotate-6", pos: "right-0 top-0" },
  { ring: "border-[#fcd34d]/70 text-[#fde68a]", rot: "-rotate-3", pos: "left-10 bottom-0" },
  { ring: "border-pink-300/70 text-pink-200", rot: "rotate-12", pos: "right-6 bottom-4" },
];

// Ink stamps for the countries with the most universities in Hapi.
export function PassportStamps() {
  const count = new Map<string, Set<string>>();
  for (const p of programs) count.set(p.country, (count.get(p.country) ?? new Set()).add(p.universityId));
  const top = [...count.entries()].sort((a, b) => b[1].size - a[1].size).slice(0, 4);
  return (
    <div className="stamps relative h-56 w-64" aria-hidden="true">
      {top.map(([country, set], i) => (
        <div key={country} className={`stamp absolute ${STYLE[i].pos} ${STYLE[i].rot}`} style={{ animationDelay: `${200 + i * 180}ms` }}>
          <div className={`flex h-28 w-28 flex-col items-center justify-center rounded-full border-[3px] border-double ${STYLE[i].ring} bg-[#0b0818]/60 text-center`}>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] opacity-80">Hapi</span>
            <span className="font-display text-sm font-extrabold uppercase leading-tight">{country}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{set.size} unis</span>
          </div>
        </div>
      ))}
    </div>
  );
}
