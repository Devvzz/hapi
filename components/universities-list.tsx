"use client";

import { useMemo, useState } from "react";
import { costs, FOCUS_COUNTRIES, programs } from "@/lib/data";
import { checkProgram, type Eligibility } from "@/lib/eligibility";
import { formatPrice } from "@/lib/price";
import { formatDate } from "@/lib/dates";
import { EMPTY_LOG, EMPTY_MARKS, EMPTY_PLAN, STORAGE, logEntry, type UniMark } from "@/lib/profile";
import { useStored } from "@/lib/storage";
import { useProfile } from "@/lib/use-profile";
import type { PlanRow, Program } from "@/lib/types";
import { ScholarshipsList } from "./scholarships-list";

const ICON: Record<Eligibility["status"], string> = { ok: "✅", warn: "⚠️", no: "❌" };
const RANK: Record<Eligibility["status"], number> = { ok: 0, warn: 1, no: 2 };
const OTHER_COUNTRIES = [...new Set(programs.map((p) => p.country))].filter((c) => !FOCUS_COUNTRIES.includes(c)).sort();

type Explanation = { summary: string; nextSteps: string[] };

// Research notes like "None", "Check" or only "Erasmus+" (exchange funding) do not count as offering scholarships.
function hasScholarships(note: string | null): boolean {
  const t = (note ?? "").trim();
  return t !== "" && !/^(none|almost none|no|check)\b/i.test(t) && !/^erasmus\+?\.?$/i.test(t);
}
type Row = { p: Program; e: Eligibility };
type Uni = { id: string; name: string; city?: string; country: string; type?: string; rows: Row[]; best: Eligibility["status"]; cheapest: number | null; cheapestLabel: string | null; scholarships: string | null; feeRule: string | null };

export function UniversitiesList() {
  const [tab, setTab] = useState<"unis" | "scholarships">("unis");
  const [profile] = useProfile();
  const [country, setCountry] = useState("Austria");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["unis", "Universities and programmes"],
            ["scholarships", "Scholarships"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm ${tab === key ? "bg-teal-700 text-white" : "border border-slate-300 bg-panel"}`}
          >
            {label}
          </button>
        ))}
        <select className="ml-auto rounded border border-slate-300 bg-panel px-2 py-1 text-sm" value={country} onChange={(e) => setCountry(e.target.value)}>
          {FOCUS_COUNTRIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
          <optgroup label="More countries">
            {OTHER_COUNTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </optgroup>
          <option value="all">All countries</option>
        </select>
      </div>
      <p className="text-xs text-slate-500">
        Prices are for you: {profile.nationality ? `${profile.nationality} passport` : "add your nationality"}
        {profile.austrianSchool ? ", Austrian school abroad" : ""}
        {profile.budgetPerYear !== null ? `, budget €${profile.budgetPerYear.toLocaleString("en-GB")}/year` : ""}.
      </p>
      {tab === "unis" ? <Universities country={country} /> : <ScholarshipsList country={country} />}
    </div>
  );
}

function Universities({ country }: { country: string }) {
  const [profile] = useProfile();
  const [plan, setPlan] = useStored(STORAGE.plan, EMPTY_PLAN);
  const [, setLog] = useStored(STORAGE.log, EMPTY_LOG);
  const [marks, setMarks] = useStored(STORAGE.uniMarks, EMPTY_MARKS);
  const [status, setStatus] = useState<"all" | "ok" | "warn" | "mine">("all");
  const [sort, setSort] = useState<"fit" | "price" | "name">("fit");
  const [withScholarships, setWithScholarships] = useState(false);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(15);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [explained, setExplained] = useState<Record<string, Explanation | "loading" | "error">>({});

  const unis = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groups = new Map<string, Row[]>();
    for (const p of programs) {
      if (country !== "all" && p.country !== country) continue;
      if (q && !`${p.university} ${p.program ?? ""} ${p.fields ?? ""} ${p.city ?? ""}`.toLowerCase().includes(q)) continue;
      const e = checkProgram(p, profile);
      if (status === "ok" && e.status !== "ok") continue;
      if (status === "warn" && e.status === "no") continue;
      if (status === "mine" && marks[p.id] !== "apply") continue;
      if (status !== "mine" && marks[p.id] === "no") continue;
      const list = groups.get(p.universityId) ?? [];
      list.push({ p, e });
      groups.set(p.universityId, list);
    }
    const out: Uni[] = [...groups.entries()].map(([id, rows]) => {
      rows.sort((a, b) => RANK[a.e.status] - RANK[b.e.status] || (a.e.price.min ?? 1e9) - (b.e.price.min ?? 1e9));
      const first = rows[0].p;
      const priced = rows.filter((r) => r.e.price.min !== null).sort((a, b) => a.e.price.min! - b.e.price.min!);
      return {
        id,
        name: first.university,
        city: first.city,
        country: first.country,
        type: first.type,
        rows,
        best: rows[0].e.status,
        cheapest: priced[0]?.e.price.min ?? null,
        cheapestLabel: priced[0] ? formatPrice(priced[0].e.price) : null,
        scholarships: rows.map((r) => r.p.scholarships).find(Boolean) ?? null,
        feeRule: rows.map((r) => r.p.feeRule).find(Boolean) ?? null,
      };
    });
    return out.filter((u) => !withScholarships || hasScholarships(u.scholarships)).sort((a, b) => {
      if (sort === "price") return (a.cheapest ?? 1e9) - (b.cheapest ?? 1e9);
      if (sort === "name") return a.name.localeCompare(b.name);
      return RANK[a.best] - RANK[b.best] || (a.cheapest ?? 1e9) - (b.cheapest ?? 1e9);
    });
  }, [profile, country, status, sort, query, withScholarships, marks]);

  function mark(p: Program, value: UniMark) {
    const next = { ...marks };
    if (next[p.id] === value) delete next[p.id];
    else next[p.id] = value;
    setMarks(next);
    if (next[p.id]) setLog((l) => [logEntry(value === "apply" ? "Want to apply" : "Not interested", `${p.university}: ${p.program ?? ""}`), ...l]);
  }
  const hiddenCount = Object.values(marks).filter((m) => m === "no").length;
  const myCount = Object.values(marks).filter((m) => m === "apply").length;

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
    const tuition = e.price.max ?? e.price.min;
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

  const totalProgrammes = unis.reduce((n, u) => n + u.rows.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-panel p-4 text-sm">
        <select className="rounded border border-slate-300 px-2 py-1" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">All programmes</option>
          <option value="ok">✅ Only where I can apply</option>
          <option value="warn">✅ and ⚠️ (hide ❌)</option>
          <option value="mine">⭐ My list: want to apply ({myCount})</option>
        </select>
        <select className="rounded border border-slate-300 px-2 py-1" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="fit">Sort: best fit</option>
          <option value="price">Sort: cheapest for me</option>
          <option value="name">Sort: name</option>
        </select>
        <input className="min-w-48 flex-1 rounded border border-slate-300 px-2 py-1" placeholder="Search university, programme, field, city" value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={withScholarships} onChange={(e) => setWithScholarships(e.target.checked)} />
          Offers scholarships
        </label>
        <span className="self-center text-slate-600">
          {unis.length} universities · {totalProgrammes} programmes
          {hiddenCount > 0 && status !== "mine" ? ` · ${hiddenCount} marked not interested are hidden` : ""}
        </span>
      </div>

      <ul className="space-y-3">
        {unis.slice(0, limit).map((u) => {
          const okCount = u.rows.filter((r) => r.e.status === "ok").length;
          const isOpen = open[u.id] ?? false;
          return (
            <li key={u.id} className="rounded-xl border border-slate-200 bg-panel shadow-sm">
              <button onClick={() => setOpen((o) => ({ ...o, [u.id]: !isOpen }))} className="flex w-full flex-wrap items-start justify-between gap-3 p-4 text-left">
                <div>
                  <h2 className="font-semibold">
                    {ICON[u.best]} {u.name}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {[u.city, u.country, u.type].filter(Boolean).join(" · ")} · {okCount} of {u.rows.length} programmes open to you
                    {u.rows.some((r) => marks[r.p.id] === "apply") ? ` · ⭐ ${u.rows.filter((r) => marks[r.p.id] === "apply").length} on your list` : ""}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{u.cheapestLabel === null ? "Fee: check yourself" : `From ${u.cheapestLabel}/year`}</p>
                  <p className="text-xs text-teal-700">{isOpen ? "Hide programmes ▲" : "Show programmes ▼"}</p>
                </div>
              </button>
              {hasScholarships(u.scholarships) && (
                <p className="mx-4 -mt-2 mb-3 rounded bg-emerald-50 px-3 py-1.5 text-xs text-emerald-900">
                  <span className="font-medium">Scholarships: </span>
                  {u.scholarships}
                </p>
              )}
              {isOpen && (
                <div className="space-y-3 border-t border-slate-100 p-4">
                  {u.feeRule && (
                    <details className="text-xs text-slate-600">
                      <summary className="cursor-pointer font-medium">How fees work here</summary>
                      <p className="mt-1">{u.feeRule}</p>
                    </details>
                  )}
                  {u.rows.map(({ p, e }) => {
                    const ex = explained[p.id];
                    const planned = plan.some((r) => r.id === `tuition-${p.id}`);
                    return (
                      <div key={p.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium">
                              {ICON[e.status]} {p.program ?? "Programme to choose"}
                            </h3>
                            <p className="text-xs text-slate-600">
                              {p.language ?? "language: check yourself"}
                              {p.years ? ` · ${p.years} years` : ""}
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <p className="font-medium">{formatPrice(e.price)}/year</p>
                            <p className="text-xs text-slate-500">{e.price.basis}</p>
                            {!e.price.confirmed && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">verify fee</span>}
                          </div>
                        </div>
                        <dl className="mt-2 grid grid-cols-3 gap-2 rounded bg-slate-50 p-2 text-xs">
                          <div>
                            <dt className="text-slate-500">Entry test</dt>
                            <dd className="font-medium">{p.entryTest === "yes" ? "Yes" : p.entryTest === "no" ? "No" : "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Application fee</dt>
                            <dd className="font-medium">{p.applicationFeeShort ?? "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Apply by</dt>
                            <dd className="font-medium">{p.applyBy ? formatDate(p.applyBy) : "—"}</dd>
                          </div>
                        </dl>
                        <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
                          {e.reasons.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                          {e.price.notes.map((n) => (
                            <li key={n} className="text-slate-600">
                              {n}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-1 text-xs text-slate-500">
                          Deadline: {p.deadline ?? p.nonEuWindow ?? "check yourself"}
                          {p.admission ? ` · Admission: ${p.admission}` : ""}
                        </p>
                        {p.checkYourself.length > 0 && <p className="text-xs text-amber-800">Check yourself: {p.checkYourself.join("; ")}</p>}
                        {ex && ex !== "loading" && ex !== "error" && (
                          <div className="mt-2 rounded bg-teal-50 p-3 text-sm text-teal-900">
                            <p>{ex.summary}</p>
                            {ex.nextSteps.length > 0 && (
                              <ol className="mt-1 list-inside list-decimal">
                                {ex.nextSteps.map((s) => (
                                  <li key={s}>{s}</li>
                                ))}
                              </ol>
                            )}
                          </div>
                        )}
                        {ex === "error" && <p className="mt-2 text-sm text-rose-700">AI is busy. The reasons above still apply.</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                          <button onClick={() => mark(p, "apply")} className={`rounded px-2 py-1 ${marks[p.id] === "apply" ? "bg-amber-400 text-[#1a1300]" : "border border-amber-500 text-amber-800"}`}>
                            {marks[p.id] === "apply" ? "⭐ Want to apply" : "☆ Want to apply"}
                          </button>
                          <button onClick={() => mark(p, "no")} className="rounded border border-slate-300 px-2 py-1 text-slate-600">
                            {marks[p.id] === "no" ? "Not interested ✓" : "Not interested"}
                          </button>
                          <button onClick={() => explain(p, e)} disabled={ex === "loading"} className="rounded border border-teal-700 px-2 py-1 text-teal-800 disabled:opacity-50">
                            {ex === "loading" ? "Explaining…" : "Explain in plain English"}
                          </button>
                          <button onClick={() => planProgram(p, e)} disabled={planned} className="rounded bg-teal-700 px-2 py-1 text-white disabled:opacity-50">
                            {planned ? "In cost plan" : "Plan the cost"}
                          </button>
                          <span className="ml-auto flex gap-2 text-xs">
                            {p.sources.slice(0, 2).map((s, i) => (
                              <a key={s} href={s} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">
                                Source {i + 1}
                              </a>
                            ))}
                            <span className="text-slate-500">{p.lastChecked ? `checked ${p.lastChecked}` : "research date unknown"}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {unis.length > limit && (
        <button onClick={() => setLimit(limit + 15)} className="rounded border border-slate-300 bg-panel px-4 py-2 text-sm">
          Show more universities
        </button>
      )}
    </div>
  );
}
