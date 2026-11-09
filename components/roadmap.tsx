"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { programs } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { isoDay } from "@/lib/calendar";
import { EMPTY_MARKS, STORAGE } from "@/lib/profile";
import { buildRoadmap, type RoadStep } from "@/lib/roadmap";
import { useNow, useStored } from "@/lib/storage";
import { useProfile } from "@/lib/use-profile";

const ICON: Record<RoadStep["key"], string> = {
  language: "M4 5h7M7.5 5v1.5c0 3-2 5.5-4.5 6.5M5 9c1 2 3 3.5 5 4M13 19l4-10 4 10M14.5 15.5h5",
  test: "M9 4h6v3H9zM6 6h3M15 6h3v14H6V6M9 12l2 2 4-4",
  apply: "M4 12l16-8-6 16-2-7z",
  visa: "M6 3h12v18H6zM9 8h6M12 12a2 2 0 1 0 0 .1M9 17h6",
  housing: "M3 11l9-7 9 7M5 10v10h14V10M10 20v-5h4v5",
  arrive: "M2 16l20-6-2-2-6 2-6-6-2 1 4 6-5 2-2-2-1 1z",
};

function Step({ s, today, last }: { s: RoadStep; today: string; last: boolean }) {
  const late = s.due !== null && s.due < today;
  const soon = s.due !== null && !late && s.due <= isoDay(new Date(Date.parse(`${today}T12:00:00`) + 30 * 86_400_000));
  return (
    <li className="relative flex gap-4 pb-6">
      {!last && <span className="absolute left-5 top-11 h-[calc(100%-2.75rem)] w-px bg-gradient-to-b from-violet-400/60 to-transparent" />}
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${s.official ? "border-amber-300 bg-amber-50 text-amber-700" : "border-violet-400/40 bg-violet-500/10 text-violet-200"}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={ICON[s.key]} />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="font-semibold text-slate-900">{s.title}</p>
          <p className={`text-sm font-medium ${late ? "text-rose-700" : soon ? "text-amber-700" : "text-slate-600"}`}>
            {s.due ? (late ? "Do it now" : `${s.official ? "Deadline" : "Suggested by"} ${formatDate(s.due)}`) : "Date not published yet"}
          </p>
        </div>
        <p className="mt-1 text-sm text-slate-600">{s.detail}</p>
      </div>
    </li>
  );
}

// One timeline per programme the student wants to apply to.
export function Roadmap() {
  const [marks] = useStored(STORAGE.uniMarks, EMPTY_MARKS);
  const [profile] = useProfile();
  const now = useNow();
  const starred = useMemo(() => programs.filter((p) => marks[p.id] === "apply"), [marks]);
  const [pick, setPick] = useState<string | null>(null);
  const current = starred.find((p) => p.id === pick) ?? starred[0];

  if (!now) return null;
  const today = isoDay(now);

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-panel p-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-slate-900">Your step-by-step plan</h2>
        <p className="text-sm text-slate-600">From language certificate to your first day. Gold is the official deadline; the other dates are suggestions worked out backwards from it, for a start in autumn 2027.</p>
      </div>
      {starred.length === 0 ? (
        <p className="text-sm text-slate-600">
          Mark programmes with &quot;Want to apply&quot; on the{" "}
          <Link href="/universities" className="text-violet-300 underline">
            Universities
          </Link>{" "}
          page and your plan appears here.
        </p>
      ) : (
        <>
          {starred.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {starred.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPick(p.id)}
                  aria-pressed={p.id === current?.id}
                  className={`rounded-full border px-3 py-1 text-xs ${p.id === current?.id ? "border-transparent bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:text-slate-900"}`}
                >
                  {p.university}
                  {p.program ? `: ${p.program}` : ""}
                </button>
              ))}
            </div>
          )}
          {current && (
            <div>
              <p className="mb-4 text-sm text-slate-500">
                {current.university}
                {current.program ? ` · ${current.program}` : ""} · {current.country}
              </p>
              <ol>
                {buildRoadmap(current, profile).map((s, i, all) => (
                  <Step key={s.key} s={s} today={today} last={i === all.length - 1} />
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </section>
  );
}
