import example from "@/data/example-run.json";
import { loadRun, type ResearchRun } from "@/lib/research";

// The latest Saturday run, or the saved example run when no storage is set up.
export async function GET() {
  const run = await loadRun();
  if (run) return Response.json(run);
  return Response.json({ ...(example as ResearchRun), example: true });
}
