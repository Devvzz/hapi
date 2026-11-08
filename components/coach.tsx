"use client";

import { useState } from "react";
import type { CoachStep } from "@/app/api/coach/route";
import { formatDate } from "@/lib/dates";
import { EMPTY_PLAN, EMPTY_PREMIUM, EMPTY_SAVED, STORAGE } from "@/lib/profile";
import { useStored } from "@/lib/storage";
import { useProfile } from "@/lib/use-profile";

type CoachResult = { summary: string; steps: CoachStep[]; createdAt: string };
const NO_RESULT: CoachResult | null = null;

export function Coach() {
  const [premium] = useStored(STORAGE.premium, EMPTY_PREMIUM);
  const [profile] = useProfile();
  const [saved] = useStored(STORAGE.saved, EMPTY_SAVED);
  const [plan] = useStored(STORAGE.plan, EMPTY_PLAN);
  const [result, setResult] = useStored(STORAGE.coach, NO_RESULT);
  const [state, setState] = useState<"idle" | "loading" | "error" | "locked">("idle");

  const active = premium.status === "ACTIVE" && premium.subscriptionId;

  async function run() {
    if (!premium.subscriptionId) return;
    setState("loading");
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: premium.subscriptionId,
          profile,
          savedIds: saved,
          plan: plan.map((r) => ({ item: r.item, amount: r.amount, currency: r.currency, dueDate: r.dueDate, status: r.status })),
        }),
      });
      if (res.status === 402) {
        setState("locked");
        return;
      }
      if (!res.ok) throw new Error();
      setResult((await res.json()) as CoachResult);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Your weekly coach</h2>
        {active && (
          <button onClick={run} disabled={state === "loading"} className="rounded bg-violet-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">
            {state === "loading" ? "Thinking…" : result ? "Make a new plan" : "Make this week's plan"}
          </button>
        )}
      </div>

      {!active && <p className="text-sm text-slate-600">The coach unlocks when your Premium subscription is active.</p>}
      {state === "locked" && <p className="text-sm text-amber-700">PayPal says this subscription is not active. Check the status above.</p>}
      {state === "error" && <p className="text-sm text-rose-700">The coach is unavailable right now. Try again in a minute.</p>}

      {active && result && (
        <div className="space-y-3">
          <p className="text-sm text-slate-700">{result.summary}</p>
          <ol className="space-y-2">
            {result.steps.map((s, i) => (
              <li key={i} className="rounded border border-slate-200 p-3 text-sm">
                <p className="font-medium">
                  {i + 1}. {s.action}
                </p>
                <p className="text-slate-600">{s.why}</p>
                {s.title && (
                  <p className="mt-1 text-xs text-slate-500">
                    {s.title} · Deadline: {formatDate(s.deadline)} ·{" "}
                    {s.sourceUrl && (
                      <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">
                        Official page
                      </a>
                    )}
                  </p>
                )}
              </li>
            ))}
          </ol>
          <p className="text-xs text-slate-500">Made {new Date(result.createdAt).toLocaleString("en-GB")}. Built only from checked data; always confirm on the official page.</p>
        </div>
      )}
    </section>
  );
}
