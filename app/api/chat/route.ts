import { generateText } from "ai";
import { z } from "zod";
import { RULES, withModel } from "@/lib/ai";
import { opportunities, programs } from "@/lib/data";
import { checkProgram } from "@/lib/eligibility";
import { diplomaLabel } from "@/lib/education";
import { formatPrice } from "@/lib/price";
import { matchOpportunity } from "@/lib/match";
import { requirePremium, subscriptionIdSchema } from "@/lib/premium";
import { profileSchema } from "@/lib/schemas";
import type { Profile } from "@/lib/types";

const bodySchema = z.object({
  subscriptionId: subscriptionIdSchema,
  profile: profileSchema,
  savedIds: z.array(z.string().max(80)).max(100),
  starredIds: z.array(z.string().max(120)).max(100),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(1500) }))
    .min(1)
    .max(20),
});

const CHAT_RULES = `${RULES}
You are the Hapi chat assistant for a Premium student. Answer questions about studying abroad, applying, costs, scholarships, deadlines, CVs and motivation letters.
- For anything about specific opportunities, programmes, dates, prices or eligibility, use ONLY the facts in the context below. Eligibility in the context was already checked by code.
- If the answer is not in the context, say you do not know it and tell the student to check the official page. Never guess a date, price or rule.
- General advice (how to write a motivation letter, how to prepare for an interview) is fine, but keep it practical.
- When you mention an opportunity, link it as [title](/opportunities/ID). For programmes, link [university – programme](/universities).
- Keep answers short: a few sentences or a short list. Use the student's first name only if given. No emojis.`;

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });
  const { subscriptionId, savedIds, starredIds, messages } = parsed.data;
  const profile = parsed.data.profile as Profile;

  const denied = await requirePremium(subscriptionId);
  if (denied) return denied;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const fitting = opportunities
    .map((o) => ({ o, m: matchOpportunity(o, profile, now) }))
    .filter(({ o, m }) => m.verdict === "fits" || savedIds.includes(o.id))
    .sort((a, b) => Number(savedIds.includes(b.o.id)) - Number(savedIds.includes(a.o.id)) || b.m.score - a.m.score)
    .slice(0, 30)
    .map(({ o, m }) => ({
      id: o.id,
      title: o.title,
      type: o.type,
      provider: o.provider,
      deadline: o.deadline,
      daysLeft: m.daysLeft,
      cost: o.costType === "free" ? "free" : o.price ? `${o.price.amount} ${o.price.currency}` : o.costType ?? "unknown",
      travelPaid: o.travelPaid,
      saved: savedIds.includes(o.id),
      fits: m.verdict === "fits",
      officialPage: o.sourceUrl,
    }));

  const progs = programs
    .map((p) => ({ p, e: checkProgram(p, profile) }))
    .filter(({ p, e }) => e.status === "ok" || starredIds.includes(p.id))
    .sort((a, b) => Number(starredIds.includes(b.p.id)) - Number(starredIds.includes(a.p.id)) || (a.e.price.min ?? 1e9) - (b.e.price.min ?? 1e9))
    .slice(0, 40)
    .map(({ p, e }) => ({
      university: p.university,
      programme: p.program,
      country: p.country,
      city: p.city,
      language: p.language,
      pricePerYearForThisStudent: formatPrice(e.price),
      priceConfirmed: e.price.confirmed,
      applyBy: p.applyBy,
      applicationFee: p.applicationFeeShort,
      entryTest: p.entryTest,
      scholarships: p.scholarships ?? null,
      starred: starredIds.includes(p.id),
      openToStudent: e.status === "ok",
    }));

  const context = `Today is ${today}.
Student profile: ${JSON.stringify({ ...profile, diploma: diplomaLabel(profile.diploma), nationality: profile.nationality || "unknown" })}
Opportunities this student can apply to (and ones they saved): ${JSON.stringify(fitting)}
Bachelor programmes open to this student, cheapest first (and ones they starred): ${JSON.stringify(progs)}
Hapi has ${opportunities.length} opportunities and ${programs.length} programmes in total; only the ones above fit this student.`;

  try {
    const result = await withModel((call) =>
      generateText({
        ...call,
        system: `${CHAT_RULES}\n\nCONTEXT\n${context}`,
        messages,
      }),
    );
    const reply = result.text.trim();
    if (!reply) throw new Error("empty");
    return Response.json({ reply });
  } catch {
    return Response.json({ error: "AI unavailable" }, { status: 503 });
  }
}
