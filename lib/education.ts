// Where a student is now, and which application group that puts them in.
export type Group = "school" | "bachelor" | "master" | "phd" | "graduate";

export const EDUCATION = [
  { value: "middle-school", label: "Middle school / lower secondary (about 11–15)", group: "school" },
  { value: "gymnasium", label: "High school / Gymnasium / general secondary", group: "school" },
  { value: "htl", label: "HTL or other 5-year technical school", group: "school" },
  { value: "vocational", label: "Vocational school (BHS, BMS, professional high school)", group: "school" },
  { value: "ib", label: "International school / IB Diploma", group: "school" },
  { value: "school-leaver", label: "Finished school, not at university yet (gap year)", group: "school" },
  { value: "bachelor", label: "Bachelor student", group: "bachelor" },
  { value: "bachelor-done", label: "Finished a bachelor's degree", group: "graduate" },
  { value: "master", label: "Master's student", group: "master" },
  { value: "master-done", label: "Finished a master's degree", group: "graduate" },
  { value: "phd", label: "PhD student or researcher", group: "phd" },
  { value: "working", label: "Working, not studying", group: "graduate" },
  { value: "other", label: "Other", group: null },
] as const satisfies readonly { value: string; label: string; group: Group | null }[];

export type Education = (typeof EDUCATION)[number]["value"];

export const GROUP_LABEL: Record<Group, string> = {
  school: "school pupils",
  bachelor: "bachelor students",
  master: "master's students",
  phd: "PhD students",
  graduate: "graduates",
};

export function groupOf(e: string): Group | null {
  return EDUCATION.find((x) => x.value === e)?.group ?? null;
}

export function isStudent(e: string): boolean {
  return ["middle-school", "gymnasium", "htl", "vocational", "ib", "bachelor", "master", "phd"].includes(e);
}

// Profiles saved before the detailed list used four broad values.
export function migrateEducation(old: string): Education {
  if (old === "secondary" || old === "austrian-school-abroad") return "gymnasium";
  if (old === "university") return "bachelor";
  return EDUCATION.some((x) => x.value === old) ? (old as Education) : "other";
}

// The school-leaving diploma. Some countries treat diplomas from their own schools abroad like local ones.
export const DIPLOMAS: { value: string; label: string }[] = [
  { value: "national", label: "The state school-leaving exam of my country" },
  { value: "austrian-matura", label: "Austrian Matura / Reifeprüfung (Austrian school abroad, e.g. an HTL)" },
  { value: "german-abitur", label: "German Abitur (German school abroad)" },
  { value: "italian-maturita", label: "Italian Maturità (Italian school abroad)" },
  { value: "ib", label: "IB Diploma (International Baccalaureate)" },
  { value: "a-levels", label: "A-levels / British curriculum" },
  { value: "us-diploma", label: "American high school diploma (with SAT/AP)" },
  { value: "other", label: "Other or not sure yet" },
];

export function diplomaLabel(value: string | undefined): string {
  return DIPLOMAS.find((d) => d.value === value)?.label ?? DIPLOMAS[0].label;
}
