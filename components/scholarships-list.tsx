"use client";

import { useMemo, useState } from "react";
import { opportunities, programs } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { GROUP_LABEL } from "@/lib/education";
import { compareMatches, matchOpportunity } from "@/lib/match";
import { useNow } from "@/lib/storage";
import { useProfile } from "@/lib/use-profile";
import type { Opportunity } from "@/lib/types";

// Where each scholarship lets you study: from its tags, plus ids whose tags do not name a country.
const TAG_COUNTRY: Record<string, string> = {
  italy: "Italy", "study-in-italy": "Italy", austria: "Austria", "study-in-austria": "Austria", germany: "Germany",
  "study-in-germany": "Germany", netherlands: "Netherlands", switzerland: "Switzerland", france: "France", "study-in-france": "France",
  uk: "United Kingdom", ireland: "Ireland", japan: "Japan", usa: "United States",
};
const ID_COUNTRIES: Record<string, string[]> = {
  "stipendium-hungaricum": ["Hungary"], "turkiye-burslari": ["Turkey"], "czech-albania": ["Czechia"], "slovak-gov": ["Slovakia"],
  "slovak-nsp": ["Slovakia"], "nawa-banach": ["Poland"], "romania-gov": ["Romania"], "csc-china": ["China"],
  "visegrad-scholarship": ["Czechia", "Hungary", "Poland", "Slovakia"], "mext-albania": ["Japan"], "fulbright-al": ["United States"],
  "erasmus-mundus": ["many"],
};

function countriesOf(o: Opportunity): string[] {
  const fromTags = o.tags.map((t) => TAG_COUNTRY[t]).filter(Boolean);
  return [...new Set([...fromTags, ...(ID_COUNTRIES[o.id] ?? [])])];
}

const VERDICT = { fits: "bg-emerald-100 text-emerald-800", check: "bg-amber-100 text-amber-800", "not-eligible": "bg-rose-100 text-rose-800" } as const;
const VERDICT_TEXT = { fits: "You can apply", check: "Check", "not-eligible": "Not for you" } as const;

export function ScholarshipsList({ country }: { country: string }) {
  const [profile] = useProfile();
  const now = useNow();
  const [showAll, setShowAll] = useState(false);

  const all = useMemo(() => {
    if (!now) return [];
    return opportunities
      .filter((o) => o.type === "scholarship")
      .map((o) => ({ o, m: matchOpportunity(o, profile, now), where: countriesOf(o) }))
      .filter(({ where }) => country === "all" || where.includes(country) || where.includes("many"))
      .sort((a, b) => compareMatches(a, b, "match"));
  }, [profile, now, country]);
  const sure = all.filter(({ m }) => m.verdict === "fits");
  const national = showAll ? all : sure;

  const universityNotes = useMemo(() => {
    const seen = new Map<string, { university: string; city?: string; note: string; source: string | undefined }>();
    for (const p of programs) {
      if (country !== "all" && p.country !== country) continue;
      if (!p.scholarships || seen.has(p.universityId)) continue;
      if (/^(none|almost none|no )/i.test(p.scholarships.trim())) continue;
      seen.set(p.universityId, { university: p.university, city: p.city, note: p.scholarships, source: p.sources[0] });
    }
    return [...seen.values()].sort((a, b) => a.university.localeCompare(b.university));
  }, [country]);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Scholarships you apply to directly{country !== "all" ? ` (${country})` : ""}</h2>
        {national.length === 0 && <p className="text-sm text-slate-600">No scholarship here that you can surely apply to right now. See the university notes below.</p>}
        {all.length > sure.length && (
          <p className="text-xs text-slate-500">
            {showAll ? "Showing all, including ones that are not for you or need checking." : `${all.length - sure.length} more are hidden: not open to you, closed, or not confirmed.`}{" "}
            <button onClick={() => setShowAll(!showAll)} className="underline">
              {showAll ? "Show only what I can apply to" : "Show them anyway"}
            </button>
          </p>
        )}
        <ul className="grid gap-3 md:grid-cols-2">
          {national.map(({ o, m, where }) => (
            <li key={o.id} className="space-y-1 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{o.provider}</p>
                  <h3 className="font-semibold">{o.title}</h3>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${VERDICT[m.verdict]}`}>{VERDICT_TEXT[m.verdict]}</span>
              </div>
              <p className="text-xs text-slate-600">
                Study in: {where.includes("many") ? "many countries" : where.join(", ") || "see page"}
                {o.eligibility.levels ? ` · For ${o.eligibility.levels.map((l) => GROUP_LABEL[l]).join(", ")}` : ""}
              </p>
              <p className="text-xs text-slate-600">
                Deadline: {formatDate(o.deadline)}
                {o.applyOpens ? ` · Opens: ${formatDate(o.applyOpens)}` : ""}
              </p>
              {m.reasons.length > 0 && <p className="text-xs text-slate-600">{m.reasons.join(" · ")}</p>}
              {o.note && <p className="text-xs text-slate-500">{o.note}</p>}
              <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-700 underline">
                Official page
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Scholarships at the universities</h2>
        <p className="text-xs text-slate-500">From our university research. Amounts and rules change every year, so confirm on the university page.</p>
        {universityNotes.length === 0 && <p className="text-sm text-slate-600">No university scholarship notes for this country.</p>}
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {universityNotes.map((u) => (
            <li key={u.university} className="p-3 text-sm">
              <p className="font-medium">
                {u.university}
                {u.city ? <span className="font-normal text-slate-500"> · {u.city}</span> : null}
              </p>
              <p className="text-slate-700">{u.note}</p>
              {u.source && (
                <a href={u.source} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-700 underline">
                  University page
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
