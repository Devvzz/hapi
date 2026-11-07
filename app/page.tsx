import Link from "next/link";
import { WhatsChanged } from "@/components/whats-changed";
import { opportunities, programs } from "@/lib/data";

const STEPS = [
  { href: "/profile", title: "1. Tell Hapi about you", text: "Age, country, school, languages, budget and what you are into." },
  { href: "/opportunities", title: "2. Find opportunities", text: "Hackathons, scholarships, certificates, internships and more, free and paid, with every date and the real price." },
  { href: "/universities", title: "3. Check universities", text: "See which bachelor programmes you can really apply to, and why." },
  { href: "/plan", title: "4. Plan the money", text: "Add costs to one plan, then ask family to sponsor a cost with a PayPal invoice you approve first." },
];

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
      <section className="grid gap-4 sm:grid-cols-2">
        {STEPS.map((s) => (
          <Link key={s.href} href={s.href} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-400">
            <h2 className="font-semibold text-teal-800">{s.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{s.text}</p>
          </Link>
        ))}
      </section>
      <WhatsChanged />
    </div>
  );
}
