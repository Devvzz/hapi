import type { Metadata } from "next";
import Link from "next/link";
import { HapiMark } from "@/components/logo";
import { PageHero } from "@/components/ui";
import { opportunities, programs } from "@/lib/data";

export const metadata: Metadata = { title: "About – Hapi", description: "Why Hapi exists, how it works, and who built it." };

const PRINCIPLES = [
  {
    title: "Checked, with sources",
    text: "Every opportunity and programme was researched by hand and links to its official page. What is not confirmed says “check yourself”, never a guess.",
  },
  {
    title: "Rules first, AI second",
    text: "Code decides who can apply, what it costs and when it closes. The AI only explains and helps you write. It never invents a deadline or a price.",
  },
  {
    title: "Only what you can apply to",
    text: "Your nationality, age, school and budget filter everything first, so you are not shown chances that were never open to you.",
  },
  {
    title: "Family can help, safely",
    text: "Ask a relative to sponsor a cost with a PayPal invoice. Nothing is sent until you approve it yourself.",
  },
];

const STACK = ["Next.js", "TypeScript", "Tailwind CSS", "Google Gemini", "Vercel AI SDK", "PayPal Agent Toolkit", "Supabase", "AG Grid", "Vercel"];

export default function AboutPage() {
  const universities = new Set(programs.map((p) => p.universityId)).size;
  const confirmed = opportunities.filter((o) => o.eligibility.nationality).length;
  const numbers = [
    { n: opportunities.length, label: "checked opportunities" },
    { n: programs.length, label: "bachelor programmes" },
    { n: universities, label: "universities" },
    { n: confirmed, label: "nationality rules read from official pages" },
  ];

  return (
    <div className="space-y-20">
      <PageHero
        kicker="Our story"
        title="Built by a student,"
        highlight="for students."
        subtitle="Hapi exists because talent is everywhere, but information is not. It puts every chance a student can really apply to in one honest place, with the dates, the real cost and a way for family to help pay."
      >
        <div className="relative hidden h-36 w-36 items-center justify-center rounded-[2rem] border border-violet-400/40 bg-[#0b0818cc] shadow-[0_0_60px_-10px_rgba(139,92,246,0.9)] md:flex">
          <HapiMark size={96} />
        </div>
      </PageHero>

      <section className="grid items-start gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-violet-300">Why Hapi</p>
          <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">
            Opportunities should not depend on <span className="text-gradient">who you know</span>.
          </h2>
        </div>
        <div className="space-y-4 text-lg leading-relaxed text-slate-700">
          <p>
            Hapi started as my own problem. I wanted opportunities abroad but did not know where to look, and I could not pay for much. So I built a rough tool just for myself to find what fit me, mostly free of charge. It worked.
          </p>
          <p>
            Then friends started asking for it. Most young people around me had never heard that chances like these existed. There are so many students with the will to grow who are simply lost, so I turned my tool into an app that anyone can use.
          </p>
          <p className="font-display text-xl font-semibold text-white">
            Discover. Apply. <span className="text-gradient">Grow.</span>
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {numbers.map((s, i) => (
          <div key={s.label} className="welcome-in glow-card rounded-2xl border border-white/10 bg-panel p-5" style={{ animationDelay: `${i * 70}ms` }}>
            <p className="font-display text-4xl font-bold text-gradient">{s.n}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-violet-300">What makes it different</p>
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Four <span className="text-gradient">promises</span>
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {PRINCIPLES.map((p, i) => (
            <div key={p.title} className="glow-card relative overflow-hidden rounded-2xl border border-white/10 bg-panel p-6">
              <span className="font-display absolute -right-2 -top-6 text-8xl font-extrabold text-white/[0.04]">0{i + 1}</span>
              <h3 className="font-display text-xl font-semibold text-white">{p.title}</h3>
              <p className="mt-2 text-slate-600">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-panel p-6">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-violet-300">How it is built</p>
          <p className="text-slate-700">
            The data was researched before the build and checked against official pages. The app was built in November 2026, solo, assisted by AI in coding. All code is open source on GitHub under the MIT license.
          </p>
          <div className="flex flex-wrap gap-2">
            {STACK.map((t) => (
              <span key={t} className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-sm text-violet-200">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border border-white/10 bg-panel p-6">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-violet-300">Your data</p>
          <ul className="space-y-2 text-slate-700">
            <li>Without an account, everything stays in your browser.</li>
            <li>With an account, your data is saved in one private row that only you can read.</li>
            <li>Reviews and comments show your first name only.</li>
            <li>PayPal runs in sandbox mode for now: no real money moves.</li>
          </ul>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[1.5rem] border border-violet-400/30 bg-gradient-to-br from-violet-600/20 via-[#0b0818] to-cyan-500/10 p-8 text-center sm:p-12">
        <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-[60%] -translate-x-1/2 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="relative space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-violet-300">Made by</p>
          <h2 className="text-3xl font-extrabold sm:text-4xl">Devis Hila</h2>
          <p className="mx-auto max-w-xl text-slate-600">Founder and developer. No team, no investors, just the idea that every student deserves to see their options.</p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/profile" className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white">
              Find my next step
            </Link>
            <a href="https://github.com/Devvzz/hapi" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/15 px-5 py-2.5 text-sm hover:border-violet-400/60">
              Source code on GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
