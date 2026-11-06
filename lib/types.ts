export type OpportunityType =
  | "hackathon" | "competition" | "certificate" | "course" | "summer-school" | "internship"
  | "job" | "scholarship" | "grant" | "conference" | "exchange" | "startup-program";

export type Opportunity = {
  id: string;
  type: OpportunityType;
  title: string;
  provider: string;
  mode: "online" | "onsite" | "hybrid" | null;
  location: string | null;
  costType: "free" | "discount" | "paid" | null;
  price: { amount: number; currency: string } | null;
  discountNote: string | null;
  travelPaid: "full" | "partial" | "none" | "n/a" | null;
  certificateIncluded: boolean | null;
  eligibility: { minAge: number | null; maxAge: number | null; countries: string[] | null; students: boolean | null };
  applyOpens: string | null;
  deadline: string | null;
  eventDates: string | null;
  resultsDate: string | null;
  tags: string[];
  sourceUrl: string;
  lastChecked: string;
  note?: string;
};

type Range = { min: number | null; max: number | null; currency: string };

export type Program = {
  id: string;
  universityId: string;
  university: string;
  program: string | null;
  country: string;
  city?: string;
  language: string | null;
  admission: string | null;
  dataset: "curated" | "bachelor-atlas";
  sources: string[];
  lastChecked: string | null;
  checkYourself: string[];
  // curated only
  nonEuWindow?: string | null;
  tuitionPerSemester?: { amount: number | null; currency: string; note?: string } | null;
  tuitionPerYear?: { amount: number | null; currency: string; note?: string } | null;
  // atlas only
  officialName?: string;
  fields?: string;
  years?: number;
  description?: string | null;
  tuitionNonEuPerYear?: Range & { note: string | null; confidence: "verified" | "rule" | "estimate" | "needs-check" };
  tuitionEuPerYear?: Range;
  otherFeesPerYear?: number | null;
  applicationFee?: string | null;
  deadline?: string | null;
  deadlineCycle?: string | null;
  scholarships?: string | null;
  fixes?: string[] | null;
};

export type CostItem = {
  id: string;
  scope: string;
  item: string;
  amount: number | null;
  currency: string | null;
  period: string;
  note: string;
  sourceUrl: string | null;
  lastChecked: string;
};

export type LanguageSkill = { language: string; level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" };

export type Profile = {
  nationality: string;
  age: number | null;
  student: boolean;
  schoolType: "secondary" | "austrian-school-abroad" | "university" | "other";
  languages: LanguageSkill[];
  budgetPerYear: number | null;
  interests: string[];
};

export type PlanRow = {
  id: string;
  item: string;
  amount: number;
  currency: string;
  dueDate: string | null;
  sponsor: string;
  status: "unpaid" | "invoiced" | "paid";
  sourceUrl?: string | null;
  invoiceId?: string | null;
};

export type ActivityEntry = { at: string; action: string; detail: string };
