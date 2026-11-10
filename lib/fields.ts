import type { Program } from "./types";

// Study areas a student can pick. A programme belongs to every area whose words appear in its name or field notes.
export const STUDY_FIELDS = [
  { value: "cs", label: "Computer science & AI", re: /informat|computer|software|\bcs\b|data|digital|\bit\b|\bai\b|artificial|machine learning|cyber|game/i },
  { value: "engineering", label: "Engineering", re: /engineer|ingenieur|mechan|civil|electr|chemi|industrial|aerospace|materials|energy|polytech|maschinen|technik|technology/i },
  { value: "math", label: "Maths, physics & data", re: /math|statist|physics|actuar|data science/i },
  { value: "business", label: "Business & economics", re: /business|econom|management|finance|account|wirtschaft|commerce|marketing|bwl/i },
  { value: "robotics", label: "Robotics & electronics", re: /robot|mechatron|automat|electron|telecom/i },
  { value: "sport", label: "Sport", re: /sport/i },
] as const;

export type StudyField = (typeof STUDY_FIELDS)[number]["value"] | "other";

export function fieldsOf(p: Program): StudyField[] {
  const text = `${p.program ?? ""} ${p.fields ?? ""}`;
  const found: StudyField[] = STUDY_FIELDS.filter((f) => f.re.test(text)).map((f) => f.value);
  return found.length ? found : ["other"];
}

// How many of the student's picked areas a programme covers; 0 means none.
export function fieldScore(p: Program, picked: string[]): number {
  if (picked.length === 0) return 0;
  const mine = fieldsOf(p);
  return picked.filter((f) => mine.includes(f as StudyField)).length;
}
