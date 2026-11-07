import type { Profile } from "./types";

// A CV in the structure of the Europass CV (europass.europa.eu): the same sections, order and
// CEFR self-assessment grid, so it can be copied into the official Europass editor.

export type Cefr = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export const CEFR: Cefr[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export type CvLanguage = { language: string; listening: Cefr; reading: Cefr; production: Cefr; interaction: Cefr; writing: Cefr; certificate: string };
export type CvWork = { id: string; role: string; employer: string; city: string; country: string; from: string; to: string; ongoing: boolean; activities: string };
export type CvEducation = { id: string; title: string; organisation: string; city: string; country: string; from: string; to: string; ongoing: boolean; eqf: string; subjects: string };
export type CvExtra = { id: string; heading: string; title: string; date: string; description: string };

export type Cv = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  about: string;
  work: CvWork[];
  education: CvEducation[];
  motherTongues: string;
  languages: CvLanguage[];
  digitalSkills: string;
  otherSkills: string;
  drivingLicence: string;
  extras: CvExtra[];
};

export const EMPTY_CV: Cv = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  nationality: "",
  phone: "",
  email: "",
  address: "",
  website: "",
  about: "",
  work: [],
  education: [],
  motherTongues: "",
  languages: [],
  digitalSkills: "",
  otherSkills: "",
  drivingLicence: "",
  extras: [],
};

// European Qualifications Framework levels, as Europass asks for them.
export const EQF = [
  { value: "", label: "EQF level (optional)" },
  { value: "2", label: "EQF 2: lower secondary" },
  { value: "3", label: "EQF 3: vocational qualification" },
  { value: "4", label: "EQF 4: upper secondary (Matura, high school diploma)" },
  { value: "5", label: "EQF 5: short higher education, HTL diploma (Austria)" },
  { value: "6", label: "EQF 6: bachelor's degree" },
  { value: "7", label: "EQF 7: master's degree" },
  { value: "8", label: "EQF 8: doctorate" },
];

export const EXTRA_HEADINGS = ["Projects", "Honours and awards", "Volunteering", "Certificates", "Conferences and seminars", "Hobbies and interests"];

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const SCHOOL_EQF: Record<string, string> = { gymnasium: "4", ib: "4", vocational: "4", htl: "5", "school-leaver": "4", bachelor: "6", "bachelor-done": "6", master: "7", "master-done": "7", phd: "8" };

// Starts a CV from the Hapi profile: nationality, languages (same level for all five skills) and current education.
export function draftFromProfile(cv: Cv, p: Profile): Cv {
  const languages: CvLanguage[] = p.languages
    .filter((l) => !cv.languages.some((x) => x.language === l.language))
    .map((l) => ({ language: l.language, listening: l.level, reading: l.level, production: l.level, interaction: l.level, writing: l.level, certificate: "" }));
  const education =
    cv.education.length === 0 && SCHOOL_EQF[p.schoolType]
      ? [{ id: newId(), title: "", organisation: "", city: "", country: "", from: "", to: "", ongoing: !p.schoolType.endsWith("-done"), eqf: SCHOOL_EQF[p.schoolType], subjects: "" }]
      : cv.education;
  return { ...cv, nationality: cv.nationality || p.nationality, languages: [...cv.languages, ...languages], education };
}

export function period(from: string, to: string, ongoing: boolean): string {
  const f = (s: string) => (s ? s.split("-").reverse().join("/") : "");
  if (!from && !to && !ongoing) return "";
  return `${f(from)} – ${ongoing ? "Current" : f(to)}`;
}
