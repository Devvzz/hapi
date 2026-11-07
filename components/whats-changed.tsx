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

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">What changed this week</h2>
        {run?.ranAt && (
          <p className="text-xs text-slate-500">
            {run.example ? "Example run" : "Last check"} · {new Date(run.ranAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}
      </div>
      {run?.example && run.note && <p className="text-xs text-amber-700">{run.note}</p>}

      {run && (
        <div className="space-y-2 text-sm">
          <p className="text-slate-600">
            Every Saturday Hapi re-reads the official page of a few open opportunities. This time: {run.checked.length} pages read,{" "}
            {changes.length === 0 ? "no changes found" : `${changes.length} changed`}.
          </p>
          <ul className="space-y-1">
            {changes.map((c) => (
              <li key={c.id} className="rounded bg-amber-50 px-3 py-2">
                <span className="font-medium">{CHANGE_TEXT[c.change!]}:</span> {c.title}
                {c.change === "date-changed" && ` (now ${formatDate(c.foundDeadline)}, was ${formatDate(c.storedDeadline)})`}{" "}
                <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">
                  source
                </a>
              </li>
            ))}
            {confirmed.map((c) => (
              <li key={c.id} className="text-slate-600">
                ✓ {c.title}: deadline {formatDate(c.storedDeadline)} confirmed
              </li>
            ))}
          </ul>
        </div>
      )}

      {closingSoon.length > 0 && (
        <div className="space-y-1 text-sm">
          <h3 className="font-medium">Closing in the next 7 days</h3>
          <ul className="space-y-1">
            {closingSoon.map(({ o, days }) => (
              <li key={o.id}>
                <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">
                  {o.title}
                </a>{" "}
                <span className="text-slate-500">· {days === 0 ? "today" : `${days} days`}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
