import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import { RULES, withModel } from "./ai";
import { opportunities } from "./data";
import { daysUntil, parseDeadline } from "./dates";
import type { Opportunity } from "./types";

// Saturday research job: re-read the official page of a few open opportunities and report what changed.
// It reads the page itself (no web search), so every finding comes from the item's own source link.

export type CheckResult = {
  id: string;
  title: string;
  sourceUrl: string;
  storedDeadline: string | null;
  foundDeadline: string | null;
  status: "open" | "closed" | "new-edition" | "unclear" | "unreachable";
  evidence: string | null;
  change: "date-changed" | "closed" | "new-edition" | "unreachable" | null;
};

export type ResearchRun = { ranAt: string; checked: CheckResult[]; example?: boolean; note?: string };

const PER_RUN = 6;
const FETCH_TIMEOUT_MS = 10_000;

const pageSchema = z.object({
  deadline: z.string().nullable().describe("The application or registration deadline as YYYY-MM-DD, only if the page states it; otherwise null"),
  status: z.enum(["open", "closed", "new-edition", "unclear"]).describe("new-edition means the page is now about a later round than the one described"),
  evidence: z.string().nullable().describe("A short quote from the page, max 20 words, that supports the answer"),
});

// Open items with a deadline, least recently checked first, then the closest deadline.
export function pickItems(now: Date, count = PER_RUN): Opportunity[] {
  return opportunities
    .filter((o) => {
      const d = parseDeadline(o.deadline);
      return d !== null && daysUntil(d, now) >= 0;
    })
    .sort((a, b) => a.lastChecked.localeCompare(b.lastChecked) || (a.deadline ?? "").localeCompare(b.deadline ?? ""))
    .slice(0, count);
}

async function readPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "HapiResearchBot/1.0 (student opportunities; weekly date check)" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const text = html
      .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > 200 ? text.slice(0, 15_000) : null;
  } catch {
    return null;
  }
}

// Stored deadlines are in Central European time; pages often give a US or Asian local date,
// so a deadline near midnight can show as the day before or after. Only a bigger move counts.
function movedMoreThanADay(found: string, stored: string | null): boolean {
  const a = parseDeadline(found.slice(0, 10));
  const b = parseDeadline(stored ? stored.slice(0, 10) : null);
  if (!a || !b) return a !== b;
  return Math.abs(a.getTime() - b.getTime()) > 86_400_000;
}

async function checkOne(o: Opportunity, now: Date): Promise<CheckResult> {
  const base = { id: o.id, title: o.title, sourceUrl: o.sourceUrl, storedDeadline: o.deadline };
  const page = await readPage(o.sourceUrl);
  if (!page) return { ...base, foundDeadline: null, status: "unreachable", evidence: null, change: "unreachable" };

  try {
    const result = await withModel((call) =>
      generateText({
        ...call,
        system: RULES,
        output: Output.object({ schema: pageSchema }),
        prompt: `Today is ${now.toISOString().slice(0, 10)}. We have this item: "${o.title}" by ${o.provider}, deadline on file: ${o.deadline ?? "unknown"}.
Here is the text of its official page:
"""${page}"""
From the page text only: what is the deadline, and is the round open, closed, or replaced by a new edition?`,
      }),
    );
    const out = result.output;
    if (!out) throw new Error("empty");
    let change: CheckResult["change"] = null;
    if (out.status === "closed") change = "closed";
    else if (out.status === "new-edition") change = "new-edition";
    else if (out.deadline && parseDeadline(out.deadline.slice(0, 10)) && movedMoreThanADay(out.deadline, o.deadline)) change = "date-changed";
    return { ...base, foundDeadline: out.deadline, status: out.status, evidence: out.evidence, change };
  } catch {
    return { ...base, foundDeadline: null, status: "unclear", evidence: null, change: null };
  }
}

export async function runResearch(now = new Date()): Promise<ResearchRun> {
  const checked = await Promise.all(pickItems(now).map((o) => checkOne(o, now)));
  return { ranAt: now.toISOString(), checked };
}

// Optional storage: Upstash Redis over its REST API. Without keys the app shows the saved example run.
const KEY = "hapi:last-run";

function redis(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export async function saveRun(run: ResearchRun): Promise<boolean> {
  const r = redis();
  if (!r) return false;
  const res = await fetch(`${r.url}/set/${KEY}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${r.token}` },
    body: JSON.stringify(run),
  });
  return res.ok;
}

export async function loadRun(): Promise<ResearchRun | null> {
  const r = redis();
  if (!r) return null;
  try {
    const res = await fetch(`${r.url}/get/${KEY}`, { headers: { Authorization: `Bearer ${r.token}` }, cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { result: string | null };
    return data.result ? (JSON.parse(data.result) as ResearchRun) : null;
  } catch {
    return null;
  }
}
