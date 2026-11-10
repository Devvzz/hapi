"use client";

import { useState } from "react";
import { programs } from "@/lib/data";
import { groupOf } from "@/lib/education";
import { SUBJECT_GROUPS, subjectLabel, subjectsFromText, subjectsOf } from "@/lib/fields";
import type { Profile } from "@/lib/types";

export type Degree = "bachelor" | "master";

// Someone at school looks for a bachelor; someone with or during a bachelor looks for a master.
export function degreeFor(profile: Profile): Degree {
  if (profile.degree) return profile.degree;
  const g = groupOf(profile.schoolType);
  return g === "bachelor" || g === "graduate" || g === "master" ? "master" : "bachelor";
}

const COUNTS: Record<string, number> = (() => {
  const c: Record<string, number> = {};
  for (const p of programs) for (const s of subjectsOf(p)) c[s] = (c[s] ?? 0) + 1;
  return c;
})();

const chip = (on: boolean, empty: boolean) =>
  `rounded-full border px-3 py-1 text-sm transition ${
    on
      ? "border-transparent bg-slate-900 text-white"
      : empty
        ? "border-dashed border-slate-300 bg-transparent text-slate-500 hover:border-slate-400 hover:text-slate-800"
        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900"
  }`;

// "What do you want to study?": a typed wish, bachelor or master, and subjects in groups.
// Everything is saved in the profile, so the Universities page and the AI know it too.
export function StudyPicker({ profile, onChange, startOpen = false }: { profile: Profile; onChange: (p: Profile) => void; startOpen?: boolean }) {
  const picked = profile.studyFields ?? [];
  const wish = profile.studyText ?? "";
  const degree = degreeFor(profile);
  const [open, setOpen] = useState(startOpen);
  const understood = subjectsFromText(wish).filter((v) => !picked.includes(v));

  const set = (next: Partial<Profile>) => onChange({ ...profile, ...next });
  const toggle = (v: string) => set({ studyFields: picked.includes(v) ? picked.filter((x) => x !== v) : [...picked, v] });

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300">What do you want to study?</p>
        <div className="flex rounded-full border border-slate-200 bg-white p-0.5 text-sm" role="group" aria-label="Degree">
          {(["bachelor", "master"] as const).map((d) => (
            <button type="button" key={d} onClick={() => set({ degree: d })} aria-pressed={degree === d} className={`rounded-full px-3 py-1 ${degree === d ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}>
              {d === "bachelor" ? "Bachelor" : "Master"}
            </button>
          ))}
        </div>
      </div>

      <input
        value={wish}
        onChange={(e) => set({ studyText: e.target.value.slice(0, 80) })}
        placeholder="Type it if you know, e.g. English literature, nursing, computer science"
        aria-label="What you want to study, in your own words"
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
      />
      {understood.length > 0 && (
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
          Hapi understood:
          {understood.map((v) => (
            <button type="button" key={v} onClick={() => toggle(v)} className="rounded-full bg-[#eef3ff] px-2 py-0.5 font-medium text-teal-800 hover:bg-[#dfe8ff]" title="Add to your subjects">
              + {subjectLabel(v)}
            </button>
          ))}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => set({ studyFields: [], studyText: "" })} className={chip(picked.length === 0 && !wish, false)} aria-pressed={picked.length === 0 && !wish}>
          Not sure yet, show all
        </button>
        {picked.map((v) => (
          <button type="button" key={v} onClick={() => toggle(v)} className={chip(true, false)} aria-pressed="true">
            {subjectLabel(v)} <span className="ml-1 opacity-80">×</span>
          </button>
        ))}
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="rounded-full border border-dashed border-slate-300 px-3 py-1 text-sm text-slate-700 hover:border-slate-500">
          {open ? "Close subjects" : "+ Pick subjects"}
        </button>
      </div>

      {open && (
        <div className="grid gap-4 border-t border-slate-100 pt-3 sm:grid-cols-2">
          {SUBJECT_GROUPS.map((g) => (
            <div key={g.label} className="space-y-1.5">
              <p className="text-sm font-semibold text-slate-900">{g.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {g.subjects.map((s) => {
                  const n = COUNTS[s.value] ?? 0;
                  return (
                    <button type="button" key={s.value} onClick={() => toggle(s.value)} aria-pressed={picked.includes(s.value)} className={chip(picked.includes(s.value), n === 0)} title={n === 0 ? "No programmes in Hapi yet" : `${n} programmes in Hapi`}>
                      {s.label}
                      <span className="ml-1.5 text-xs opacity-70">{n === 0 ? "none yet" : n}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
