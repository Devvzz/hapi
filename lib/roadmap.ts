import { EU_FEE_COUNTRIES } from "./countries";
import type { Profile, Program } from "./types";

// The step-by-step path from "I want to apply" to "I live there", for one programme.
// Only the application deadline is official. Every other date is a suggestion worked out backwards from it.

export type RoadStep = {
  key: "language" | "test" | "apply" | "visa" | "housing" | "arrive";
  title: string;
  detail: string;
  due: string | null; // ISO day
  official: boolean;
};

// The autumn 2027 intake starts around October in most countries.
export const START = "2027-10-01";

const CERTS: Record<string, string> = {
  English: "IELTS Academic, TOEFL iBT or Cambridge C1",
  German: "ÖSD, Goethe-Zertifikat, TestDaF or DSH",
  Italian: "CILS or CELI",
  Spanish: "DELE",
  French: "DELF or DALF",
  Portuguese: "CAPLE / CELPE-Bras",
  Hungarian: "the university's own language test",
  Czech: "the university's own language test",
};

function shift(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function needsVisa(nationality: string, country: string): boolean {
  if (!nationality || nationality === country) return false;
  return !(EU_FEE_COUNTRIES.includes(nationality) && EU_FEE_COUNTRIES.includes(country));
}

export function buildRoadmap(p: Program, profile: Profile): RoadStep[] {
  const steps: RoadStep[] = [];
  const lang = (p.language ?? "").split(/[ /,(]/)[0];
  const known = profile.languages.find((l) => l.language === lang);
  const cert = CERTS[lang] ?? "an accepted language certificate";
  steps.push({
    key: "language",
    title: `Language certificate${lang ? ` (${lang})` : ""}`,
    detail: `Take ${cert}. Results take about two weeks, so book early.${known ? ` You told Hapi you are ${known.level}; most bachelor programmes ask for B2 or C1.` : ""}`,
    due: p.applyBy ? shift(p.applyBy, -21) : null,
    official: false,
  });
  if (p.entryTest === "yes") {
    steps.push({
      key: "test",
      title: "Register for the entry test",
      detail: "This programme has an entry test. The registration often closes before the application deadline, so check the date on the official page.",
      due: p.applyBy ? shift(p.applyBy, -14) : null,
      official: false,
    });
  }
  steps.push({
    key: "apply",
    title: "Send your application",
    detail: [p.applicationFeeShort ? `Application fee: ${p.applicationFeeShort}.` : null, "Upload your school certificates, language certificate and passport."].filter(Boolean).join(" "),
    due: p.applyBy ?? null,
    official: Boolean(p.applyBy),
  });
  if (needsVisa(profile.nationality, p.country)) {
    const visa = shift(START, -75);
    steps.push({
      key: "visa",
      title: "Student visa or residence permit",
      detail: `As a citizen of ${profile.nationality} you need one for ${p.country}. Book the embassy appointment as soon as you have your admission letter; it can take 6 to 10 weeks.`,
      due: p.applyBy && shift(p.applyBy, 21) > visa ? shift(p.applyBy, 21) : visa,
      official: false,
    });
  }
  steps.push({
    key: "housing",
    title: "Find housing",
    detail: "Apply for a student dorm right after admission; places go fast. Private rooms are usually found 1 to 2 months before the start.",
    due: shift(START, -60),
    official: false,
  });
  steps.push({
    key: "arrive",
    title: "Arrive and enrol",
    detail: "Arrive about a week early to register your address, open a bank account and enrol at the university.",
    due: shift(START, -7),
    official: false,
  });
  // In date order; steps without a date keep their place.
  return steps.map((s, i) => ({ s, i })).sort((a, b) => (a.s.due && b.s.due ? a.s.due.localeCompare(b.s.due) : 0) || a.i - b.i).map(({ s }) => s);
}
