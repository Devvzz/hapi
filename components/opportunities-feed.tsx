"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { opportunities } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { matchOpportunity, type Match } from "@/lib/match";
import { EMPTY_LOG, EMPTY_PLAN, EMPTY_PROFILE, EMPTY_SAVED, STORAGE, logEntry } from "@/lib/profile";
import { useStored } from "@/lib/storage";
import type { Opportunity, OpportunityType } from "@/lib/types";
import { FindMore } from "./find-more";

const TYPES: OpportunityType[] = [
  "hackathon", "competition", "certificate", "course", "summer-school", "internship", "job",
  "scholarship", "grant", "conference", "exchange", "startup-program",
];

const VERDICT_STYLE: Record<Match["verdict"], string> = {
  fits: "bg-emerald-100 text-emerald-800",
  check: "bg-amber-100 text-amber-800",
  "not-eligible": "bg-rose-100 text-rose-800",
};
const VERDICT_TEXT: Record<Match["verdict"], string> = { fits: "Fits you", check: "Check", "not-eligible": "Not eligible" };

function costLabel(o: Opportunity): string {
  if (o.costType === null) return "Cost: check yourself";
  if (o.costType === "free") return "Free";
  const price = o.price ? `${o.price.amount.toLocaleString("en-GB")} ${o.price.currency}` : "price: check yourself";
  return o.costType === "discount" ? `Discount (${price})` : `Paid: ${price}`;
}

function travelLabel(o: Opportunity): string | null {
  if (o.travelPaid === "full") return "Travel paid";
  if (o.travelPaid === "partial") return "Travel partly paid";
  if (o.travelPaid === "none") return "Travel not covered";
  return null;
}

export function OpportunitiesFeed() {
  const [profile] = useStored(STORAGE.profile, EMPTY_PROFILE);
  const [saved, setSaved] = useStored(STORAGE.saved, EMPTY_SAVED);
  const [plan, setPlan] = useStored(STORAGE.plan, EMPTY_PLAN);
  const [, setLog] = useStored(STORAGE.log, EMPTY_LOG);

  const [type, setType] = useState<string>("all");
  const [cost, setCost] = useState<"all" | "free" | "paid">("all");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [travelOnly, setTravelOnly] = useState(false);
  const [certOnly, setCertOnly] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [soonOnly, setSoonOnly] = useState(false);
  const [hideClosed, setHideClosed] = useState(true);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(30);
  const [why, setWhy] = useState<Record<string, string>>({});
  const [whyState, setWhyState] = useState<"idle" | "loading" | "error">("idle");

  const ranked = useMemo(() => {
    const q = query.trim().toLowerCase();
    const max = Number(maxPrice);
    return opportunities
      .map((o) => ({ o, m: matchOpportunity(o, profile) }))
      .filter(({ o, m }) => {
        if (type !== "all" && o.type !== type) return false;
        if (cost === "free" && o.costType !== "free") return false;
        if (cost === "paid" && o.costType !== "paid" && o.costType !== "discount") return false;
        if (maxPrice && max > 0 && o.price && o.price.amount > max) return false;
        if (travelOnly && o.travelPaid !== "full" && o.travelPaid !== "partial") return false;
        if (certOnly && !o.certificateIncluded) return false;
        if (onlineOnly && o.mode !== "online") return false;
        if (eligibleOnly && m.verdict === "not-eligible") return false;
        if (soonOnly && (m.daysLeft === null || m.daysLeft < 0 || m.daysLeft > 30)) return false;
        if (hideClosed && m.closed) return false;
        if (q && !`${o.title} ${o.provider} ${o.tags.join(" ")} ${o.location ?? ""}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.m.score - a.m.score || (a.m.daysLeft ?? 9999) - (b.m.daysLeft ?? 9999));
  }, [profile, type, cost, maxPrice, travelOnly, certOnly, onlineOnly, eligibleOnly, soonOnly, hideClosed, query]);

  const visible = ranked.slice(0, limit);
  const profileEmpty = !profile.nationality && profile.age === null && profile.interests.length === 0;

  function toggleSaved(o: Opportunity) {
    const isSaved = saved.includes(o.id);
    setSaved(isSaved ? saved.filter((id) => id !== o.id) : [...saved, o.id]);
    setLog((l) => [logEntry(isSaved ? "Removed from plan" : "Saved to plan", o.title), ...l]);
  }

  function addCost(o: Opportunity) {
    if (!o.price) return;
    setPlan([
      ...plan,
      {
        id: `opp-${o.id}`,
        item: o.title,
        amount: o.price.amount,
        currency: o.price.currency,
        dueDate: o.deadline,
        sponsor: "",
        status: "unpaid",
        sourceUrl: o.sourceUrl,
      },
    ]);
    setLog((l) => [logEntry("Added cost", `${o.title}: ${o.price!.amount} ${o.price!.currency}`), ...l]);
  }

  async function explainTop() {
    setWhyState("loading");
    try {
      const res = await fetch("/api/why", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, ids: visible.slice(0, 8).map(({ o }) => o.id) }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { lines: { id: string; line: string }[] };
      setWhy((w) => ({ ...w, ...Object.fromEntries(data.lines.map((l) => [l.id, l.line])) }));
      setWhyState("idle");
    } catch {
      setWhyState("error");
    }
  }

  return (
    <div className="space-y-5">
      {profileEmpty && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Fill in <Link href="/profile" className="underline">your profile</Link> to get matches and eligibility checks.
        </p>
      )}

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <input className="rounded border border-slate-300 px-2 py-1" placeholder="Search (e.g. AI, Vienna, scholarship)" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="rounded border border-slate-300 px-2 py-1" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="rounded border border-slate-300 px-2 py-1" value={cost} onChange={(e) => setCost(e.target.value as typeof cost)}>
          <option value="all">Free and paid</option>
          <option value="free">Free only</option>
          <option value="paid">Paid or discounted</option>
        </select>
        <input className="rounded border border-slate-300 px-2 py-1" type="number" min={0} placeholder="Max price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        {([
          [travelOnly, setTravelOnly, "Travel paid"],
          [certOnly, setCertOnly, "Certificate included"],
          [onlineOnly, setOnlineOnly, "Online"],
          [eligibleOnly, setEligibleOnly, "Eligible for me"],
          [soonOnly, setSoonOnly, "Deadline in 30 days"],
          [hideClosed, setHideClosed, "Hide closed"],
        ] as const).map(([value, setter, label]) => (
          <label key={label} className="flex items-center gap-2">
            <input type="checkbox" checked={value} onChange={(e) => setter(e.target.checked)} />
            {label}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-slate-600">{ranked.length} results</span>
        <button onClick={explainTop} disabled={whyState === "loading" || visible.length === 0} className="rounded bg-teal-700 px-3 py-1.5 text-white disabled:opacity-50">
          {whyState === "loading" ? "Writing…" : "Why do my top matches fit me?"}
        </button>
        {whyState === "error" && <span className="text-rose-700">AI is busy. The rule-based reasons below still apply.</span>}
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {visible.map(({ o, m }) => {
          const isSaved = saved.includes(o.id);
          const costAdded = plan.some((r) => r.id === `opp-${o.id}`);
          const travel = travelLabel(o);
          return (
            <li key={o.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{o.type} · {o.provider}</p>
                  <h2 className="font-semibold">{o.title}</h2>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${VERDICT_STYLE[m.verdict]}`}>{VERDICT_TEXT[m.verdict]} · {m.score}</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600">
                <div><dt className="inline font-medium">Opens: </dt><dd className="inline">{formatDate(o.applyOpens)}</dd></div>
                <div><dt className="inline font-medium">Deadline: </dt><dd className="inline">{formatDate(o.deadline)}</dd></div>
                <div><dt className="inline font-medium">Event: </dt><dd className="inline">{o.eventDates ?? "TBA"}</dd></div>
                <div><dt className="inline font-medium">Results: </dt><dd className="inline">{formatDate(o.resultsDate)}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-slate-100 px-2 py-0.5">{costLabel(o)}</span>
                {travel && <span className="rounded bg-slate-100 px-2 py-0.5">{travel}</span>}
                {o.certificateIncluded && <span className="rounded bg-slate-100 px-2 py-0.5">Certificate</span>}
                <span className="rounded bg-slate-100 px-2 py-0.5">{o.mode ?? "mode TBA"}{o.location ? ` · ${o.location}` : ""}</span>
              </div>
              {why[o.id] && <p className="rounded bg-teal-50 p-2 text-sm text-teal-900">{why[o.id]}</p>}
              {m.reasons.length > 0 && <p className="text-xs text-slate-600">{m.reasons.join(" · ")}</p>}
              {o.discountNote && <p className="text-xs text-slate-600">{o.discountNote}</p>}
              {o.note && <p className="text-xs text-slate-500">{o.note}</p>}
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-2 text-sm">
                <button onClick={() => toggleSaved(o)} className="rounded border border-teal-700 px-2 py-1 text-teal-800">
                  {isSaved ? "Saved ✓" : "Save to my plan"}
                </button>
                {o.price && (o.costType === "paid" || o.costType === "discount") && (
                  <button onClick={() => addCost(o)} disabled={costAdded} className="rounded bg-teal-700 px-2 py-1 text-white disabled:opacity-50">
                    {costAdded ? "Cost in plan" : "Add cost to my plan"}
                  </button>
                )}
                <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-teal-700 underline">
                  Source · checked {o.lastChecked}
                </a>
              </div>
            </li>
          );
        })}
      </ul>
      {ranked.length > limit && (
        <button onClick={() => setLimit(limit + 30)} className="rounded border border-slate-300 bg-white px-4 py-2 text-sm">
          Show more
        </button>
      )}
      <FindMore />
    </div>
  );
}
