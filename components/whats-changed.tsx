"use client";

import { useEffect, useMemo, useState } from "react";
import { opportunities } from "@/lib/data";
import { daysUntil, formatDate, parseDeadline } from "@/lib/dates";
import type { CheckResult, ResearchRun } from "@/lib/research";
import { useNow } from "@/lib/storage";

const CHANGE_TEXT: Record<NonNullable<CheckResult["change"]>, string> = {
  "date-changed": "Date changed",
  closed: "Closed",
  "new-edition": "New edition",
  unreachable: "Page not reachable",
};

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="rgb(52 211 153 / 0.12)" stroke="rgb(52 211 153 / 0.6)" />
      <path d="M6 10.5l2.6 2.5L14 7.5" fill="none" stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function nextSaturday(now: Date): string {
  const d = new Date(now);
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function WhatsChanged() {
  const [run, setRun] = useState<ResearchRun | null>(null);
  const now = useNow();

  useEffect(() => {
    fetch("/api/changes")
      .then((r) => (r.ok ? (r.json() as Promise<ResearchRun>) : null))
      .then(setRun)
      .catch(() => setRun(null));
  }, []);

  const closingSoon = useMemo(() => {
    if (!now) return [];
    return opportunities
      .map((o) => {
        const d = parseDeadline(o.deadline);
        return { o, days: d ? daysUntil(d, now) : null };
      })
      .filter((x): x is { o: (typeof opportunities)[number]; days: number } => x.days !== null && x.days >= 0 && x.days <= 7)
      .sort((a, b) => a.days - b.days);
  }, [now]);

  const changes = run?.checked.filter((c) => c.change) ?? [];
  const confirmed = run?.checked.filter((c) => !c.change && c.status === "open") ?? [];
  const ranAt = run?.ranAt ? new Date(run.ranAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-violet-600/15 via-transparent to-cyan-500/10 px-6 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300">Weekly check</p>
          <h2 className="text-xl font-bold">What changed this week</h2>
        </div>
        {ranAt && (
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-600">
            {run?.example ? "Example run" : "Last check"} · {ranAt}
          </span>
        )}
      </div>

      <div className="space-y-6 p-6">
        {run && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { n: run.checked.length, label: "official pages re-read" },
              { n: changes.length, label: changes.length === 1 ? "change found" : "changes found" },
              { n: now ? nextSaturday(now) : "Sat", label: "next check" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="font-display text-2xl font-bold text-gradient">{s.n}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {run && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Deadlines confirmed</h3>
              <ul className="space-y-2">
                {changes.map((c) => (
                  <li key={c.id} className="flex items-start gap-3 rounded-xl border border-amber-300/30 bg-amber-50 px-3 py-2 text-sm">
                    <span className="mt-0.5 rounded-full bg-amber-300/20 px-2 text-xs text-amber-800">{CHANGE_TEXT[c.change!]}</span>
                    <span className="flex-1">
                      {c.title}
                      {c.change === "date-changed" && <span className="block text-xs text-slate-500">now {formatDate(c.foundDeadline)}, was {formatDate(c.storedDeadline)}</span>}
                    </span>
                    <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-300 hover:text-cyan-200">
                      source
                    </a>
                  </li>
                ))}
                {confirmed.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-sm">
                    <Check />
                    <span className="min-w-0 flex-1 truncate text-slate-800">{c.title}</span>
                    <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-600">{formatDate(c.storedDeadline)}</span>
                  </li>
                ))}
              </ul>
              {run.example && (
                <p className="text-xs leading-relaxed text-slate-500">
                  Every Saturday Hapi re-reads the official pages of open opportunities. This is a real run from {ranAt}, shown until live storage is switched on.
                </p>
              )}
            </div>
          )}

          {closingSoon.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Closing in the next 7 days</h3>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {closingSoon.map(({ o, days }) => {
                  const urgent = days <= 2;
                  return (
                    <li key={o.id}>
                      <a
                        href={o.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glow-card flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                      >
                        <span
                          className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border ${
                            urgent ? "border-rose-400/50 bg-rose-500/10 text-rose-800" : "border-violet-400/40 bg-violet-500/10 text-violet-200"
                          }`}
                        >
                          <span className="font-display text-lg font-bold leading-none">{days}</span>
                          <span className="text-[9px] uppercase tracking-wider">{days === 1 ? "day" : "days"}</span>
                        </span>
                        <span className="min-w-0 text-sm">
                          <span className="block truncate font-medium text-slate-900">{o.title}</span>
                          <span className="block text-xs text-slate-500">Deadline {formatDate(o.deadline)}</span>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
