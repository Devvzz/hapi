// Anonymous counting for the statistics page (see supabase/stats.sql).
// Only the kind of event and a short detail such as a country or an opportunity type are sent: no user id, name or email.

export type TrackKind = "profile" | "save" | "find_more" | "cost_plan" | "invoice" | "chat" | "survey" | "ai_check";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function track(kind: TrackKind, detail?: string | null): void {
  if (typeof window !== "undefined" && window.localStorage.getItem("hapi.demo")) return; // demo clicks are not real use
  void count(kind, detail);
}

// The same, awaitable, for server code such as the weekly job.
export async function count(kind: TrackKind, detail?: string | null): Promise<void> {
  if (!url || !key) return;
  await fetch(`${url}/rest/v1/usage_events`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ kind, detail: detail ? detail.slice(0, 60) : null }),
    keepalive: true,
  }).catch(() => {});
}

// Counts something only once per browser, e.g. that this person made a profile.
export function trackOnce(flag: string, kind: TrackKind, detail?: string | null): void {
  if (typeof window === "undefined") return;
  const k = `hapi.counted.${flag}`;
  try {
    if (window.localStorage.getItem("hapi.demo") || window.localStorage.getItem(k)) return;
    window.localStorage.setItem(k, "1");
  } catch {
    return;
  }
  track(kind, detail);
}

export type HapiStats = {
  profiles: number;
  accounts: number;
  countries: { country: string; n: number }[];
  saves: number;
  saveTypes: { type: string; n: number }[];
  findMore: number;
  chats: number;
  costPlans: number;
  invoices: number;
  surveyYes: number;
  surveyNo: number;
  aiChecks: number;
  aiChanges: Record<string, number>;
  since: string | null;
};

export async function fetchStats(): Promise<HapiStats | null> {
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/hapi_stats`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: "{}", cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as HapiStats;
  } catch {
    return null;
  }
}
