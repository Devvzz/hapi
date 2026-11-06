import { z } from "zod";
import { createAndSendInvoice } from "@/lib/paypal";

const bodySchema = z.object({
  approved: z.literal(true),
  sponsorName: z.string().min(1).max(100),
  sponsorEmail: z.string().email(),
  note: z.string().max(4000),
  lines: z
    .array(z.object({ name: z.string().min(1), amount: z.number().positive(), currency: z.string().length(3) }))
    .min(1)
    .max(50),
});

// Only reached from the Approve button on the approval card.
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Approve the card with a valid email first" }, { status: 400 });
  const currencies = new Set(parsed.data.lines.map((l) => l.currency));
  if (currencies.size > 1) return Response.json({ error: "One invoice can only use one currency" }, { status: 400 });

  try {
    const result = await createAndSendInvoice(parsed.data);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error && error.message === "PayPal keys are missing" ? error.message : "PayPal sandbox error, try again";
    return Response.json({ error: message }, { status: 502 });
  }
}
