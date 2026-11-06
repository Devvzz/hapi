"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { costs, FOCUS_COUNTRIES, programs } from "@/lib/data";
import { checkProgram, type Eligibility } from "@/lib/eligibility";
import { EMPTY_LOG, EMPTY_PLAN, EMPTY_PROFILE, STORAGE, logEntry } from "@/lib/profile";
import { useStored } from "@/lib/storage";
import type { PlanRow, Program } from "@/lib/types";

const ICON: Record<Eligibility["status"], string> = { ok: "✅", warn: "⚠️", no: "❌" };
const OTHER_COUNTRIES = [...new Set(programs.map((p) => p.country))].filter((c) => !FOCUS_COUNTRIES.includes(c)).sort();

type Explanation = { summary: string; nextSteps: string[] };

export function UniversitiesList() {
  const [profile] = useStored(STORAGE.profile, EMPTY_PROFILE);
  const [plan, setPlan] = useStored(STORAGE.plan, EMPTY_PLAN);
  const [, setLog] = useStored(STORAGE.log, EMPTY_LOG);
  const [country, setCountry] = useState("Austria");
  const [status, setStatus] = useState<"all" | "ok" | "warn" | "no">("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(40);
  const [explained, setExplained] = useState<Record<string, Explanation | "loading" | "error">>({});

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return programs
      .filter((p) => country === "all" || p.country === country)
      .filter((p) => !q || `${p.university} ${p.program ?? ""} ${p.fields ?? ""} ${p.city ?? ""}`.toLowerCase().includes(q))
      .map((p) => ({ p, e: checkProgram(p, profile) }))
      .filter(({ e }) => status === "all" || e.status === status)
      .sort((a, b) => ["ok", "warn", "no"].indexOf(a.e.status) - ["ok", "warn", "no"].indexOf(b.e.status) || a.p.university.localeCompare(b.p.university));
  }, [profile, country, status, query]);

  async function explain(p: Program, e: Eligibility) {
    setExplained((x) => ({ ...x, [p.id]: "loading" }));
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId: p.id, profile, status: e.status, reasons: e.reasons }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as Explanation;
      setExplained((x) => ({ ...x, [p.id]: data }));
    } catch {
      setExplained((x) => ({ ...x, [p.id]: "error" }));
    }
  }

  function planProgram(p: Program, e: Eligibility) {
    const add: PlanRow[] = [];
    const tuition = e.tuitionPerYear?.max ?? e.tuitionPerYear?.min ?? null;
    if (tuition !== null) {
      add.push({ id: `tuition-${p.id}`, item: `Tuition year 1: ${p.university}${p.program ? `, ${p.program}` : ""}`, amount: tuition, currency: "EUR", dueDate: null, sponsor: "", status: "unpaid", sourceUrl: p.sources[0] ?? null });
    }
    for (const c of costs.filter((c) => c.scope === p.country && c.amount !== null && c.period !== "semester" && c.period !== "year")) {
      add.push({ id: `cost-${c.id}`, item: c.item, amount: c.amount!, currency: c.currency ?? "EUR", dueDate: null, sponsor: "", status: "unpaid", sourceUrl: c.sourceUrl });
    }
    const fresh = add.filter((r) => !plan.some((x) => x.id === r.id));
    setPlan([...plan, ...fresh]);
    setLog((l) => [logEntry("Planned programme", `${p.university}: ${fresh.length} cost rows added`), ...l]);
  }

  const noProfile = profile.languages.length === 0 && profile.budgetPerYear === null;

  return (
    <div className="space-y-4">
      {noProfile && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Add your languages and budget in <Link href="/profile" className="underline">your profile</Link> for a real check.
        </p>
      )}
      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <select className="rounded border border-slate-300 px-2 py-1" value={country} onChange={(e) => { setCountry(e.target.value); setLimit(40); }}>
          {FOCUS_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
          <optgroup label="More countries">
            {OTHER_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
          </optgroup>
          <option value="all">All countries</option>
        </select>
        <select className="rounded border border-slate-300 px-2 py-1" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">All results</option>
          <option value="ok">✅ Can apply</option>
          <option value="warn">⚠️ Check</option>
          <option value="no">❌ Not now</option>
        </select>
        <input className="flex-1 rounded border border-slate-300 px-2 py-1" placeholder="Search university, programme, field, city" value={query} onChange={(e) => setQuery(e.target.value)} />
        <span className="self-center text-slate-600">{rows.length} programmes</span>
      </div>

      <ul className="space-y-3">
        {rows.slice(0, limit).map(({ p, e }) => {
          const ex = explained[p.id];
          const verify = p.tuitionNonEuPerYear?.confidence === "estimate" || p.tuitionNonEuPerYear?.confidence === "needs-check" || !!p.deadlineCycle;
          const planned = plan.some((r) => r.id === `tuition-${p.id}`);
          return (
            <li key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{ICON[e.status]} {p.program ?? "Programme to choose"}</h2>
                  <p className="text-sm text-slate-600">{p.university}{p.city ? ` · ${p.city}` : ""} · {p.country} · {p.language ?? "language: check yourself"}</p>
                </div>
                {verify && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">verify</span>}
              </div>
              <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
                {e.reasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
              <p className="mt-1 text-xs text-slate-500">
                Deadline: {p.deadline ?? p.nonEuWindow ?? "check yourself"}{p.admission ? ` · Admission: ${p.admission}` : ""}
              </p>
              {p.checkYourself.length > 0 && <p className="text-xs text-amber-800">Check yourself: {p.checkYourself.join("; ")}</p>}
              {ex && ex !== "loading" && ex !== "error" && (
                <div className="mt-2 rounded bg-teal-50 p-3 text-sm text-teal-900">
                  <p>{ex.summary}</p>
                  {ex.nextSteps.length > 0 && <ol className="mt-1 list-inside list-decimal">{ex.nextSteps.map((s) => <li key={s}>{s}</li>)}</ol>}
                </div>
              )}
              {ex === "error" && <p className="mt-2 text-sm text-rose-700">AI is busy. The reasons above still apply.</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <button onClick={() => explain(p, e)} disabled={ex === "loading"} className="rounded border border-teal-700 px-2 py-1 text-teal-800 disabled:opacity-50">
                  {ex === "loading" ? "Explaining…" : "Explain in plain English"}
                </button>
                <button onClick={() => planProgram(p, e)} disabled={planned} className="rounded bg-teal-700 px-2 py-1 text-white disabled:opacity-50">
                  {planned ? "In cost plan" : "Plan the cost"}
                </button>
                <span className="ml-auto flex gap-2 text-xs">
                  {p.sources.slice(0, 2).map((s, i) => (
                    <a key={s} href={s} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">Source {i + 1}</a>
                  ))}
                  <span className="text-slate-500">{p.lastChecked ? `checked ${p.lastChecked}` : "research date unknown"}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      {rows.length > limit && (
        <button onClick={() => setLimit(limit + 40)} className="rounded border border-slate-300 bg-white px-4 py-2 text-sm">Show more</button>
      )}
    </div>
  );
}
