"use client";

import { useState } from "react";
import { EMPTY_LOG, EMPTY_PLAN, STORAGE, logEntry } from "@/lib/profile";
import { useStored } from "@/lib/storage";
import type { PlanRow } from "@/lib/types";

type Draft = { sponsorName: string; sponsorEmail: string; rowIds: string[]; message: string };

const PAID = new Set(["PAID", "MARKED_AS_PAID"]);

function toPlanStatus(paypalStatus: string): PlanRow["status"] {
  if (PAID.has(paypalStatus)) return "paid";
  return "invoiced";
}

export function SponsorPanel() {
  const [plan, setPlan] = useStored(STORAGE.plan, EMPTY_PLAN);
  const [, setLog] = useStored(STORAGE.log, EMPTY_LOG);
  const [command, setCommand] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<"draft" | "send" | "refresh" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unpaid = plan.filter((r) => r.status === "unpaid");
  const invoiceIds = [...new Set(plan.map((r) => r.invoiceId).filter((id): id is string => !!id))];

  async function makeDraft() {
    setBusy("draft");
    setError(null);
    try {
      const res = await fetch("/api/sponsor/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, rows: plan.map(({ id, item, amount, currency, status }) => ({ id, item, amount, currency, status })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not draft");
      setDraft({ sponsorName: data.sponsorName, sponsorEmail: data.sponsorEmail ?? "", rowIds: data.rowIds, message: data.message });
      setLog((l) => [logEntry("Drafted invoice", `For ${data.sponsorName}`), ...l]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not draft");
    } finally {
      setBusy(null);
    }
  }

  async function approve() {
    if (!draft) return;
    const rows = plan.filter((r) => draft.rowIds.includes(r.id));
    setBusy("send");
    setError(null);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved: true,
          sponsorName: draft.sponsorName,
          sponsorEmail: draft.sponsorEmail,
          note: draft.message,
          lines: rows.map((r) => ({ name: r.item, amount: r.amount, currency: r.currency })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "PayPal error");
      setPlan((all) => all.map((r) => (draft.rowIds.includes(r.id) ? { ...r, sponsor: draft.sponsorName, status: toPlanStatus(data.status), invoiceId: data.invoiceId } : r)));
      setLog((l) => [logEntry("Sent PayPal invoice", `${data.invoiceId} to ${draft.sponsorName} (${draft.sponsorEmail}), status ${data.status}`), ...l]);
      setDraft(null);
      setCommand("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "PayPal error");
    } finally {
      setBusy(null);
    }
  }

  async function refresh() {
    setBusy("refresh");
    setError(null);
    try {
      const res = await fetch("/api/invoices/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: invoiceIds }),
      });
      const data = (await res.json()) as { results: { id: string; status: string }[] };
      if (!res.ok) throw new Error();
      setPlan((all) =>
        all.map((r) => {
          const found = data.results.find((x) => x.id === r.invoiceId);
          return found && found.status !== "UNKNOWN" ? { ...r, status: toPlanStatus(found.status) } : r;
        }),
      );
      setLog((l) => [logEntry("Refreshed payments", data.results.map((x) => `${x.id}: ${x.status}`).join(", ")), ...l]);
    } catch {
      setError("Could not refresh from PayPal");
    } finally {
      setBusy(null);
    }
  }

  const selected = draft ? plan.filter((r) => draft.rowIds.includes(r.id)) : [];
  const currency = selected[0]?.currency ?? "EUR";
  const total = selected.reduce((s, r) => s + r.amount, 0);
  const validEmail = draft ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.sponsorEmail) : false;

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold">Family sponsorship with PayPal</h2>
      <p className="text-sm text-slate-600">
        Ask Hapi in your own words, e.g. &quot;Ask Uncle Arben (arben@example.com) to pay the visa fee&quot;. Hapi drafts a PayPal invoice. Nothing is sent before you press Approve.
      </p>
      <div className="flex flex-wrap gap-2">
        <input className="min-w-64 flex-1 rounded border border-slate-300 px-2 py-1 text-sm" value={command} onChange={(e) => setCommand(e.target.value)} placeholder="Who should sponsor which cost?" />
        <button onClick={makeDraft} disabled={!command.trim() || unpaid.length === 0 || busy !== null} className="rounded bg-teal-700 px-3 py-1.5 text-sm text-white disabled:opacity-50">
          {busy === "draft" ? "Drafting…" : "Draft invoice"}
        </button>
        <button onClick={refresh} disabled={invoiceIds.length === 0 || busy !== null} className="rounded border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50">
          {busy === "refresh" ? "Refreshing…" : "Refresh payments"}
        </button>
      </div>
      {unpaid.length === 0 && <p className="text-xs text-slate-500">Add an unpaid cost to the plan first.</p>}
      {error && <p className="text-sm text-rose-700">{error}</p>}

      {draft && (
        <div className="space-y-3 rounded-lg border-2 border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="font-semibold text-amber-900">Approve this invoice?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="font-medium">Sponsor</span>
              <input className="w-full rounded border border-slate-300 px-2 py-1" value={draft.sponsorName} onChange={(e) => setDraft({ ...draft, sponsorName: e.target.value })} />
            </label>
            <label className="space-y-1">
              <span className="font-medium">Sponsor email</span>
              <input className="w-full rounded border border-slate-300 px-2 py-1" value={draft.sponsorEmail} onChange={(e) => setDraft({ ...draft, sponsorEmail: e.target.value })} placeholder="needed to send the invoice" />
            </label>
          </div>
          <fieldset className="space-y-1">
            <legend className="font-medium">Costs on this invoice</legend>
            {unpaid.map((r) => (
              <label key={r.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.rowIds.includes(r.id)}
                  onChange={(e) => setDraft({ ...draft, rowIds: e.target.checked ? [...draft.rowIds, r.id] : draft.rowIds.filter((id) => id !== r.id) })}
                />
                {r.item}: {r.amount.toLocaleString("en-GB")} {r.currency}
              </label>
            ))}
          </fieldset>
          <label className="block space-y-1">
            <span className="font-medium">Message preview</span>
            <textarea className="w-full rounded border border-slate-300 px-2 py-1" rows={3} value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} />
          </label>
          <p className="font-medium">Total: {total.toLocaleString("en-GB")} {currency} · PayPal sandbox, no real money</p>
          <div className="flex gap-2">
            <button onClick={approve} disabled={busy !== null || selected.length === 0 || !validEmail || new Set(selected.map((r) => r.currency)).size > 1} className="rounded bg-emerald-700 px-3 py-1.5 text-white disabled:opacity-50">
              {busy === "send" ? "Sending…" : "Approve and send"}
            </button>
            <button onClick={() => { setDraft(null); setLog((l) => [logEntry("Cancelled draft", draft.sponsorName), ...l]); }} className="rounded border border-slate-300 px-3 py-1.5">
              Cancel
            </button>
          </div>
          {!validEmail && <p className="text-xs text-rose-700">Add the sponsor&apos;s email to send the invoice.</p>}
        </div>
      )}
    </section>
  );
}
