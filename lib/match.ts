import { EU, EU_CANDIDATES, EU_FEE_COUNTRIES, EUROPE, SOUTHEAST_EUROPE, WESTERN_BALKANS } from "./countries";
import { daysUntil, parseDeadline } from "./dates";
import { GROUP_LABEL, groupOf } from "./education";
import { INTERESTS } from "./profile";
import type { NationalityRule, Opportunity, Profile } from "./types";

export type Match = {
  score: number;
  verdict: "fits" | "check" | "not-eligible";
  reasons: string[];
  closed: boolean;
  daysLeft: number | null;
  overBudget: boolean;
};

type Check = { ok: boolean | null; reason: string | null };

// High-income countries that are not on the OECD DAC aid list.
const NOT_DAC = [...EU_FEE_COUNTRIES, "United Kingdom", "United States", "Canada", "Australia", "New Zealand", "Japan", "South Korea", "Israel", "Singapore", "Taiwan", "Andorra", "Monaco", "San Marino", "Qatar", "United Arab Emirates", "Saudi Arabia", "Kuwait", "Bahrain", "Russia"];

// One rule per way the data describes who may apply, matched on the stored text.
function countryRule(text: string, nat: string, austrianSchool: boolean): Check {
  const t = text.toLowerCase();
  const n = nat.toLowerCase();
  const inList = (list: string[], label: string): Check =>
    list.includes(nat) ? { ok: true, reason: `Open to ${label}` } : { ok: false, reason: `Only for ${label}` };

  if (/^(all|all nationalities|anyone, anywhere|all except standard exceptions)$/.test(t)) return { ok: true, reason: "Open worldwide" };
  if (t.startsWith("all except")) return t.includes(n) ? { ok: false, reason: `${nat} is excluded` } : { ok: true, reason: "Open worldwide, with a few exceptions" };
  if (t === "some countries excluded") return { ok: null, reason: "Some countries are excluded: check the rules" };
  if (t.includes("austrian schools")) return austrianSchool ? { ok: true, reason: "Open to Austrian schools abroad" } : { ok: false, reason: "Only for pupils at Austrian schools (in Austria or abroad)" };
  if (t.startsWith("non-eu")) return EU.includes(nat) ? { ok: false, reason: "Only for non-EU citizens" } : { ok: true, reason: "Open to non-EU citizens" };
  if (t.startsWith("non-eea")) return EU_FEE_COUNTRIES.includes(nat) ? { ok: false, reason: "Only for non-EEA citizens" } : { ok: true, reason: "Open to non-EEA citizens" };
  if (t.includes("oecd dac")) return NOT_DAC.includes(nat) ? { ok: false, reason: "Only for countries on the OECD DAC list" } : { ok: null, reason: "Check that your country is on the OECD DAC list" };
  if (t.includes("western balkans")) return inList(WESTERN_BALKANS, "the Western Balkans");
  if (t.includes("southeastern europe")) return inList(SOUTHEAST_EUROPE, "Southeastern Europe");
  if (t.includes("candidate countries")) return inList([...EU, ...EU_CANDIDATES, "United Kingdom"], "the EU, candidate countries and the UK");
  if (t.startsWith("eu, norway, iceland")) return inList([...EU, "Norway", "Iceland"], "the EU, Norway and Iceland");
  if (t.includes("ripe ncc")) return EUROPE.includes(nat) ? { ok: true, reason: "Open to the RIPE NCC region" } : { ok: null, reason: "Check that you live in the RIPE NCC region" };
  if (t.includes("europe")) return EUROPE.includes(nat) ? { ok: true, reason: "Open to Europe (check if it means where you live)" } : { ok: false, reason: "Only for Europe" };
  if (t.includes("eligible to work")) return { ok: true, reason: "You must be allowed to work where you live" };
  if (t.includes("albania")) {
    if (nat !== "Albania") return { ok: t.includes("among eligible") ? null : false, reason: t.includes("among eligible") ? "Albania is listed; check if your country is too" : "Only for Albania" };
    return { ok: true, reason: t.includes("resident") ? "Open to Albanians living in Albania" : "Open to Albania" };
  }
  if (n && t.includes(n)) return { ok: true, reason: `Open to ${nat}` };
  return { ok: null, reason: `Limited to: ${text}` };
}

const COUNCIL_OF_EUROPE = EUROPE.filter((c) => !["Belarus", "Russia", "Vatican City", "Kosovo"].includes(c));

// Regions a page may name instead of single countries. null means the region cannot be decided from nationality alone.
function inRegion(region: string, nat: string): boolean | null {
  switch (region) {
    case "worldwide": return true;
    case "EU": return EU.includes(nat);
    case "EEA": return EU_FEE_COUNTRIES.filter((c) => c !== "Switzerland").includes(nat);
    case "Europe": return EUROPE.includes(nat);
    case "Western Balkans": return WESTERN_BALKANS.includes(nat);
    case "Southeast Europe": return SOUTHEAST_EUROPE.includes(nat);
    case "Council of Europe members": return COUNCIL_OF_EUROPE.includes(nat);
    case "OECD DAC list": return NOT_DAC.includes(nat) ? false : null;
    default: return null;
  }
}

function where(r: NationalityRule): string {
  return [...r.regions, ...r.countries].join(", ");
}

// The rule read from the official page.
function pageRule(r: NationalityRule, nat: string): Check {
  const by = r.basis === "residence" ? "Check: this is about where you live" : null;
  if (r.rule === "all") return { ok: true, reason: "Open to all nationalities" };
  if (r.rule === "except") {
    if (r.countries.includes(nat) || r.regions.some((g) => inRegion(g, nat) === true)) return { ok: false, reason: `${nat} is excluded` };
    return { ok: true, reason: "Open to all nationalities, with a few legal exceptions" };
  }
  if (r.countries.includes(nat)) return { ok: by ? null : true, reason: by ?? `Open to ${nat}` };
  const regionHits = r.regions.map((g) => inRegion(g, nat));
  if (regionHits.includes(true)) return { ok: by ? null : true, reason: by ?? `Open to ${where(r)}` };
  if (regionHits.includes(null)) return { ok: null, reason: `Check that ${nat} is in: ${where(r)}` };
  return { ok: false, reason: `Only for ${where(r)}` };
}

// Offers that anyone can buy or take online; their pages rarely mention nationality at all.
const OPEN_BY_NATURE: Opportunity["type"][] = ["course", "certificate"];

function countryCheck(o: Opportunity, p: Profile): Check {
  const rule = o.eligibility.nationality;
  if (rule && p.nationality) return pageRule(rule, p.nationality);
  const list = o.eligibility.countries;
  if (!list || list.length === 0) {
    if (OPEN_BY_NATURE.includes(o.type)) return { ok: true, reason: null };
    return { ok: null, reason: "Nationality rules not confirmed: check the official page" };
  }
  if (!p.nationality) return { ok: null, reason: `Limited to: ${list.join("; ")}` };
  const results = list.map((text) => countryRule(text, p.nationality, p.austrianSchool ?? false));
  return results.find((r) => r.ok === true) ?? results.find((r) => r.ok === null) ?? results[0];
}

function levelCheck(o: Opportunity, p: Profile): Check {
  const levels = o.eligibility.levels;
  if (!levels) return { ok: null, reason: null };
  const group = groupOf(p.schoolType);
  const who = levels.map((l) => GROUP_LABEL[l]).join(", ");
  if (!group) return { ok: null, reason: `For ${who}` };
  if (!levels.includes(group)) return { ok: false, reason: `Only for ${who}` };
  if (p.schoolType === "school-leaver" && o.type !== "scholarship") return { ok: null, reason: "For school pupils: check that you can still apply after finishing school" };
  return { ok: true, reason: `Open to ${GROUP_LABEL[group]}` };
}

// Types where the student is paid or funded, so an unknown fee is not a worry.
const PAYS_YOU: Opportunity["type"][] = ["scholarship", "internship", "job", "grant", "exchange"];

// Rough cost of joining: the fee, or nothing when it is free.
export function costOf(o: Opportunity): number | null {
  if (o.costType === "free") return 0;
  return o.price?.amount ?? null;
}

export function matchOpportunity(o: Opportunity, p: Profile, now: Date): Match {
  const reasons: string[] = [];
  let blocked = false;
  let unsure = false;
  const apply = (c: Check) => {
    if (c.reason) reasons.push(c.reason);
    if (c.ok === false) blocked = true;
    if (c.ok === null && c.reason) unsure = true;
  };

  const deadline = parseDeadline(o.deadline);
  const daysLeft = deadline ? daysUntil(deadline, now) : null;
  const closed = daysLeft !== null && daysLeft < 0;

  // Hard rules first: age, nationality, education level, student status.
  const { minAge, maxAge, students } = o.eligibility;
  if (p.age !== null) {
    if (minAge !== null && p.age < minAge) apply({ ok: false, reason: `Minimum age is ${minAge}` });
    if (maxAge !== null && p.age > maxAge) apply({ ok: false, reason: `Maximum age is ${maxAge}` });
  }
  apply(countryCheck(o, p));
  apply(levelCheck(o, p));
  if (students && !p.student && !o.eligibility.levels) apply({ ok: false, reason: "Only for current students" });

  // Budget: a paid item above the student's limit is not hidden, but flagged and ranked lower.
  const cost = costOf(o);
  const limit = p.opportunityBudget ?? null;
  const overBudget = limit !== null && cost !== null && cost > limit;
  if (overBudget) reasons.push(limit === 0 ? "Not free" : `Costs about ${cost} ${o.price?.currency ?? ""}, above your limit of €${limit}`.trim());
  else if (limit !== null && cost === null && o.costType !== "free" && !PAYS_YOU.includes(o.type)) reasons.push("Cost unknown: check it fits your budget");

  // Then how good a fit it is.
  let score = 40;
  const hits = INTERESTS.filter(
    (i) =>
      p.interests.includes(i.label) &&
      (i.tags.some((t) => o.tags.includes(t)) || i.types?.includes(o.type) || (i.label === "Free travel" && (o.travelPaid === "full" || o.travelPaid === "partial"))),
  );
  score += Math.min(hits.length * 15, 45);
  if (hits.length) reasons.unshift(`Matches your interest in ${hits.map((h) => h.label).join(", ")}`);
  if (o.costType === "free") score += 5;
  if (o.travelPaid === "full") score += 10;
  if (o.eligibility.levels && !blocked) score += 5; // made for someone at the student's stage
  if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 30) {
    score += 10;
    reasons.push(`Deadline in ${daysLeft} days`);
  }
  if (overBudget) score -= 25;
  if (unsure) score -= 10;
  if (closed) {
    score -= 30;
    reasons.push("This round is closed");
  }
  if (blocked) score -= 60;

  return {
    score: Math.max(0, Math.min(100, score)),
    verdict: blocked ? "not-eligible" : unsure || closed || overBudget ? "check" : "fits",
    reasons,
    closed,
    daysLeft,
    overBudget,
  };
}

const VERDICT_ORDER = { fits: 0, check: 1, "not-eligible": 2 } as const;
export type SortKey = "match" | "deadline" | "cost";

// Eligible first, always; then by the chosen key.
export function compareMatches(a: { o: Opportunity; m: Match }, b: { o: Opportunity; m: Match }, key: SortKey): number {
  const v = VERDICT_ORDER[a.m.verdict] - VERDICT_ORDER[b.m.verdict];
  if (v !== 0) return v;
  const openA = a.m.closed ? 1 : 0;
  const openB = b.m.closed ? 1 : 0;
  if (openA !== openB) return openA - openB;
  const byDeadline = (a.m.daysLeft ?? 99_999) - (b.m.daysLeft ?? 99_999);
  const byCost = (costOf(a.o) ?? 99_999) - (costOf(b.o) ?? 99_999);
  if (key === "deadline") return byDeadline || b.m.score - a.m.score;
  if (key === "cost") return byCost || b.m.score - a.m.score;
  return b.m.score - a.m.score || byDeadline;
}
