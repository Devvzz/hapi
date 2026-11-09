import { paysEuFees } from "./countries";
import type { Profile, Program } from "./types";

export type Price = {
  min: number | null;
  max: number | null;
  basis: string; // which fee applies to this student
  notes: string[];
  confirmed: boolean;
};

type Range = { min: number | null; max: number | null } | null;

const SLOVENIA_LOCAL_FEE = ["Bosnia and Herzegovina", "Kosovo", "Montenegro", "North Macedonia", "Serbia"];

function range(p: Program, eu: boolean): Range {
  if (eu) {
    if (p.tuitionEuPerYear) return { min: p.tuitionEuPerYear.min, max: p.tuitionEuPerYear.max };
    // Curated entries list the non-EU fee; EU/EEA citizens pay nothing in Austria and Germany.
    if (p.dataset === "curated" && (p.country === "Austria" || p.country === "Germany")) return { min: 0, max: 0 };
  }
  if (p.tuitionNonEuPerYear) return { min: p.tuitionNonEuPerYear.min, max: p.tuitionNonEuPerYear.max };
  if (p.tuitionPerYear?.amount != null) return { min: p.tuitionPerYear.amount, max: p.tuitionPerYear.amount };
  if (p.tuitionPerSemester?.amount != null) return { min: p.tuitionPerSemester.amount * 2, max: p.tuitionPerSemester.amount * 2 };
  return null;
}

// The tuition this student would pay per year, based on nationality and school.
export function priceFor(p: Program, profile: Profile): Price {
  const eu = profile.nationality ? paysEuFees(profile.nationality) : false;
  const notes: string[] = [];
  let r = range(p, eu);
  let basis = eu ? "EU/EEA fee" : profile.nationality ? "non-EU fee" : "non-EU fee (add your nationality)";

  if (!eu && profile.austrianSchool && p.country === "Austria") {
    const euRange = range(p, true);
    if (r && euRange) r = { min: euRange.min, max: r.max };
    basis = "non-EU fee, lower with equal status";
    notes.push("Graduates of Austrian schools abroad can ask for equal status, which can mean EU fees. Confirm with the university.");
  }
  // Slovenian public universities let citizens of these Western Balkan countries study for the EU (local) fee.
  if (!eu && p.country === "Slovenia" && SLOVENIA_LOCAL_FEE.includes(profile.nationality)) {
    const euRange = range(p, true);
    if (euRange) r = euRange;
    basis = "local fee (Western Balkans agreement)";
    notes.push(`Citizens of ${profile.nationality} pay the same as Slovenian and EU students here.`);
  }
  if (p.country === "Italy") notes.push("In Italy the fee usually depends on family income (ISEE), so you may pay less.");
  if (p.country === "Switzerland") notes.push("Most Swiss universities charge more if your school diploma is from abroad.");

  const extra = p.otherFeesPerYear ?? 0;
  const min = r?.min != null ? r.min + extra : null;
  const max = r?.max != null ? r.max + extra : min;
  const confidence = p.tuitionNonEuPerYear?.confidence;
  const confirmed = r !== null && confidence !== "estimate" && confidence !== "needs-check";
  return { min, max, basis, notes, confirmed };
}

export function formatPrice(price: Price): string {
  if (price.min === null) return "check yourself";
  const f = (n: number) => `€${Math.round(n).toLocaleString("en-GB")}`;
  return price.max !== null && price.max !== price.min ? `${f(price.min)}–${f(price.max)}` : f(price.min);
}
