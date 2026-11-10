"use client";

import { useMemo, useState } from "react";
import { track } from "@/lib/track";
import Link from "next/link";
import { opportunities } from "@/lib/data";
import { formatDate, formatEventDates } from "@/lib/dates";
import { compareMatches, matchOpportunity, type Match, type SortKey } from "@/lib/match";
import { EMPTY_LOG, EMPTY_PLAN, EMPTY_SAVED, STORAGE, logEntry, profileIsSet } from "@/lib/profile";
import { useNow, useStored } from "@/lib/storage";
import { useProfile } from "@/lib/use-profile";
import { useStats } from "@/lib/social";
import type { Opportunity, OpportunityType } from "@/lib/types";
import { FindMore } from "./find-more";
import { CalendarIcon, HeartIcon, Stars } from "./ui";

const MODE = { online: "Online", onsite: "On site", hybrid: "Hybrid" } as const;

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
  const [profile] = useProfile();
  const [saved, setSaved] = useStored(STORAGE.saved, EMPTY_SAVED);
  const [plan, setPlan] = useStored(STORAGE.plan, EMPTY_PLAN);
  const [, setLog] = useStored(STORAGE.log, EMPTY_LOG);

  const [type, setType] = useState<string>("all");
  const [cost, setCost] = useState<"all" | "free" | "paid">("all");
  const [sortKey, setSortKey] = useState<SortKey>("match");
  const [travelOnly, setTravelOnly] = useState(false);
  const [certOnly, setCertOnly] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [soonOnly, setSoonOnly] = useState(false);
  const [hideClosed, setHideClosed] = useState(true);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(30);
  const [why, setWhy] = useState<Record<string, string>>({});
  const [whyState, setWhyState] = useState<"idle" | "loading" | "error">("idle");
  const now = useNow();
  const stats = useStats();

  // Only what the student can surely apply to: eligible, open and within budget. The rest stays hidden unless asked for.
  const { ranked, hidden } = useMemo(() => {
    if (!now) return { ranked: [], hidden: 0 };
    const q = query.trim().toLowerCase();
    const filtered = opportunities
      .map((o) => ({ o, m: matchOpportunity(o, profile, now) }))
      .filter(({ o, m }) => {
        if (type !== "all" && o.type !== type) return false;
        if (cost === "free" && o.costType !== "free") return false;
        if (cost === "paid" && o.costType !== "paid" && o.costType !== "discount") return false;
        if (travelOnly && o.travelPaid !== "full" && o.travelPaid !== "partial") return false;
        if (certOnly && !o.certificateIncluded) return false;
        if (onlineOnly && o.mode !== "online") return false;
        if (soonOnly && (m.daysLeft === null || m.daysLeft < 0 || m.daysLeft > 30)) return false;
        if (hideClosed && m.closed) return false;
        if (q && !`${o.title} ${o.provider} ${o.tags.join(" ")} ${o.location ?? ""}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => compareMatches(a, b, sortKey));
    // Without a profile Hapi cannot say what fits, so everything is shown without labels.
    if (!profileIsSet(profile)) return { ranked: filtered, hidden: 0 };
    const sure = filtered.filter(({ m }) => m.verdict === "fits");
    return { ranked: showAll ? filtered : sure, hidden: filtered.length - sure.length };
  }, [now, profile, type, cost, sortKey, showAll, travelOnly, certOnly, onlineOnly, soonOnly, hideClosed, query]);

  const visible = ranked.slice(0, limit);
  const known = profileIsSet(profile);
  const profileEmpty = !profile.nationality && profile.age === null && profile.interests.length === 0;

  function toggleSaved(o: Opportunity) {
    const isSaved = saved.includes(o.id);
    setSaved(isSaved ? saved.filter((id) => id !== o.id) : [...saved, o.id]);
    if (!isSaved) track("save", o.type);
    setLog((l) => [logEntry(isSaved ? "Removed from calendar" : "Added to calendar", o.title), ...l]);
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

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-panel p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <input className="rounded-lg border border-slate-300 bg-white px-3 py-1.5" placeholder="Search (e.g. AI, Vienna, scholarship)" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select aria-label="Type of opportunity" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select aria-label="Cost" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5" value={cost} onChange={(e) => setCost(e.target.value as typeof cost)}>
          <option value="all">Free and paid</option>
          <option value="free">Free only</option>
          <option value="paid">Paid or discounted</option>
        </select>
        <select aria-label="Sort opportunities" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
          <option value="match">Sort: best match</option>
          <option value="deadline">Sort: deadline soonest</option>
          <option value="cost">Sort: cheapest</option>
        </select>
        {([
          [travelOnly, setTravelOnly, "Travel paid"],
          [certOnly, setCertOnly, "Certificate included"],
          [onlineOnly, setOnlineOnly, "Online"],
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
        <span className="text-slate-600">
          {!now ? "Loading…" : !known ? `${ranked.length} opportunities` : showAll ? `${ranked.length} results, including ones to check` : `${ranked.length} you can apply to`}
        </span>
        {!known && (
          <Link href="/profile" className="font-medium text-teal-700 underline">
            Add your profile to see which ones you can apply to
          </Link>
        )}
        {known && <button onClick={explainTop} disabled={whyState === "loading" || visible.length === 0} className="rounded bg-teal-700 px-3 py-1.5 text-white disabled:opacity-50">
          {whyState === "loading" ? "Writing…" : "Why do my top matches fit me?"}
        </button>}
        {whyState === "error" && <span className="text-rose-700">AI is busy. The rule-based reasons below still apply.</span>}
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {visible.map(({ o, m }, i) => {
          const isSaved = saved.includes(o.id);
          const costAdded = plan.some((r) => r.id === `opp-${o.id}`);
          const travel = travelLabel(o);
          return (
            <li key={o.id} className="welcome-in glow-card flex flex-col gap-2 rounded-2xl border border-slate-200 bg-panel p-4" style={{ animationDelay: `${(i % 12) * 35}ms` }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{o.type} · {o.provider}</p>
                  <h2 className="font-semibold">
                    <Link href={`/opportunities/${o.id}`} className="hover:text-teal-800">
                      {o.title}
                    </Link>
                  </h2>
                </div>
                {known && <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${VERDICT_STYLE[m.verdict]}`}>{VERDICT_TEXT[m.verdict]}</span>}
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600">
                <div><dt className="inline font-medium">Opens: </dt><dd className="inline">{formatDate(o.applyOpens)}</dd></div>
                <div><dt className="inline font-medium">Deadline: </dt><dd className="inline">{formatDate(o.deadline)}</dd></div>
                <div><dt className="inline font-medium">Event: </dt><dd className="inline">{formatEventDates(o.eventDates)}</dd></div>
                <div><dt className="inline font-medium">Results: </dt><dd className="inline">{formatDate(o.resultsDate)}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-slate-100 px-2 py-0.5">{costLabel(o)}</span>
                {travel && <span className="rounded bg-slate-100 px-2 py-0.5">{travel}</span>}
                {o.certificateIncluded && <span className="rounded bg-slate-100 px-2 py-0.5">Certificate</span>}
                <span className="rounded bg-slate-100 px-2 py-0.5">{o.mode ? MODE[o.mode] : "Format TBA"}{o.location ? ` · ${o.location}` : ""}</span>
              </div>
              {why[o.id] && <p className="rounded bg-teal-50 p-2 text-sm text-teal-900">{why[o.id]}</p>}
              {known && m.reasons.length > 0 && <p className="text-xs text-slate-600">{m.reasons.join(" · ")}</p>}
              {o.discountNote && <p className="text-xs text-slate-600">{o.discountNote}</p>}
              {o.note && <p className="text-xs text-slate-500">{o.note}</p>}
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-2 text-sm">
                <button onClick={() => toggleSaved(o)} className="rounded border border-teal-700 px-2 py-1 text-teal-800">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon size={14} /> {isSaved ? "In calendar" : "Add to calendar"}
                  </span>
                </button>
                {o.price && (o.costType === "paid" || o.costType === "discount") && (
                  <button onClick={() => addCost(o)} disabled={costAdded} className="rounded bg-teal-700 px-2 py-1 text-white disabled:opacity-50">
                    {costAdded ? "Cost in plan" : "Add cost to my plan"}
                  </button>
                )}
                <Link href={`/opportunities/${o.id}`} className="inline-flex items-center gap-2 rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:border-violet-400/60">
                  <HeartIcon size={13} className="text-rose-700" /> {stats.get(o.id)?.likes ?? 0}
                  {stats.get(o.id)?.reviews ? (
                    <>
                      <Stars value={stats.get(o.id)!.avg_rating ?? 0} size={12} /> {stats.get(o.id)!.avg_rating}
                    </>
                  ) : null}
                  <span className="text-violet-300">Reviews &amp; details →</span>
                </Link>
                <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-teal-700 underline">
                  Source · checked {o.lastChecked}
                </a>
              </div>
            </li>
          );
        })}
      </ul>
      {ranked.length > limit && (
        <button onClick={() => setLimit(limit + 30)} className="rounded-lg border border-slate-300 bg-panel px-4 py-2 text-sm">
          Show more
        </button>
      )}
      {now && hidden > 0 && (
        <p className="text-xs text-slate-500">
          {showAll
            ? "Showing everything, including ones that do not apply to you."
            : `${hidden} more do not apply to you: not open to you, above your budget or closed.`}{" "}
          <button onClick={() => setShowAll(!showAll)} className="underline">
            {showAll ? "Show only what I can apply to" : "Show them"}
          </button>
        </p>
      )}
      <FindMore />
    </div>
  );
}
