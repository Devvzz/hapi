import "server-only";
import { z } from "zod";
import { DEMO_SUBSCRIPTION } from "./demo";
import { getSubscriptionStatus } from "./paypal";

export const subscriptionIdSchema = z.union([z.literal(DEMO_SUBSCRIPTION), z.string().regex(/^I-[A-Z0-9]{10,}$/)]);

// Premium check on the server: an ACTIVE PayPal subscription, or demo mode while HAPI_DEMO is not "off".
export async function requirePremium(subscriptionId: string): Promise<Response | null> {
  if (subscriptionId === DEMO_SUBSCRIPTION) {
    return process.env.HAPI_DEMO === "off" ? Response.json({ error: "Demo mode is off" }, { status: 402 }) : null;
  }
  let status = "UNKNOWN";
  try {
    status = await getSubscriptionStatus(subscriptionId);
  } catch {
    return Response.json({ error: "PayPal is unavailable right now" }, { status: 503 });
  }
  return status === "ACTIVE" ? null : Response.json({ error: "Premium is not active", status }, { status: 402 });
}
