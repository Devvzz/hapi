import { opportunities, programs } from "./data";
import { parseDeadline } from "./dates";
import type { UniMark } from "./profile";
import type { PlanRow } from "./types";

export type EventKind = "opens" | "deadline" | "event" | "results" | "apply-by" | "payment" | "custom";
export type CalEvent = { id: string; date: string; title: string; kind: EventKind; link?: string | null; note?: string; source: "opportunity" | "university" | "plan" | "custom"; refId?: string };
export type CustomEvent = { id: string; date: string; title: string; note: string };
export type Undated = { id: string; title: string; why: string; link?: string | null };

export const KIND_LABEL: Record<EventKind, string> = {
  opens: "Applications open",
  deadline: "Deadline",
  event: "Event",
  results: "Results",
  "apply-by": "Apply by",
  payment: "Payment due",
  custom: "My event",
};
export const KIND_STYLE: Record<EventKind, string> = {
  opens: "bg-sky-100 text-sky-900",
  deadline: "bg-rose-100 text-rose-900",
  event: "bg-violet-100 text-violet-900",
  results: "bg-emerald-100 text-emerald-900",
  "apply-by": "bg-amber-100 text-amber-900",
  payment: "bg-slate-200 text-slate-900",
  custom: "bg-teal-100 text-teal-900",
};

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

export function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// A date field as a calendar day; month-only values ("2027-03") have no day, so they are not placed.
function day(value: string | null | undefined): string | null {
  if (!value || /^\d{4}-\d{2}$/.test(value)) return null;
  const d = parseDeadline(value);
  return d ? isoDay(d) : null;
}

// First day of a free-text event period such as "2027-06-14 to 2027-06-18" or "14–18 Jun 2027".
function firstDay(text: string | null): string | null {
  if (!text) return null;
  const iso = text.match(/\d{4}-\d{2}-\d{2}/);
  if (iso) return iso[0];
  const m = text.match(/(\d{1,2})\s*(?:[–-]\s*\d{1,2}\s*)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(20\d\d)/i);
  if (!m) return null;
  return `${m[3]}-${String(MONTHS[m[2].toLowerCase()]).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

export function buildEvents(saved: string[], marks: Record<string, UniMark>, plan: PlanRow[], custom: CustomEvent[]): { events: CalEvent[]; undated: Undated[] } {
  const events: CalEvent[] = [];
  const undated: Undated[] = [];

  for (const id of saved) {
    const o = opportunities.find((x) => x.id === id);
    if (!o) continue;
    const add = (kind: EventKind, date: string | null) => date && events.push({ id: `${o.id}-${kind}`, date, title: o.title, kind, link: o.sourceUrl, source: "opportunity", refId: o.id });
    add("opens", day(o.applyOpens));
    add("deadline", day(o.deadline));
    add("event", firstDay(o.eventDates));
    add("results", day(o.resultsDate));
    if (!day(o.deadline)) undated.push({ id: o.id, title: o.title, why: o.deadline ? `Deadline: ${o.deadline}` : "Deadline not published yet", link: o.sourceUrl });
  }

  for (const [id, mark] of Object.entries(marks)) {
    if (mark !== "apply") continue;
    const p = programs.find((x) => x.id === id);
    if (!p) continue;
    const title = `${p.university}${p.program ? `: ${p.program}` : ""}`;
    if (p.applyBy) events.push({ id: `${p.id}-apply`, date: p.applyBy, title, kind: "apply-by", link: p.sources[0] ?? null, source: "university", refId: p.id });
    else undated.push({ id: p.id, title, why: "Application date not published yet", link: p.sources[0] ?? null });
  }

  for (const r of plan) {
    const d = day(r.dueDate);
    if (d && r.status !== "paid") events.push({ id: `plan-${r.id}`, date: d, title: `${r.item} (${r.amount.toLocaleString("en-GB")} ${r.currency})`, kind: "payment", link: r.sourceUrl ?? null, source: "plan" });
  }

  for (const c of custom) events.push({ id: c.id, date: c.date, title: c.title, kind: "custom", note: c.note, source: "custom" });

  events.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  return { events, undated };
}

function icsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// An .ics file that Google Calendar, Apple Calendar and Outlook can import. Deadlines get a reminder a week before.
export function toIcs(events: CalEvent[], now: Date): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hapi//Student calendar//EN", "CALSCALE:GREGORIAN"];
  for (const e of events) {
    const start = e.date.replace(/-/g, "");
    const next = new Date(`${e.date}T12:00:00`);
    next.setDate(next.getDate() + 1);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@hapi-abroad`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${isoDay(next).replace(/-/g, "")}`,
      `SUMMARY:${icsText(`${KIND_LABEL[e.kind]}: ${e.title}`)}`,
    );
    const desc = [e.note, e.link].filter(Boolean).join("\n");
    if (desc) lines.push(`DESCRIPTION:${icsText(desc)}`);
    if (e.link) lines.push(`URL:${e.link}`);
    if (e.kind === "deadline" || e.kind === "apply-by" || e.kind === "payment") {
      lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsText(`In one week: ${e.title}`)}`, "TRIGGER:-P7D", "END:VALARM");
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
