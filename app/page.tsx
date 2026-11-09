import { BoardingPasses } from "@/components/boarding-passes";
import { DepartureBoard } from "@/components/departure-board";
import { HomeStart } from "@/components/home-start";
import { Reminders } from "@/components/reminders";
import { Survey } from "@/components/survey";
import { WhatsChanged } from "@/components/whats-changed";
import { opportunities, programs } from "@/lib/data";

export default function Home() {
  const universities = new Set(programs.map((p) => p.universityId)).size;
  const countries = new Set(programs.map((p) => p.country)).size;
  const rows = [
    { label: "Opportunities", value: String(opportunities.length), note: "hackathons, schools, scholarships" },
    { label: "Programmes", value: String(programs.length), note: "bachelor, with real fees" },
    { label: "Universities", value: String(universities), note: `in ${countries} countries` },
    { label: "Cost to use", value: "€0", note: "free, no ads" },
  ];
  return (
    <div className="space-y-14">
      <section className="relative grid items-center gap-12 pt-6 md:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          <p className="inline-block -rotate-2 rounded-md bg-[#fcd34d] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#1a1300] shadow-[3px_3px_0_#0e1b2e]">
            Built by a student, for students
          </p>
          <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
            Your next step{" "}
            <span className="relative inline-block whitespace-nowrap">
              abroad
              <svg viewBox="0 0 200 20" preserveAspectRatio="none" className="scribble absolute -bottom-3 left-0 h-4 w-full" aria-hidden="true">
                <path d="M3 13 C 40 4, 90 3, 130 9 S 185 15, 197 6" pathLength={1} fill="none" stroke="#ff6b3d" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </span>
            .
          </h1>
          <p className="max-w-xl text-lg text-slate-600">
            Most students miss their chances not because they are not good enough, but because the information is lost across hundreds of sites. Hapi shows what you can really apply to, what it costs, and who can help pay.
          </p>
          <p className="font-display flex flex-wrap gap-x-3 text-xl font-semibold text-slate-800">
            <span>
              Discover<span className="text-violet-400">.</span>
            </span>
            <span>
              Apply<span className="text-teal-700">.</span>
            </span>
            <span>
              Grow<span className="text-amber-700">.</span>
            </span>
          </p>
        </div>
        <div className="flex justify-center md:justify-end">
          <BoardingPasses />
        </div>
      </section>

      <Reminders />
      <Survey />

      <DepartureBoard rows={rows} />

      <HomeStart />
      <WhatsChanged />
    </div>
  );
}
