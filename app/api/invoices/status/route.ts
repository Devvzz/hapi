import { z } from "zod";
import { getInvoiceStatus } from "@/lib/paypal";

const bodySchema = z.object({ ids: z.array(z.string().regex(/^INV2(-[A-Z0-9]{4}){4}$/)).max(50) });

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });
  const results = await Promise.all(
    parsed.data.ids.map(async (id) => {
      try {
        return { id, status: await getInvoiceStatus(id) };
      } catch {
        return { id, status: "UNKNOWN" };
      }
    }),
  );
  return Response.json({ results });
}
