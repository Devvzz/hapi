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
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
