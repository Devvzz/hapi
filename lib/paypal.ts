import "server-only";
import { PayPalAgentToolkit } from "@paypal/agent-toolkit/ai-sdk";

// Invoices and the Premium subscription go through the PayPal Agent Toolkit in the sandbox.
// The model never gets these tools: the server only calls them after the student clicks a button.
let toolkit: PayPalAgentToolkit | null = null;

function tools() {
  if (!toolkit) {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error("PayPal keys are missing");
    toolkit = new PayPalAgentToolkit({
      clientId,
      clientSecret,
      configuration: {
        actions: {
          invoices: { create: true, send: true, get: true },
          products: { create: true },
          subscriptionPlans: { create: true, list: true },
          subscriptions: { create: true, show: true },
        },
        context: { sandbox: (process.env.PAYPAL_ENVIRONMENT ?? "SANDBOX").toUpperCase() !== "PRODUCTION" },
      },
    });
  }
  return toolkit.getTools();
}

type ToolName =
  | "create_invoice"
  | "send_invoice"
  | "get_invoice"
  | "create_product"
  | "create_subscription_plan"
  | "list_subscription_plans"
  | "create_subscription"
  | "show_subscription_details";

async function run(name: ToolName, args: Record<string, unknown>): Promise<unknown> {
  const tool = tools()[name] as unknown as { execute: (input: Record<string, unknown>) => Promise<unknown> };
  const raw = await tool.execute(args);
  return typeof raw === "string" ? safeJson(raw) : raw;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Invoice IDs look like INV2-XXXX-XXXX-XXXX-XXXX; the create call may return the object or only a link.
function findInvoiceId(value: unknown): string | null {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.match(/INV2(?:-[A-Z0-9]{4}){4}/)?.[0] ?? null;
}

export type InvoiceLine = { name: string; amount: number; currency: string };

export async function createAndSendInvoice(input: {
  sponsorName: string;
  sponsorEmail: string;
  lines: InvoiceLine[];
  note: string;
}): Promise<{ invoiceId: string; status: string }> {
  const [given, ...rest] = input.sponsorName.trim().split(/\s+/);
  const created = await run("create_invoice", {
    currency_code: input.lines[0].currency,
    note: input.note.slice(0, 4000),
    primary_recipients: [
      { billing_info: { name: { given_name: given || "Sponsor", surname: rest.join(" ") || undefined }, email_address: input.sponsorEmail } },
    ],
    items: input.lines.map((l) => ({
      name: l.name.slice(0, 200),
      quantity: "1",
      unit_amount: { currency_code: l.currency, value: l.amount.toFixed(2) },
    })),
  });
  const invoiceId = findInvoiceId(created);
  if (!invoiceId) throw new Error("PayPal did not return an invoice ID");
  await run("send_invoice", { invoice_id: invoiceId, send_to_recipient: true });
  return { invoiceId, status: await getInvoiceStatus(invoiceId) };
}

export async function getInvoiceStatus(invoiceId: string): Promise<string> {
  const invoice = await run("get_invoice", { invoice_id: invoiceId });
  const status = (invoice as { status?: string } | null)?.status;
  return typeof status === "string" ? status : "UNKNOWN";
}

// Hapi Premium: one monthly plan. PAYPAL_PREMIUM_PLAN_ID can pin it; otherwise the server finds or creates it once.
const PLAN_NAME = "Hapi Premium monthly";
export const PREMIUM_PRICE = { value: "2.99", currency: "EUR" };
let planId: string | null = process.env.PAYPAL_PREMIUM_PLAN_ID ?? null;

async function premiumPlanId(): Promise<string> {
  if (planId) return planId;
  const list = (await run("list_subscription_plans", { page_size: 20 })) as { plans?: { id: string; name: string; status: string }[] };
  const existing = list.plans?.find((p) => p.name === PLAN_NAME && p.status === "ACTIVE");
  if (existing) return (planId = existing.id);

  const product = (await run("create_product", {
    name: "Hapi Premium",
    type: "SERVICE",
    description: "Weekly AI coach for students planning to study abroad",
  })) as { id?: string };
  if (!product.id) throw new Error("PayPal did not return a product ID");
  const plan = (await run("create_subscription_plan", {
    product_id: product.id,
    name: PLAN_NAME,
    billing_cycles: [
      {
        frequency: { interval_unit: "MONTH", interval_count: 1 },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: { fixed_price: { value: PREMIUM_PRICE.value, currency_code: PREMIUM_PRICE.currency } },
      },
    ],
    payment_preferences: { auto_bill_outstanding: true, payment_failure_threshold: 1 },
  })) as { id?: string };
  if (!plan.id) throw new Error("PayPal did not return a plan ID");
  return (planId = plan.id);
}

export async function startPremium(origin: string): Promise<{ subscriptionId: string; approveUrl: string }> {
  const sub = (await run("create_subscription", {
    plan_id: await premiumPlanId(),
    application_context: {
      brand_name: "Hapi",
      user_action: "SUBSCRIBE_NOW",
      return_url: `${origin}/premium`,
      cancel_url: `${origin}/premium?cancelled=1`,
    },
  })) as { id?: string; links?: { rel: string; href: string }[] };
  const approveUrl = sub.links?.find((l) => l.rel === "approve")?.href;
  if (!sub.id || !approveUrl) throw new Error("PayPal did not return an approval link");
  return { subscriptionId: sub.id, approveUrl };
}

export async function getSubscriptionStatus(subscriptionId: string): Promise<string> {
  const sub = (await run("show_subscription_details", { subscription_id: subscriptionId })) as { status?: string } | null;
  return typeof sub?.status === "string" ? sub.status : "UNKNOWN";
}
