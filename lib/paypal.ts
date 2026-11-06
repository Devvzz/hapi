import "server-only";
import { PayPalAgentToolkit } from "@paypal/agent-toolkit/ai-sdk";

// Invoices go through the PayPal Agent Toolkit in the sandbox. The model never gets the send tool:
// the server only calls send_invoice after the student clicks Approve.
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
        actions: { invoices: { create: true, send: true, get: true } },
        context: { sandbox: (process.env.PAYPAL_ENVIRONMENT ?? "SANDBOX").toUpperCase() !== "PRODUCTION" },
      },
    });
  }
  return toolkit.getTools();
}

async function run(name: "create_invoice" | "send_invoice" | "get_invoice", args: Record<string, unknown>): Promise<unknown> {
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
