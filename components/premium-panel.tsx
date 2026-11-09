"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DEMO_SUBSCRIPTION } from "@/lib/demo";
import { EMPTY_LOG, EMPTY_PREMIUM, STORAGE, logEntry } from "@/lib/profile";
import { useStored } from "@/lib/storage";

const FEATURES: { title: string; text: string; icon: string; href?: string }[] = [
  { title: "Ask Hapi", text: "A chat assistant that knows your profile and answers from checked data only.", icon: "M4 5h16v11H9l-5 4z M8 10h8 M8 13h5" },
  { title: "Weekly AI coach", text: "Your next steps each week, built from your profile, your saved opportunities and your cost plan.", icon: "M12 3v3 M12 18v3 M3 12h3 M18 12h3 M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z" },
  { title: "CV builder", text: "The Europass structure, with AI that polishes your own words. Download it as a PDF.", icon: "M7 3h7l5 5v13H7z M14 3v5h5 M10 13h6 M10 17h6", href: "/cv" },
  { title: "Deadline calendar", text: "Every deadline, programme and payment, sent to your phone with reminders.", icon: "M4 6h16v14H4z M8 3v5 M16 3v5 M4 11h16", href: "/calendar" },
];

const STATUS_TEXT: Record<string, string> = {
  ACTIVE: "Premium is active",
  APPROVAL_PENDING: "Waiting for your approval on PayPal",
  APPROVED: "Approved, PayPal is activating it",
  SUSPENDED: "Paused on PayPal",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

async function fetchStatus(id: string): Promise<string> {
  const res = await fetch("/api/premium/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("status failed");
  return ((await res.json()) as { status: string }).status;
}

export function PremiumPanel({ children }: { children?: React.ReactNode }) {
  const [premium, setPremium] = useStored(STORAGE.premium, EMPTY_PREMIUM);
  const [, setLog] = useStored(STORAGE.log, EMPTY_LOG);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const params = useSearchParams();
  const router = useRouter();

  const saveStatus = useCallback(
    async (id: string) => {
      const status = await fetchStatus(id);
      setPremium({ subscriptionId: id, status });
    },
    [setPremium],
  );

  async function refresh(id: string) {
    setState("loading");
    try {
      await saveStatus(id);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  // PayPal sends the student back with ?subscription_id=I-...; save it and check the status once.
  const returnedId = params.get("subscription_id");
  useEffect(() => {
    if (!returnedId) return;
    setLog((log) => [logEntry("Premium approved on PayPal", returnedId), ...log].slice(0, 200));
    router.replace("/premium");
    saveStatus(returnedId).catch(() => setState("error"));
  }, [returnedId, saveStatus, router, setLog]);

  async function subscribe() {
    setState("loading");
    try {
      const res = await fetch("/api/premium/subscribe", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { subscriptionId: string; approveUrl: string };
      setPremium({ subscriptionId: data.subscriptionId, status: "APPROVAL_PENDING" });
      setLog((log) => [logEntry("Premium subscription started", data.subscriptionId), ...log].slice(0, 200));
      window.location.assign(data.approveUrl);
    } catch {
      setState("error");
    }
  }

  const active = premium.status === "ACTIVE";
  const cancelled = params.get("cancelled") === "1";

  return (
    <div className="space-y-6">
      <section className="grid gap-5 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[#e4e0d7] bg-white shadow-[0_18px_40px_-20px_rgba(14,27,46,0.35)]">
          <div className="flex items-center justify-between bg-[#0e1b2e] px-5 py-3 text-white">
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Hapi Premium</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffd56b" aria-hidden="true">
              <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" />
            </svg>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-5">
            <p>
              <span className="font-display text-5xl font-extrabold text-[#0e1b2e]">€2.99</span>
              <span className="ml-1 text-sm text-slate-600">a month</span>
            </p>
            <p className="text-sm text-slate-600">Paid with PayPal. Cancel any time. This is the PayPal sandbox, so no real money moves.</p>
            <div className="mt-auto space-y-3">
        {cancelled && !active && <p className="text-sm text-amber-700">You cancelled on PayPal. Nothing was charged.</p>}

              {premium.subscriptionId === DEMO_SUBSCRIPTION ? (
                <p className="text-sm text-amber-700">Demo mode: Premium is unlocked without a PayPal subscription.</p>
              ) : premium.subscriptionId ? (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className={`rounded px-2 py-0.5 ${active ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {STATUS_TEXT[premium.status ?? ""] ?? premium.status ?? "Status unknown"}
                  </span>
                  <span className="font-mono text-xs text-slate-500">{premium.subscriptionId}</span>
                  <button onClick={() => refresh(premium.subscriptionId!)} disabled={state === "loading"} className="text-teal-700 underline disabled:opacity-50">
                    Check status
                  </button>
                  {!active && (
                    <button onClick={subscribe} disabled={state === "loading"} className="text-teal-700 underline disabled:opacity-50">
                      Start again
                    </button>
                  )}
                </div>
              ) : (
                <button onClick={subscribe} disabled={state === "loading"} className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
                  {state === "loading" ? "Opening PayPal…" : "Subscribe with PayPal"}
                </button>
              )}
              {state === "error" && <p className="text-sm text-rose-700">PayPal is unavailable right now. Try again in a minute.</p>}
            </div>
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex gap-3 rounded-2xl border border-[#e4e0d7] bg-white p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[#1f5eff]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={f.icon} />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{f.title}</p>
                <p className="text-sm text-slate-600">{f.text}</p>
                {f.href && (
                  <Link href={f.href} className="mt-1 inline-block text-sm font-medium text-teal-700 underline">
                    Open it
                  </Link>
                )}
              </div>
            </li>
          ))}
          <li className="rounded-2xl border border-dashed border-[#cfcac0] p-4 text-sm text-slate-600 sm:col-span-2">
            Every answer and step links to its official source and deadline. Everything that is free in Hapi today stays free.
          </li>
        </ul>
      </section>

      {children}
    </div>
  );
}
