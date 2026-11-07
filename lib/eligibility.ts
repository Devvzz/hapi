import { LEVELS } from "./profile";
import type { Profile, Program } from "./types";

export type Eligibility = {
  status: "ok" | "warn" | "no";
  reasons: string[];
  tuitionPerYear: { min: number | null; max: number | null } | null;
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

export function nonEuTuition(p: Program): { min: number | null; max: number | null } | null {
  if (p.tuitionNonEuPerYear) return { min: p.tuitionNonEuPerYear.min, max: p.tuitionNonEuPerYear.max };
  if (p.tuitionPerYear?.amount != null) return { min: p.tuitionPerYear.amount, max: p.tuitionPerYear.amount };
  if (p.tuitionPerSemester?.amount != null) return { min: p.tuitionPerSemester.amount * 2, max: p.tuitionPerSemester.amount * 2 };
  return null;
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

  // Tuition against budget (tuition only; living costs come on top)
  const tuition = nonEuTuition(p);
  const extra = p.otherFeesPerYear ?? 0;
  if (tuition && tuition.min !== null) {
    const low = tuition.min + extra;
    const high = (tuition.max ?? tuition.min) + extra;
    const label = low === high ? `€${low.toLocaleString("en-GB")}` : `€${low.toLocaleString("en-GB")}–${high.toLocaleString("en-GB")}`;
    if (profile.budgetPerYear !== null && low > profile.budgetPerYear) {
      worsen("no");
      reasons.push(`Non-EU fees ${label}/year are above your budget`);
    } else if (profile.budgetPerYear !== null && high > profile.budgetPerYear) {
      worsen("warn");
      reasons.push(`Non-EU fees ${label}/year may be above your budget`);
    } else {
      reasons.push(`Non-EU fees about ${label}/year (living costs not included)`);
    }
  } else {
    worsen("warn");
    reasons.push("Non-EU tuition: check yourself");
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
  if (profile.austrianSchool && p.country === "Austria") {
    reasons.push("Graduates of Austrian schools abroad can ask for EU-equal tuition status: confirm with the university");
  }
  return { status, reasons, tuitionPerYear: tuition };
}
