import type { Program } from "./types";

// Every subject a student might want to study, in groups. A programme belongs to a subject when the
// subject's words appear in its name or field notes (English, German and Italian names are covered).
export type Subject = { value: string; label: string; re: RegExp };
export type SubjectGroup = { label: string; subjects: Subject[] };

export const SUBJECT_GROUPS: SubjectGroup[] = [
  {
    label: "Computers & IT",
    subjects: [
      { value: "computer-science", label: "Computer science", re: /informati[ck]|computer science|software|\bcs\b|computing|informatica/i },
      { value: "ai-data", label: "AI & data science", re: /artificial intelligence|\bai\b|data science|machine learning|\bdata\b|intelligenza artificiale/i },
      { value: "cybersecurity", label: "Cybersecurity", re: /cyber|security|sicherheit/i },
      { value: "information-systems", label: "Business IT & information systems", re: /wirtschaftsinformatik|information systems|business informatics|business it|business-tech/i },
    ],
  },
  {
    label: "Engineering & architecture",
    subjects: [
      { value: "mechanical", label: "Mechanical engineering", re: /mechanical|maschinenbau|meccanica/i },
      { value: "electrical", label: "Electrical & electronic engineering", re: /electr|elektro|elettronica|elettrica|telecom/i },
      { value: "civil", label: "Civil engineering", re: /civil|bauingenieur|civile/i },
      { value: "chemical", label: "Chemical & process engineering", re: /chemical engineering|verfahrenstechnik|process engineering|chimica/i },
      { value: "industrial", label: "Industrial & management engineering", re: /industrial|wirtschaftsingenieur|management engineering|gestionale/i },
      { value: "robotics", label: "Robotics & mechatronics", re: /robot|mechatron|automat/i },
      { value: "aerospace", label: "Aerospace & automotive", re: /aerospace|aeronaut|automotive|fahrzeug|aerospaziale/i },
      { value: "energy", label: "Energy & environmental engineering", re: /energy|energie|environmental engineering|ambientale/i },
      { value: "engineering-general", label: "General engineering", re: /engineer|ingenieur|ingegneria|polytech/i },
      { value: "architecture", label: "Architecture", re: /architect|architettura/i },
    ],
  },
  {
    label: "Maths & natural sciences",
    subjects: [
      { value: "mathematics", label: "Mathematics", re: /math|matematica|\bmaths\b/i },
      { value: "physics", label: "Physics", re: /physics|physik\b|fisica/i },
      { value: "chemistry", label: "Chemistry", re: /chemistry|chemie\b|chimica\b/i },
      { value: "biology", label: "Biology & life sciences", re: /biolog|life science|biotech|biowissenschaft/i },
      { value: "earth", label: "Earth & environmental science", re: /geolog|geoscience|earth science|environmental science|umweltwissenschaft/i },
      { value: "statistics", label: "Statistics", re: /statist/i },
    ],
  },
  {
    label: "Business & economics",
    subjects: [
      { value: "business", label: "Business & management", re: /business|betriebswirt|\bbwl\b|management|administration|economia aziendale/i },
      { value: "economics", label: "Economics", re: /econom|volkswirt|\bvwl\b|economia/i },
      { value: "finance", label: "Finance & accounting", re: /financ|accounting|banking|finanz/i },
      { value: "marketing", label: "Marketing", re: /marketing/i },
      { value: "international-business", label: "International business", re: /international business|internationale betriebswirt|international management/i },
      { value: "tourism", label: "Tourism & hospitality", re: /touris|hospitality|hotel/i },
    ],
  },
  {
    label: "Medicine & health",
    subjects: [
      { value: "medicine", label: "Medicine", re: /\bmedicine\b|humanmedizin|medicina|\bmd\b/i },
      { value: "dentistry", label: "Dentistry", re: /dent|zahnmedizin|odontoiatria/i },
      { value: "pharmacy", label: "Pharmacy", re: /pharma|farmacia/i },
      { value: "nursing", label: "Nursing & care", re: /nursing|pflege|infermieristica/i },
      { value: "nutrition", label: "Nutrition & food science", re: /nutrition|ernährung|food|lebensmittel|alimentazione/i },
      { value: "sport", label: "Sport science", re: /sport|beweg|scienze motorie/i },
    ],
  },
  {
    label: "Law & politics",
    subjects: [
      { value: "law", label: "Law", re: /\blaw\b|\blaws\b|jus\b|rechtswissenschaft|giurisprudenza|legal/i },
      { value: "politics", label: "Politics & international relations", re: /politic|international relations|internationale beziehungen|scienze politiche/i },
      { value: "public-admin", label: "Public administration", re: /public administration|public policy|verwaltung/i },
    ],
  },
  {
    label: "Social sciences & education",
    subjects: [
      { value: "psychology", label: "Psychology", re: /psycholog|psicologia/i },
      { value: "sociology", label: "Sociology", re: /sociolog|soziolog/i },
      { value: "education", label: "Education & teaching", re: /\beducation|teaching|pädagog|lehramt|scienze della formazione/i },
      { value: "communication", label: "Communication & media", re: /communication (studies|science)|media studies|journalis|kommunikationswissenschaft|scienze della comunicazione/i },
      { value: "social-work", label: "Social work", re: /social work|soziale arbeit/i },
    ],
  },
  {
    label: "Languages & humanities",
    subjects: [
      { value: "english", label: "English & English studies", re: /english (studies|literature|language and|philology)|anglist|lingue e letterature straniere/i },
      { value: "german-studies", label: "German studies", re: /germanist|german studies|deutsche philologie/i },
      { value: "languages", label: "Languages, translation & linguistics", re: /translation|linguist|languages|übersetz|lingue|dolmetsch/i },
      { value: "literature", label: "Literature", re: /literatur|letteratura|\bliterature\b/i },
      { value: "history", label: "History", re: /\bhistory\b|geschichte|storia/i },
      { value: "philosophy", label: "Philosophy", re: /philosoph|filosofia/i },
    ],
  },
  {
    label: "Arts & design",
    subjects: [
      { value: "design", label: "Design & fashion", re: /fashion|(graphic|industrial|product|interior|communication|visual|game) design|^design/i },
      { value: "fine-arts", label: "Fine arts", re: /fine art|bildende kunst|belle arti|\bart\b/i },
      { value: "music", label: "Music", re: /music|musik|musica/i },
      { value: "film", label: "Film & media production", re: /\bfilm\b|media production|cinema(?!.*engineer)/i },
    ],
  },
  {
    label: "Agriculture & environment",
    subjects: [
      { value: "agriculture", label: "Agriculture", re: /agricult|agrar|agraria/i },
      { value: "environment", label: "Environment & sustainability", re: /sustainab|nachhaltig|environment|umwelt/i },
      { value: "veterinary", label: "Veterinary medicine", re: /veterin/i },
    ],
  },
];

export const SUBJECTS: Subject[] = SUBJECT_GROUPS.flatMap((g) => g.subjects);
const BY_VALUE = new Map(SUBJECTS.map((s) => [s.value, s]));

export function subjectLabel(value: string): string {
  return BY_VALUE.get(value)?.label ?? value;
}

const textOf = (p: Program) => `${p.program ?? ""} ${p.fields ?? ""}`;

export function subjectsOf(p: Program): string[] {
  const text = textOf(p);
  return SUBJECTS.filter((s) => s.re.test(text)).map((s) => s.value);
}

// Subjects a typed wish points to, e.g. "english lit" -> English, Literature.
export function subjectsFromText(text: string): string[] {
  const t = text.trim().toLowerCase();
  if (t.length < 2) return [];
  return SUBJECTS.filter((s) => s.label.toLowerCase().includes(t) || t.split(/[\s,/&]+/).some((w) => w.length >= 3 && (s.re.test(w) || s.label.toLowerCase().includes(w)))).map(
    (s) => s.value,
  );
}

// How well a programme fits what the student wants: picked subjects plus a typed wish.
// 0 means no match; higher is better. Both empty means everything fits equally (score 0, no filtering).
export function studyScore(p: Program, picked: string[], wish = ""): number {
  const mine = subjectsOf(p);
  let score = picked.filter((v) => mine.includes(v)).length;
  const w = wish.trim().toLowerCase();
  if (w.length >= 2) {
    if (textOf(p).toLowerCase().includes(w)) score += 3;
    score += subjectsFromText(w).filter((v) => mine.includes(v)).length;
  }
  return score;
}

export function degreeOf(p: Program): "bachelor" | "master" {
  return p.degree ?? "bachelor";
}

export function wantsSomething(picked: string[], wish = ""): boolean {
  return picked.length > 0 || wish.trim().length >= 2;
}
