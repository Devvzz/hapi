import { formatPrice, priceFor, type Price } from "./price";
import { LEVELS } from "./profile";
import type { Profile, Program } from "./types";

export type Eligibility = {
  status: "ok" | "warn" | "no";
  reasons: string[];
  tuitionPerYear: { min: number | null; max: number | null } | null;
  price: Price;
};

const LANGS = ["English", "German", "Italian", "French", "Spanish", "Czech", "Hungarian", "Dutch", "Portuguese", "Lithuanian", "Korean", "Japanese", "Greek", "Polish", "Finnish", "Croatian", "Estonian", "Latvian"];
// Typical level when a page does not state one: German-taught degrees usually ask for C1 (e.g. DSH-2), others B2.
const DEFAULT_LEVEL: Record<string, string> = { German: "C1" };

function rank(level: string): number {
  return LEVELS.indexOf(level as (typeof LEVELS)[number]);
}

function requiredLanguages(text: string): { anyOf: boolean; needs: { language: string; level: string }[] } {
  const found = LANGS.filter((l) => text.toLowerCase().includes(l.toLowerCase()));
  const explicit = text.match(/\b([ABC][12])\b/);
  const needs = found.map((language) => ({ language, level: found.length === 1 && explicit ? explicit[1] : DEFAULT_LEVEL[language] ?? "B2" }));
  return { anyOf: /\/|\bor\b/i.test(text), needs };
}

export function checkProgram(p: Program, profile: Profile): Eligibility {
  const reasons: string[] = [];
  let status: Eligibility["status"] = "ok";
  const worsen = (to: "warn" | "no") => {
    if (to === "no" || status === "ok") status = to;
  };

  // Language
  if (p.language) {
    const { anyOf, needs } = requiredLanguages(p.language);
    const meets = needs.map((n) => {
      const mine = profile.languages.find((l) => l.language.toLowerCase() === n.language.toLowerCase());
      return { ...n, mine: mine?.level ?? null, ok: mine ? rank(mine.level) >= rank(n.level) : false };
    });
    const passed = anyOf ? meets.some((m) => m.ok) : meets.every((m) => m.ok);
    if (needs.length === 0) {
      worsen("warn");
      reasons.push(`Teaching language: ${p.language} (check the level needed)`);
    } else if (passed) {
      reasons.push(`Language OK: taught in ${p.language}`);
    } else {
      const missing = meets.filter((m) => !m.ok).map((m) => `${m.language} ${m.level}${m.mine ? ` (you have ${m.mine})` : ""}`);
      const close = meets.some((m) => m.mine && rank(m.mine) === rank(m.level) - 1);
      worsen(close ? "warn" : "no");
      reasons.push(`Needs ${missing.join(anyOf ? " or " : " and ")}`);
    }
  }

  // Tuition against budget, using the fee this student would pay (living costs come on top)
  const price = priceFor(p, profile);
  const label = formatPrice(price);
  if (price.min !== null) {
    if (profile.budgetPerYear !== null && price.min > profile.budgetPerYear) {
      worsen("no");
      reasons.push(`Your fee (${price.basis}) ${label}/year is above your budget`);
    } else if (profile.budgetPerYear !== null && (price.max ?? price.min) > profile.budgetPerYear) {
      worsen("warn");
      reasons.push(`Your fee (${price.basis}) ${label}/year may be above your budget`);
    } else {
      reasons.push(`Your fee (${price.basis}): about ${label}/year, living costs not included`);
    }
  } else {
    worsen("warn");
    reasons.push("Tuition: check yourself");
  }

  const confidence = p.tuitionNonEuPerYear?.confidence;
  if (confidence === "estimate" || confidence === "needs-check") {
    worsen("warn");
    reasons.push("Fee is not confirmed by the university");
  }
  if (p.deadlineCycle) {
    worsen("warn");
    reasons.push("Deadline is from the previous cycle");
  }
  return { status, reasons, tuitionPerYear: price.min === null ? null : { min: price.min, max: price.max }, price };
}
