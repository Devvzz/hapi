import { generateText, Output } from "ai";
import { z } from "zod";
import { RULES, withModel } from "@/lib/ai";
import { opportunities } from "@/lib/data";
import { matchOpportunity } from "@/lib/match";
import { getSubscriptionStatus } from "@/lib/paypal";
import { profileSchema } from "@/lib/schemas";
import type { Profile } from "@/lib/types";

const bodySchema = z.object({
  subscriptionId: z.string().regex(/^I-[A-Z0-9]{10,}$/),
  profile: profileSchema,
  savedIds: z.array(z.string().max(80)).max(100),
  plan: z
    .array(z.object({ item: z.string().max(200), amount: z.number(), currency: z.string().max(5), dueDate: z.string().nullable(), status: z.string().max(20) }))
    .max(100),
});

const outputSchema = z.object({
  summary: z.string().describe("Two sentences at most: the focus for this week"),
  steps: z
    .array(
      z.object({
        opportunityId: z.string().nullable().describe("Id from the candidate list, or null for a cost-plan step"),
        action: z.string().describe("One concrete thing to do this week, max 20 words"),
        why: z.string().describe("Why now, based only on the given facts, max 25 words"),
      }),
    )
    .max(5),
});

export type CoachStep = {
  opportunityId: string | null;
  action: string;
  why: string;
  title: string | null;
  deadline: string | null;
  sourceUrl: string | null;
};

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });
  const { subscriptionId, savedIds, plan } = parsed.data;
  const profile = parsed.data.profile as Profile;

  // Premium check on the server: the coach only answers for an ACTIVE PayPal subscription.
  let status = "UNKNOWN";
  try {
    status = await getSubscriptionStatus(subscriptionId);
  } catch {
    return Response.json({ error: "PayPal is unavailable right now" }, { status: 503 });
  }
  if (status !== "ACTIVE") return Response.json({ error: "Premium is not active", status }, { status: 402 });

  const now = new Date();
  const candidates = opportunities
    .map((o) => ({ o, m: matchOpportunity(o, profile, now), saved: savedIds.includes(o.id) }))
    .filter(({ m }) => !m.closed && m.verdict !== "not-eligible")
    .sort((a, b) => Number(b.saved) - Number(a.saved) || b.m.score - a.m.score)
    .slice(0, 15)
    .map(({ o, m, saved }) => ({
      id: o.id, title: o.title, type: o.type, cost: o.costType, deadline: o.deadline, daysLeft: m.daysLeft, saved, reasons: m.reasons,
    }));
  const openCosts = plan.filter((r) => r.status !== "paid");

  try {
    const result = await withModel((call) =>
      generateText({
        ...call,
        system: RULES,
        output: Output.object({ schema: outputSchema }),
        prompt: `Today is ${now.toISOString().slice(0, 10)}.
Student profile: ${JSON.stringify({ ...profile, nationality: profile.nationality || "unknown" })}
Candidate opportunities (eligibility already checked by code; "saved" means the student saved it): ${JSON.stringify(candidates)}
Unpaid costs in the student's plan: ${JSON.stringify(openCosts)}
Make this week's plan: up to 5 steps, the most urgent first. Prefer saved items and close deadlines. Use only the candidate ids. Do not add facts that are not given.`,
      }),
    );
    const out = result.output;
    if (!out) throw new Error("empty");
    const steps: CoachStep[] = out.steps
      .map((s) => {
        if (s.opportunityId === null) return { ...s, title: null, deadline: null, sourceUrl: null };
        const o = opportunities.find((x) => x.id === s.opportunityId && candidates.some((c) => c.id === x.id));
        return o ? { ...s, title: o.title, deadline: o.deadline, sourceUrl: o.sourceUrl } : null;
      })
      .filter((s) => s !== null);
    return Response.json({ summary: out.summary, steps, createdAt: now.toISOString() });
  } catch {
    return Response.json({ error: "AI unavailable" }, { status: 503 });
  }
}
