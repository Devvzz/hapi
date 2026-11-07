"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EMPTY_LOG, EMPTY_PREMIUM, STORAGE, logEntry } from "@/lib/profile";
import { useStored } from "@/lib/storage";

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
      <section className="space-y-3 rounded-xl border border-teal-200 bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Hapi Premium</h2>
          <p className="text-sm text-slate-600">€2.99 per month · PayPal sandbox, no real money</p>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>A weekly AI coach: your next steps, built only from the checked opportunities, your profile and your cost plan.</li>
          <li>Every step links to its official source and deadline.</li>
          <li>The free parts of Hapi stay free.</li>
        </ul>

        {cancelled && !active && <p className="text-sm text-amber-700">You cancelled on PayPal. Nothing was charged.</p>}

        {premium.subscriptionId ? (
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
          <button onClick={subscribe} disabled={state === "loading"} className="rounded bg-teal-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {state === "loading" ? "Opening PayPal…" : "Subscribe with PayPal"}
          </button>
        )}
        {state === "error" && <p className="text-sm text-rose-700">PayPal is unavailable right now. Try again in a minute.</p>}
      </section>

      {children}
    </div>
  );
}
