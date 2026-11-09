"use client";

import { useEffect, useState } from "react";
import type { ResearchRun } from "@/lib/research";
import { fetchStats, type HapiStats } from "@/lib/track";

const TYPE_LABEL: Record<string, string> = {
  hackathon: "Hackathons",
  competition: "Competitions",
  certificate: "Certificates",
  course: "Courses",
  "summer-school": "Summer schools",
  internship: "Internships",
  job: "Jobs",
  scholarship: "Scholarships",
  grant: "Grants",
  conference: "Conferences",
  exchange: "Exchanges",
  "startup-program": "Startup programmes",
};

function Bar({ label, n, total, tone = "from-violet-500 to-cyan-400" }: { label: string; n: number; total: number; tone?: string }) {
  const pct = total > 0 ? Math.round((n / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-white">{label}</span>
        <span className="text-slate-600">
          {pct}% · {n}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </div>
  );
}

function Tile({ n, label, note }: { n: number | string; label: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-panel p-4">
      <p className="font-display text-3xl font-bold text-white">{n}</p>
      <p className="text-sm text-slate-600">{label}</p>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </div>
  );
}

// Users, usage, money and feedback from the anonymous counter, and the weekly AI job.
export function LiveStats() {
  const [stats, setStats] = useState<HapiStats | null | "loading">("loading");
  const [run, setRun] = useState<ResearchRun | null>(null);

  useEffect(() => {
    fetchStats().then(setStats);
    fetch("/api/changes")
      .then((r) => (r.ok ? r.json() : null))
      .then(setRun)
      .catch(() => setRun(null));
  }, []);

  const s = stats === "loading" ? null : stats;
  const countries = s?.countries ?? [];
  const top = countries.slice(0, 6);
  const rest = countries.slice(6).reduce((t, c) => t + c.n, 0);
  const survey = (s?.surveyYes ?? 0) + (s?.surveyNo ?? 0);
  const ch = s?.aiChanges ?? {};
  const corrected = (ch["date-changed"] ?? 0) + (ch.closed ?? 0);
  const runChanges = run?.checked.filter((c) => c.change !== null).length ?? 0;

  return (
    <div className="space-y-10">
      {stats === null && (
        <p className="rounded-xl border border-[#fcd34d]/30 bg-[#fcd34d]/[0.06] p-4 text-sm text-slate-700">
          Live counts appear once the counting table is set up in the database. The numbers about the data below are already live.
        </p>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold text-white">Users</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Tile n={s?.profiles ?? "–"} label="profiles made" note="counted once per browser" />
          <Tile n={s?.accounts ?? "–"} label="accounts" note="students who saved their data online" />
          <Tile n={countries.length || "–"} label="countries" />
        </div>
        {top.length > 0 && (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-panel p-5">
            <p className="text-sm font-medium text-slate-600">Where students come from</p>
            {top.map((c) => (
              <Bar key={c.country} label={c.country} n={c.n} total={s!.profiles} />
            ))}
            {rest > 0 && <Bar label="Other countries" n={rest} total={s!.profiles} tone="from-slate-500 to-slate-400" />}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold text-white">Usage</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Tile n={s?.saves ?? "–"} label="items saved" />
          <Tile n={s?.findMore ?? "–"} label="searches with “Find more with AI”" />
          <Tile n={s?.chats ?? "–"} label="questions to the Ask Hapi chat" />
        </div>
        {s && s.saveTypes.length > 0 && (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-panel p-5">
            <p className="text-sm font-medium text-slate-600">Most saved types</p>
            {s.saveTypes.slice(0, 6).map((t) => (
              <Bar key={t.type} label={TYPE_LABEL[t.type] ?? t.type} n={t.n} total={s.saves} tone="from-cyan-400 to-emerald-400" />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold text-white">The weekly AI job</h2>
        <p className="text-sm text-slate-600">Every Saturday the AI opens the official page of the items with the closest deadlines and checks if the date is still right, if the item has closed or if a new round has started.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Tile n={s ? s.aiChecks : run ? run.checked.length : "–"} label="dates checked" note={s ? "since counting started" : "in the latest run"} />
          <Tile n={s ? corrected : runChanges} label="dates corrected or closed" note="found by the AI on the official page" />
          <Tile n={s ? (ch["new-edition"] ?? 0) : run ? run.checked.filter((c) => c.change === "new-edition").length : "–"} label="new rounds found" />
        </div>
        {run && (
          <p className="text-xs text-slate-500">
            Latest run: {new Date(run.ranAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {run.checked.length} pages checked · {runChanges} changes
            {run.example ? " · saved example run" : ""}
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold text-white">Money</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Tile n={s?.costPlans ?? "–"} label="cost plans started" />
          <Tile n={s?.invoices ?? "–"} label="sponsor invoices sent with PayPal" note="PayPal sandbox: test invoices, no real money" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold text-white">Feedback</h2>
        {survey > 0 ? (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-panel p-5">
            <p className="text-sm text-slate-600">“Did Hapi show you something you did not know about before?” · {survey} answers</p>
            <Bar label="Yes" n={s!.surveyYes} total={survey} tone="from-emerald-400 to-cyan-400" />
            <Bar label="Not yet" n={s!.surveyNo} total={survey} tone="from-slate-500 to-slate-400" />
          </div>
        ) : (
          <p className="text-sm text-slate-600">After saving something, students are asked one question: “Did Hapi show you something you did not know about before?” The answers appear here.</p>
        )}
      </section>

      {s?.since && <p className="text-xs text-slate-500">Counting since {new Date(s.since).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.</p>}
    </div>
  );
}
