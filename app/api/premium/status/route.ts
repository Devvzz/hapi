import { z } from "zod";
import { getSubscriptionStatus } from "@/lib/paypal";

const bodySchema = z.object({ id: z.string().regex(/^I-[A-Z0-9]{10,}$/) });

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });
  try {
    return Response.json({ id: parsed.data.id, status: await getSubscriptionStatus(parsed.data.id) });
  } catch {
    return Response.json({ id: parsed.data.id, status: "UNKNOWN" });
  }
}
