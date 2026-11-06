import { daysUntil, parseDeadline } from "./dates";
import { INTERESTS } from "./profile";
import type { Opportunity, Profile } from "./types";

export type Match = {
  score: number;
  verdict: "fits" | "check" | "not-eligible";
  reasons: string[];
  closed: boolean;
  daysLeft: number | null;
};

const OPEN_TO_ALL = /\b(all|anyone|worldwide)\b/i;
const WESTERN_BALKANS = ["albania", "bosnia", "kosovo", "montenegro", "north macedonia", "serbia"];

function countryCheck(o: Opportunity, nationality: string): { ok: boolean | null; reason: string | null } {
  const list = o.eligibility.countries;
  if (!list || list.length === 0) return { ok: null, reason: null };
  const text = list.join("; ").toLowerCase();
  const nat = nationality.trim().toLowerCase();
  if (nat && text.includes(nat)) return { ok: true, reason: `Open to ${nationality}` };
  if (nat && text.includes("western balkans") && WESTERN_BALKANS.some((c) => nat.includes(c)))
    return { ok: true, reason: "Open to the Western Balkans" };
  if (text.includes("excluded")) return { ok: null, reason: "Some countries are excluded, check the rules" };
  if (OPEN_TO_ALL.test(text)) return { ok: true, reason: "Open worldwide" };
  return { ok: null, reason: `Limited to: ${list.join("; ")}` };
}

export function matchOpportunity(o: Opportunity, p: Profile, now = new Date()): Match {
  const reasons: string[] = [];
  let blocked = false;
  let unsure = false;

  const deadline = parseDeadline(o.deadline);
  const daysLeft = deadline ? daysUntil(deadline, now) : null;
  const closed = daysLeft !== null && daysLeft < 0;

  const { minAge, maxAge, students } = o.eligibility;
  if (p.age !== null) {
    if (minAge !== null && p.age < minAge) { blocked = true; reasons.push(`Minimum age is ${minAge}`); }
    if (maxAge !== null && p.age > maxAge) { blocked = true; reasons.push(`Maximum age is ${maxAge}`); }
  }
  if (students && !p.student) { blocked = true; reasons.push("Only for students"); }

  const country = countryCheck(o, p.nationality);
  if (country.reason) reasons.push(country.reason);
  if (country.ok === null && country.reason) unsure = true;

  let score = 40;
  const hits = INTERESTS.filter(
    (i) => p.interests.includes(i.label) && (i.tags.some((t) => o.tags.includes(t)) || i.types?.includes(o.type) ||
      (i.label === "Free travel" && (o.travelPaid === "full" || o.travelPaid === "partial"))),
  );
  score += Math.min(hits.length * 15, 45);
  if (hits.length) reasons.unshift(`Matches your interest in ${hits.map((h) => h.label).join(", ")}`);
  if (o.costType === "free") score += 5;
  if (o.travelPaid === "full") score += 10;
  if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 30) { score += 10; reasons.push(`Deadline in ${daysLeft} days`); }
  if (closed) { score -= 30; reasons.push("This round is closed"); }
  if (blocked) score -= 50;

  return {
    score: Math.max(0, Math.min(100, score)),
    verdict: blocked ? "not-eligible" : unsure || closed ? "check" : "fits",
    reasons,
    closed,
    daysLeft,
  };
}
