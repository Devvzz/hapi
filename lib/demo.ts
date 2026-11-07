import { costs, opportunities } from "./data";
import { matchOpportunity } from "./match";
import { STORAGE } from "./profile";
import type { PlanRow, Profile } from "./types";

// Demo mode (?demo=1): a made-up sample student so judges can try every feature at once.
// The visitor's own data is kept in a backup key and comes back when they leave demo mode.
export const DEMO_KEY = "hapi.demo";
const BACKUP_KEY = "hapi.backup";
export const DEMO_SUBSCRIPTION = "DEMO";
const KEYS = [STORAGE.profile, STORAGE.plan, STORAGE.saved, STORAGE.premium, STORAGE.coach];

const DEMO_PROFILE: Profile = {
  nationality: "Germany",
  age: 17,
  student: true,
  schoolType: "secondary",
  languages: [
    { language: "English", level: "B2" },
    { language: "German", level: "C2" },
  ],
  budgetPerYear: 9000,
  interests: ["AI", "Coding", "Study abroad", "Free travel"],
};

const DEMO_COSTS = ["unipd-application", "tolc", "unipd-tuition", "uni-assist-first"];

function demoPlan(now: Date): PlanRow[] {
  const year = now.getFullYear() + 1;
  return costs
    .filter((c) => DEMO_COSTS.includes(c.id) && c.amount !== null && c.currency !== null)
    .map((c, i) => ({
      id: `demo-${c.id}`,
      item: `${c.item} (${c.scope})`,
      amount: c.amount!,
      currency: c.currency!,
      dueDate: `${year}-0${3 + i}-15`,
      sponsor: i === 2 ? "Grandma" : "",
      status: i === 0 ? "paid" : "unpaid",
      sourceUrl: c.sourceUrl,
    }));
}

function demoSaved(now: Date): string[] {
  return opportunities
    .map((o) => ({ o, m: matchOpportunity(o, DEMO_PROFILE, now) }))
    .filter(({ m }) => m.verdict === "fits" && !m.closed && m.daysLeft !== null)
    .sort((a, b) => b.m.score - a.m.score)
    .slice(0, 3)
    .map(({ o }) => o.id);
}

function write(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function enterDemo(now: Date) {
  try {
    if (window.localStorage.getItem(DEMO_KEY) !== "true") {
      const backup: Record<string, string | null> = {};
      for (const k of KEYS) backup[k] = window.localStorage.getItem(k);
      write(BACKUP_KEY, backup);
    }
    write(STORAGE.profile, DEMO_PROFILE);
    write(STORAGE.plan, demoPlan(now));
    write(STORAGE.saved, demoSaved(now));
    write(STORAGE.premium, { subscriptionId: DEMO_SUBSCRIPTION, status: "ACTIVE" });
    window.localStorage.removeItem(STORAGE.coach);
    write(DEMO_KEY, true);
  } catch {
    // storage blocked: demo mode needs localStorage
  }
}

export function leaveDemo() {
  try {
    const raw = window.localStorage.getItem(BACKUP_KEY);
    const backup = raw ? (JSON.parse(raw) as Record<string, string | null>) : {};
    for (const k of KEYS) {
      const v = backup[k];
      if (v === null || v === undefined) window.localStorage.removeItem(k);
      else window.localStorage.setItem(k, v);
    }
    window.localStorage.removeItem(BACKUP_KEY);
    window.localStorage.removeItem(DEMO_KEY);
  } catch {
    // nothing to restore
  }
}
