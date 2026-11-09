// Deadlines in the data are ISO dates, ISO date-times or "YYYY-MM"; anything else is shown as text.
export function parseDeadline(value: string | null): Date | null {
  if (!value) return null;
  const match = value.match(/^\d{4}-\d{2}(-\d{2})?(T[\d:]+([+-]\d{2}:\d{2}|Z)?)?$/);
  if (!match) return null;
  const date = new Date(match[1] ? value : `${value}-28`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function daysUntil(date: Date, now = new Date()): number {
  return Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
}

export function formatDate(value: string | null): string {
  if (!value) return "TBA";
  const date = parseDeadline(value);
  if (!date) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).replace("Sept", "Sep");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (iso: string) => ({ y: iso.slice(0, 4), m: MONTHS[Number(iso.slice(5, 7)) - 1], d: iso.length > 7 ? String(Number(iso.slice(8, 10))) : "" });
const one = (iso: string) => {
  const x = day(iso);
  return [x.d, x.m, x.y].filter(Boolean).join(" ");
};

// Event dates are free text with ISO dates inside ("2027-09-12/2027-09-19", "RIPE 94: 2027-05-24/2027-05-28").
// This turns every date and range in it into "12–19 Sep 2027" style and leaves the words around them alone.
export function formatEventDates(value: string | null): string {
  if (!value) return "TBA";
  const ISO = String.raw`\d{4}-\d{2}(?:-\d{2})?`;
  return value
    .replace(new RegExp(String.raw`(${ISO})\s*(?:/|to)\s*(${ISO})`, "g"), (_, a: string, b: string) => {
      const x = day(a);
      const y = day(b);
      if (x.y !== y.y || !x.d || !y.d) return `${one(a)} – ${one(b)}`;
      if (x.m === y.m) return `${x.d}–${y.d} ${y.m} ${y.y}`;
      return `${x.d} ${x.m} – ${y.d} ${y.m} ${y.y}`;
    })
    .replace(new RegExp(String.raw`(?<![\d–])(${ISO})(?!\d)`, "g"), (iso: string) => one(iso))
    .replace(/\b(\d{4})\/(\d{4})\b/g, "$1–$2");
}
