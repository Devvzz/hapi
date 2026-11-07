import { startPremium } from "@/lib/paypal";

// Creates a PayPal sandbox subscription and returns the link where the student approves it.
export async function POST(request: Request) {
  try {
    const origin = new URL(request.url).origin;
    return Response.json(await startPremium(origin));
  } catch (error) {
    console.error("premium subscribe failed:", error instanceof Error ? error.message : error);
    return Response.json({ error: "PayPal is unavailable right now" }, { status: 503 });
  }
}
