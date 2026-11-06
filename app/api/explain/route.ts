import { generateText, Output } from "ai";
import { z } from "zod";
import { RULES, withModel } from "@/lib/ai";
import { programs } from "@/lib/data";

const bodySchema = z.object({
  programId: z.string(),
  status: z.enum(["ok", "warn", "no"]),
  reasons: z.array(z.string()).max(12),
  profile: z.record(z.string(), z.unknown()),
});

const outputSchema = z.object({
  summary: z.string().describe("2-3 sentences in plain English for the student"),
  nextSteps: z.array(z.string()).max(4).describe("Concrete next steps, each based on the given facts"),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });
  const program = programs.find((p) => p.id === parsed.data.programId);
  if (!program) return Response.json({ error: "Unknown programme" }, { status: 404 });

  const facts = {
    university: program.university,
    programme: program.program,
    country: program.country,
    language: program.language,
    admission: program.admission,
    deadline: program.deadline ?? program.nonEuWindow ?? null,
    deadlineCycle: program.deadlineCycle ?? null,
    nonEuTuition: program.tuitionNonEuPerYear ?? program.tuitionPerYear ?? program.tuitionPerSemester ?? null,
    scholarships: program.scholarships ?? null,
    checkYourself: program.checkYourself,
  };

  try {
    const result = await withModel((model) =>
      generateText({
        model,
        system: RULES,
        output: Output.object({ schema: outputSchema }),
        prompt: `The rule-based check said "${parsed.data.status}" with these reasons: ${JSON.stringify(parsed.data.reasons)}.
Programme facts (from checked data): ${JSON.stringify(facts)}
Student profile: ${JSON.stringify(parsed.data.profile)}
Explain the result to the student and list next steps. Do not change the verdict. Anything marked null or in checkYourself must be described as "check with the university".`,
      }),
    );
    if (!result.output) throw new Error("no output");
    return Response.json(result.output);
  } catch {
    return Response.json({ error: "AI unavailable" }, { status: 503 });
  }
}
