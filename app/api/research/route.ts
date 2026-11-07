import { runResearch, saveRun } from "@/lib/research";

// Called by Vercel Cron every Saturday (see vercel.json). Vercel sends "Authorization: Bearer <CRON_SECRET>".
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const run = await runResearch();
  const saved = await saveRun(run).catch(() => false);
  return Response.json({ ...run, saved });
}
