import { generateText, Output } from "ai";
import { z } from "zod";
import { withModel } from "@/lib/ai";
import { requirePremium, subscriptionIdSchema } from "@/lib/premium";

const bodySchema = z.object({
  subscriptionId: subscriptionIdSchema,
  kind: z.enum(["about", "activities", "skills"]),
  text: z.string().min(3).max(3000),
  context: z.string().max(300).optional(),
});

const outputSchema = z.object({
  text: z.string().describe("The improved text only"),
  missing: z.array(z.string()).max(3).describe("Up to 3 short questions about facts the student could add; never invent them"),
});

const STYLE: Record<z.infer<typeof bodySchema>["kind"], string> = {
  about: "A short 'About me' for a Europass CV: 2 to 4 sentences, first person, plain and specific, no clichés like 'hard-working team player'.",
  activities:
    "'Main activities and responsibilities' for a Europass CV entry: 2 to 5 bullet points, each starting with '• ' and an action verb, past tense for finished roles.",
  skills: "A skills section for a Europass CV: short lines grouped by kind, each starting with '• '.",
};

const CV_RULES =
  "You edit CVs for students. Keep every fact the student gave and add none: no new employers, dates, numbers, tools, grades or results. If something would help but is not given, ask about it in 'missing' instead. Use clear British English.";

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });
  const { subscriptionId, kind, text, context } = parsed.data;

  const denied = await requirePremium(subscriptionId);
  if (denied) return denied;

  try {
    const result = await withModel((call) =>
      generateText({
        ...call,
        system: CV_RULES,
        output: Output.object({ schema: outputSchema }),
        prompt: `${STYLE[kind]}${context ? `\nThis is for: ${context}` : ""}\n\nThe student wrote:\n"""${text}"""\n\nRewrite it.`,
      }),
    );
    if (!result.output) throw new Error("empty");
    return Response.json(result.output);
  } catch {
    return Response.json({ error: "AI unavailable" }, { status: 503 });
  }
}
