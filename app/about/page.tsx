import type { Metadata } from "next";
import Link from "next/link";
import { DepartureBoard } from "@/components/departure-board";
import { PassportStamps } from "@/components/passport-stamps";
import { PageHero } from "@/components/ui";
import { opportunities, programs } from "@/lib/data";

export const metadata: Metadata = { title: "About – Hapi", description: "Why Hapi exists, how it works, and who built it." };

const PRINCIPLES = [
  {
    icon: <path d="M9 12l2 2 4-4M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />,
    tone: "bg-emerald-400 text-emerald-300",
    title: "Checked, with sources",
    text: "Every opportunity and programme was researched by hand and links to its official page. What is not confirmed says “check yourself”, never a guess.",
  },
  {
    icon: <path d="M4 6h16M4 12h10M4 18h6M17 14l3 3-3 3" />,
    tone: "bg-cyan-400 text-cyan-300",
    title: "Rules first, AI second",
    text: "Code decides who can apply, what it costs and when it closes. The AI only explains and helps you write. It never invents a deadline or a price.",
  },
  {
    icon: <path d="M4 5h16l-6 8v6l-4-2v-4z" />,
    tone: "bg-violet-400 text-violet-300",
    title: "Only what you can apply to",
    text: "Your nationality, age, school and budget filter everything first, so you are not shown chances that were never open to you.",
  },
  {
    icon: <path d="M12 20s-7-4.4-9.2-8.6C1.3 8.5 3 5 6.4 5c2 0 3.3 1.1 4 2.3h3.2C14.3 6.1 15.6 5 17.6 5 21 5 22.7 8.5 21.2 11.4 19 15.6 12 20 12 20z" />,
    tone: "bg-amber-400 text-[#fcd34d]",
    title: "Family can help, safely",
    text: "Ask a relative to sponsor a cost with a PayPal invoice. Nothing is sent until you approve it yourself.",
  },
];

const STACK = ["Next.js", "TypeScript", "Tailwind CSS", "Google Gemini", "Vercel AI SDK", "PayPal Agent Toolkit", "Supabase", "AG Grid", "Vercel"];

export default function AboutPage() {
  const universities = new Set(programs.map((p) => p.universityId)).size;
  const confirmed = opportunities.filter((o) => o.eligibility.nationality).length;
  const numbers = [
    { label: "Opportunities", value: String(opportunities.length), note: "checked by hand" },
    { label: "Programmes", value: String(programs.length), note: "bachelor, with real fees" },
    { label: "Universities", value: String(universities), note: "official pages only" },
    { label: "Nationality rules", value: String(confirmed), note: "read from the source" },
  ];

  return (
    <div className="space-y-20">
      <PageHero
        kicker="Our story"
        title="Built by a student,"
        highlight="for students."
        subtitle="Hapi exists because talent is everywhere, but information is not. It puts every chance a student can really apply to in one honest place, with the dates, the real cost and a way for family to help pay."
      >
        <div className="hidden md:block">
          <PassportStamps />
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

      <DepartureBoard rows={numbers} />

      <section className="space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-violet-300">What makes it different</p>
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Four <span className="text-gradient">promises</span>
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="promise relative flex gap-4 overflow-hidden rounded-2xl border border-white/10 bg-panel p-6 hover:border-white/25">
              <span className={`edge absolute left-0 top-0 h-10 w-1 ${p.tone.split(" ")[0]}`} />
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] ${p.tone.split(" ")[1]}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {p.icon}
                </svg>
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-slate-600">{p.text}</p>
              </div>
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
            <li>For the statistics page, Hapi counts actions anonymously: only what kind of action it was and your country, never your name, email or account.</li>
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
            <Link href="/stats" className="rounded-xl border border-white/15 px-5 py-2.5 text-sm hover:border-violet-400/60">
              Hapi in numbers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
