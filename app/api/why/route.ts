import { generateText, Output } from "ai";
import { z } from "zod";
import { RULES, withModel } from "@/lib/ai";
import { opportunities } from "@/lib/data";
import { matchOpportunity } from "@/lib/match";
import type { Profile } from "@/lib/types";

const bodySchema = z.object({
  ids: z.array(z.string()).max(8),
  profile: z.object({
    nationality: z.string(),
    age: z.number().nullable(),
    student: z.boolean(),
    schoolType: z.string(),
    languages: z.array(z.object({ language: z.string(), level: z.string() })),
    budgetPerYear: z.number().nullable(),
    interests: z.array(z.string()),
  }),
});

const outputSchema = z.object({
  lines: z.array(z.object({ id: z.string(), line: z.string().describe("One sentence, max 25 words, on why it fits this student") })),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });
  const profile = parsed.data.profile as Profile;

  const items = parsed.data.ids
    .map((id) => opportunities.find((o) => o.id === id))
    .filter((o) => o !== undefined)
    .map((o) => {
      const m = matchOpportunity(o, profile, new Date());
      return { id: o.id, title: o.title, type: o.type, cost: o.costType, travel: o.travelPaid, deadline: o.deadline, tags: o.tags, ruleReasons: m.reasons };
    });
  if (items.length === 0) return Response.json({ lines: [] });

  try {
    const result = await withModel((call) =>
      generateText({
        ...call,
        system: RULES,
        output: Output.object({ schema: outputSchema }),
        prompt: `Student profile: ${JSON.stringify({ ...profile, nationality: profile.nationality || "unknown" })}
Opportunities (with rule-based reasons already checked by code): ${JSON.stringify(items)}
For each opportunity id, write one line "why this fits you". Base it only on the profile, the tags and the rule reasons. Do not add new facts.`,
      }),
    );
    const lines = (result.output?.lines ?? []).filter((l) => items.some((i) => i.id === l.id));
    return Response.json({ lines });
  } catch {
    return Response.json({ error: "AI unavailable" }, { status: 503 });
  }
}
