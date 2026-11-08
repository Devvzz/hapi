import { HomeStart } from "@/components/home-start";
import { HapiMark } from "@/components/logo";
import { WhatsChanged } from "@/components/whats-changed";
import { opportunities, programs } from "@/lib/data";

export default function Home() {
  const universities = new Set(programs.map((p) => p.universityId)).size;
  const stats = [
    { n: opportunities.length, label: "checked opportunities" },
    { n: programs.length, label: "bachelor programmes" },
    { n: universities, label: "universities" },
    { n: "€0", label: "to use Hapi" },
  ];
  return (
    <div className="space-y-14">
      <section className="relative grid items-center gap-10 pt-6 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-violet-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />
            Built by a student, for students
          </p>
          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Your next step <span className="text-gradient">abroad</span>.
          </h1>
          <p className="max-w-xl text-lg text-slate-600">
            Most students miss their chances not because they are not good enough, but because the information is lost across hundreds of sites. Hapi shows what you can really apply to, what it costs, and who can help pay.
          </p>
          <p className="font-display text-xl font-semibold tracking-wide text-slate-800">
            Discover. Apply. <span className="text-gradient">Grow.</span>
          </p>
        </div>
        <div className="relative mx-auto hidden aspect-square w-full max-w-xs md:block">
          <div className="absolute inset-6 rounded-[2.5rem] bg-gradient-to-br from-violet-600/40 via-indigo-500/20 to-cyan-400/30 blur-3xl" />
          <div className="relative flex h-full items-center justify-center rounded-[2.5rem] border border-violet-400/40 bg-[#0b0818cc] shadow-[0_0_60px_-10px_rgba(139,92,246,0.8),inset_0_0_40px_rgba(139,92,246,0.15)]">
            <HapiMark size={170} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glow-card rounded-2xl border border-white/10 bg-panel p-4">
            <p className="font-display text-3xl font-bold text-gradient">{s.n}</p>
            <p className="text-xs uppercase tracking-wider text-slate-500">{s.label}</p>
          </div>
        ))}
      </section>

      <HomeStart />
      <WhatsChanged />
    </div>
  );
}
