import { runResearch, saveRun } from "@/lib/research";
import { count } from "@/lib/track";

// Called by Vercel Cron every Saturday (see vercel.json). Vercel sends "Authorization: Bearer <CRON_SECRET>".
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const run = await runResearch();
  const saved = await saveRun(run).catch(() => false);
  // Count every check for the statistics page. This also keeps the free Supabase project awake.
  await Promise.all(run.checked.map((c) => count("ai_check", c.change ?? "confirmed")));
  return Response.json({ ...run, saved });
}
