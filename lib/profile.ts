import { isStudent, migrateEducation } from "./education";
import { resolveCountry } from "./countries";
import type { ActivityEntry, PlanRow, Profile } from "./types";

export const EMPTY_PROFILE: Profile = {
  nationality: "",
  age: null,
  student: true,
  schoolType: "gymnasium",
  diploma: "national",
  austrianSchool: false,
  languages: [{ language: "English", level: "B2" }],
  budgetPerYear: null,
  opportunityBudget: null,
  interests: [],
};

// Brings profiles saved by older versions up to date and keeps derived fields in sync.
export function normalizeProfile(p: Profile): Profile {
  const schoolType = migrateEducation(p.schoolType);
  const nationality = p.nationality ? (resolveCountry(p.nationality) ?? p.nationality) : "";
  const diploma = p.diploma ?? (p.austrianSchool || p.schoolType === "austrian-school-abroad" ? "austrian-matura" : "national");
  return {
    ...EMPTY_PROFILE,
    ...p,
    nationality,
    schoolType,
    diploma,
    austrianSchool: diploma === "austrian-matura",
    opportunityBudget: p.opportunityBudget ?? null,
    student: isStudent(schoolType),
  };
}

export function profileIsSet(p: Profile): boolean {
  return Boolean(p.nationality) && p.age !== null;
}

export const EMPTY_PLAN: PlanRow[] = [];
export const EMPTY_LOG: ActivityEntry[] = [];
export const EMPTY_SAVED: string[] = [];

export const STORAGE = {
  profile: "hapi.profile",
  plan: "hapi.plan",
  saved: "hapi.saved",
  log: "hapi.activity",
  premium: "hapi.premium",
  coach: "hapi.coach",
  cv: "hapi.cv",
  uniMarks: "hapi.uniMarks",
  events: "hapi.events",
  user: "hapi.user",
} as const;

export type UniMark = "apply" | "no";
export const EMPTY_MARKS: Record<string, UniMark> = {};

export type PremiumState = { subscriptionId: string | null; status: string | null };
export const EMPTY_PREMIUM: PremiumState = { subscriptionId: null, status: null };

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

// Interests the user can pick, and the tags or types they map to in the data.
export const INTERESTS: { label: string; tags: string[]; types?: string[] }[] = [
  { label: "AI", tags: ["ai", "machine-learning", "llm", "agents", "data-science"] },
  { label: "Coding", tags: ["programming", "software", "web", "python", "javascript", "open-source", "full-stack"] },
  { label: "Study abroad", tags: ["study-abroad", "bachelor", "masters", "study-in-italy", "study-in-germany", "study-in-austria"], types: ["scholarship"] },
  { label: "Free travel", tags: ["travel"] },
  { label: "Certificates", tags: ["exam", "certificate"], types: ["certificate"] },
  { label: "Languages", tags: ["language-test", "english", "german", "italian"] },
  { label: "Networking", tags: ["networking", "community", "leadership"], types: ["conference"] },
  { label: "Startups", tags: ["startup", "entrepreneurship"], types: ["startup-program"] },
  { label: "Research", tags: ["research", "science", "physics", "maths"] },
  { label: "Cybersecurity", tags: ["security", "cybersecurity", "ctf"] },
  { label: "Paid work", tags: ["paid", "job"], types: ["internship", "job"] },
];

export function logEntry(action: string, detail: string): ActivityEntry {
  return { at: new Date().toISOString(), action, detail };
}
