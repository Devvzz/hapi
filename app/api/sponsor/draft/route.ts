import { generateText, Output } from "ai";
import { z } from "zod";
import { RULES, withModel } from "@/lib/ai";

const bodySchema = z.object({
  command: z.string().min(3).max(500),
  rows: z
    .array(z.object({ id: z.string(), item: z.string(), amount: z.number(), currency: z.string(), status: z.string() }))
    .max(100),
});

const draftSchema = z.object({
  sponsorName: z.string().describe("Name of the person asked to pay, as written in the request"),
  sponsorEmail: z.string().nullable().describe("Email if the request contains one, otherwise null"),
  rowIds: z.array(z.string()).describe("IDs of the plan rows this sponsor should pay"),
  message: z.string().describe("Short, warm message to the sponsor in English, max 60 words, no amounts that are not in the rows"),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });
  const unpaid = parsed.data.rows.filter((r) => r.status === "unpaid");
  if (unpaid.length === 0) return Response.json({ error: "No unpaid costs in your plan" }, { status: 400 });

  try {
    const result = await withModel((call) =>
      generateText({
        ...call,
        system: `${RULES} You draft PayPal invoices for family sponsors. You only draft; the student approves before anything is sent.`,
        output: Output.object({ schema: draftSchema }),
        prompt: `Student request: "${parsed.data.command}"
Unpaid plan rows: ${JSON.stringify(unpaid)}
Pick the rows the request refers to (only from this list) and draft the invoice.`,
      }),
    );
    const draft = result.output;
    if (!draft) throw new Error("no draft");
    const rowIds = draft.rowIds.filter((id) => unpaid.some((r) => r.id === id));
    return Response.json({ ...draft, rowIds });
  } catch {
    return Response.json({ error: "AI unavailable" }, { status: 503 });
  }
}
