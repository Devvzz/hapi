import type { Metadata } from "next";
import { LiveStats } from "@/components/live-stats";
import { PageHero } from "@/components/ui";
import { opportunities, programs } from "@/lib/data";

export const metadata: Metadata = { title: "Hapi in numbers", description: "How many students use Hapi, from where, what they save, and what the weekly AI job found." };

export default function StatsPage() {
  const free = opportunities.filter((o) => o.costType === "free").length;
  const travel = opportunities.filter((o) => o.travelPaid === "full" || o.travelPaid === "partial").length;
  const withDeadline = opportunities.filter((o) => o.deadline).length;
  const byType = Object.entries(
    opportunities.reduce<Record<string, number>>((m, o) => {
      m[o.type] = (m[o.type] ?? 0) + 1;
      return m;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const universities = new Set(programs.map((p) => p.universityId)).size;
  const countries = new Set(programs.map((p) => p.country)).size;
  const nationalityChecked = opportunities.filter((o) => o.eligibility.nationality).length;

  return (
    <div className="space-y-10">
      <PageHero
        kicker="Hapi in numbers"
        title="What Hapi"
        highlight="does"
        subtitle="Live numbers about the data, the people who use Hapi and the AI that keeps the dates right. Usage is counted anonymously: only the kind of action and a country, never a name or email."
      />

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold text-slate-900">Opportunities</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { n: opportunities.length, l: "in the database" },
            { n: free, l: "free to take part" },
            { n: travel, l: "with travel fully or partly paid" },
            { n: nationalityChecked, l: "nationality rules read from the official page" },
          ].map((t) => (
            <div key={t.l} className="rounded-2xl border border-slate-200 bg-panel p-4">
              <p className="font-display text-3xl font-bold text-slate-900">{t.n}</p>
              <p className="text-sm text-slate-600">{t.l}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-x-8 gap-y-2 rounded-2xl border border-slate-200 bg-panel p-5 sm:grid-cols-2">
          {byType.map(([type, n]) => (
            <div key={type} className="flex items-center gap-3 text-sm">
              <span className="w-36 shrink-0 capitalize text-slate-900">{type.replace("-", " ")}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span className="block h-full rounded-full bg-teal-700" style={{ width: `${(n / byType[0][1]) * 100}%` }} />
              </span>
              <span className="w-8 text-right text-slate-600">{n}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-600">
          Plus {programs.length} bachelor programmes at {universities} universities in {countries} countries. {withDeadline} opportunities have a confirmed deadline; the rest are open all year or not announced yet.
        </p>
      </section>

      <LiveStats />
    </div>
  );
}
