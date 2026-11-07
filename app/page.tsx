import { HomeStart } from "@/components/home-start";
import { WhatsChanged } from "@/components/whats-changed";
import { opportunities, programs } from "@/lib/data";

export default function Home() {
  const universities = new Set(programs.map((p) => p.universityId)).size;
  return (
    <div className="space-y-10">
      <section className="space-y-4 pt-6">
        <h1 className="text-4xl font-bold tracking-tight">Hapi – your next step abroad</h1>
        <p className="max-w-2xl text-lg text-slate-600">
          Students miss most chances not because they are not good enough, but because the information is spread over hundreds of sites.
          Hapi puts it in one place, with the dates, the real costs and who can help pay.
        </p>
        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">{opportunities.length} checked opportunities</span>
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">{programs.length} bachelor programmes</span>
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">{universities} universities</span>
        </div>
      </section>
      <HomeStart />
      <WhatsChanged />
    </div>
  );
}
