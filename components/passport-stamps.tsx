import Link from "next/link";
import { programs } from "@/lib/data";

const STYLE = [
  { ring: "border-teal-400 text-teal-800", rot: "-rotate-12", pos: "left-0 top-2" },
  { ring: "border-[#0e1b2e]/40 text-slate-900", rot: "rotate-6", pos: "right-0 top-0" },
  { ring: "border-[#ff6b3d]/60 text-[#b93a0e]", rot: "-rotate-3", pos: "left-10 bottom-0" },
  { ring: "border-emerald-400 text-emerald-800", rot: "rotate-12", pos: "right-6 bottom-4" },
];

// Ink stamps for the countries with the most universities in Hapi, with a caption so they explain themselves.
export function PassportStamps() {
  const count = new Map<string, Set<string>>();
  for (const p of programs) count.set(p.country, (count.get(p.country) ?? new Set()).add(p.universityId));
  const top = [...count.entries()].sort((a, b) => b[1].size - a[1].size).slice(0, 4);
  return (
    <div className="space-y-2">
      <Link href="/universities" className="stamps relative block h-56 w-64" aria-label="See universities by country">
        {top.map(([country, set], i) => (
          <div key={country} className={`stamp absolute ${STYLE[i].pos} ${STYLE[i].rot}`} style={{ animationDelay: `${200 + i * 180}ms` }}>
            <div className={`flex h-28 w-28 flex-col items-center justify-center rounded-full border-[3px] border-double ${STYLE[i].ring} bg-white text-center`}>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] ">Study in</span>
              <span className="font-display text-sm font-extrabold uppercase leading-tight">{country}</span>
              <span className="text-[10px] font-semibold">{set.size} universities</span>
            </div>
          </div>
        ))}
      </Link>
      <p className="w-64 text-center text-xs text-slate-500">The countries with the most universities in Hapi so far</p>
    </div>
  );
}
