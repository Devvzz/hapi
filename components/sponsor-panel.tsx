"use client";

import { useState } from "react";
import { EMPTY_LOG, EMPTY_PLAN, STORAGE, logEntry } from "@/lib/profile";
import { useStored } from "@/lib/storage";
import type { PlanRow } from "@/lib/types";

type Draft = { sponsorName: string; sponsorEmail: string; rowIds: string[]; message: string };
type Sent = { sponsorName: string; items: string; total: string; url: string };

// A WhatsApp link with a ready message; the student chooses who to send it to.
function whatsappLink(s: Sent): string {
  const text = `Hi ${s.sponsorName}! Could you help me pay for ${s.items} (${s.total}) for my studies abroad? You can pay safely with PayPal here: ${s.url}
Thank you so much! (sent with Hapi)`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function WhatsAppButton({ sent }: { sent: Sent }) {
  return (
    <a href={whatsappLink(sent)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-[#06281a] transition hover:brightness-110">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3z" />
      </svg>
      Share on WhatsApp
    </a>
  );
}

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
  const [sent, setSent] = useState<Sent | null>(null);

  const unpaid = plan.filter((r) => r.status === "unpaid");
  // Invoices sent but not paid yet, so the student can remind the sponsor on WhatsApp.
  const waiting: Sent[] = [...new Set(plan.filter((r) => r.status === "invoiced" && r.invoiceId).map((r) => r.invoiceId!))].map((id) => {
    const rows = plan.filter((r) => r.invoiceId === id);
    const sum = rows.reduce((t, r) => t + r.amount, 0);
    return { sponsorName: rows[0].sponsor ?? "there", items: rows.map((r) => r.item).join(", "), total: `${sum.toLocaleString("en-GB")} ${rows[0].currency}`, url: `https://www.sandbox.paypal.com/invoice/p/#${id}` };
  });
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
      const sum = rows.reduce((s, r) => s + r.amount, 0);
      setSent({ sponsorName: draft.sponsorName, items: rows.map((r) => r.item).join(", "), total: `${sum.toLocaleString("en-GB")} ${rows[0]?.currency ?? "EUR"}`, url: data.payerUrl });
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
    <section className="space-y-3 rounded-xl border border-slate-200 bg-panel p-4">
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
      {waiting.length > 0 && !sent && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Waiting for payment</p>
          {waiting.map((w) => (
            <div key={w.url} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm">
              <span>
                {w.sponsorName}: {w.items} · {w.total}
              </span>
              <WhatsAppButton sent={w} />
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-sm text-rose-700">{error}</p>}

      {sent && (
        <div className="space-y-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm">
          <p className="font-medium text-white">Invoice sent to {sent.sponsorName}&apos;s email.</p>
          <p className="text-slate-600">Want to make sure they see it? Send them the payment link on WhatsApp too.</p>
          <div className="flex flex-wrap items-center gap-3">
            <WhatsAppButton sent={sent} />
            <button onClick={() => navigator.clipboard?.writeText(sent.url)} className="rounded-full border border-white/15 px-3 py-2 text-xs text-slate-600 hover:text-white">
              Copy payment link
            </button>
            <button onClick={() => setSent(null)} className="text-xs text-slate-500 hover:text-white">
              Done
            </button>
          </div>
        </div>
      )}

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
