import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import { RULES, withModel } from "@/lib/ai";

const bodySchema = z.object({
  topic: z.string().max(200),
  country: z.string().max(60).optional(),
});

const itemsSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string(),
        provider: z.string(),
        type: z.string(),
        deadline: z.string().nullable().describe("As written in the source, or null if not found"),
        cost: z.string().nullable(),
        sourceIndex: z.number().int().describe("Index of the source in the numbered list that supports this item"),
      }),
    )
    .max(5),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });
  const { topic, country } = parsed.data;

  try {
    // Step 1: grounded web search.
    const search = await withModel((model) =>
      generateText({
        model,
        system: RULES,
        tools: { google_search: google.tools.googleSearch({}) },
        prompt: `Find up to 5 current student opportunities about "${topic}"${country ? ` that students from ${country} can apply to` : ""}: competitions, hackathons, scholarships, programmes, internships or certificates. For each, give the name, the organiser, the deadline and the cost as stated on the official page. Prefer official pages.`,
      }),
    );

    const sources = search.sources
      .filter((s) => s.sourceType === "url")
      .map((s, i) => ({ index: i, url: s.url, title: s.title ?? s.url }));
    if (sources.length === 0) return Response.json({ items: [] });

    // Step 2: structure the findings; every item must point at one of the grounding sources.
    const structured = await withModel((model) =>
      generateText({
        model,
        system: RULES,
        output: Output.object({ schema: itemsSchema }),
        prompt: `Search findings:\n${search.text}\n\nNumbered sources:\n${sources.map((s) => `${s.index}: ${s.title}`).join("\n")}\n\nTurn the findings into items. Only include an item if one numbered source supports it, and give its index. Use null for anything not stated.`,
      }),
    );

    const items = (structured.output?.items ?? [])
      .map((item) => {
        const source = sources.find((s) => s.index === item.sourceIndex);
        return source ? { ...item, sourceUrl: source.url, sourceTitle: source.title } : null;
      })
      .filter((item) => item !== null);

    return Response.json({ items });
  } catch {
    return Response.json({ error: "AI search unavailable" }, { status: 503 });
  }
}
