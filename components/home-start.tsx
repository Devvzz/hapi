"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { EDUCATION } from "@/lib/education";
import { profileIsSet } from "@/lib/profile";
import { useProfile } from "@/lib/use-profile";
import { useUser } from "@/lib/user";

// Line art for the Universities card: a globe whose orbit swings round on hover.
function GlobeArt() {
  const base = { fill: "none", strokeWidth: 1.4, strokeLinecap: "round" as const };
  const draw = (d: string, delay = 0) => <path d={d} pathLength={1} className="art-draw" stroke="url(#uniGrad)" {...base} strokeWidth={2} style={{ transitionDelay: `${delay}ms` }} />;
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24 shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id="uniGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#1f5eff" />
          <stop offset="1" stopColor="#ff6b3d" />
        </linearGradient>
      </defs>
      <g stroke="rgb(14 27 46 / 0.18)" {...base}>
        <circle cx="60" cy="60" r="32" />
        <ellipse cx="60" cy="60" rx="14" ry="32" />
        <path d="M28 60h64M33 44h54M33 76h54" />
      </g>
      {draw("M60 28a32 32 0 1 1 0 64a32 32 0 1 1 0-64")}
      {draw("M60 28c-18 9-18 55 0 64c18-9 18-55 0-64", 200)}
      {draw("M28 60h64", 400)}
      <g className="art-orbit">
        <ellipse cx="60" cy="60" rx="52" ry="15" transform="rotate(-22 60 60)" stroke="rgb(255 107 61 / 0.5)" {...base} />
        <circle cx="108" cy="41" r="3.5" fill="#ff6b3d" />
      </g>
      <circle className="art-dot" cx="48" cy="46" r="2.5" fill="#1f5eff" style={{ transitionDelay: "500ms" }} />
      <circle className="art-dot" cx="74" cy="70" r="2.5" fill="#ff6b3d" style={{ transitionDelay: "700ms" }} />
    </svg>
  );
}

// Line art for the Opportunities card: a rising path that lights up its stops on hover.
function RiseArt() {
  const points: [number, number][] = [[14, 96], [38, 72], [58, 82], [80, 50], [100, 26]];
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24 shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id="oppGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#1f5eff" />
          <stop offset="1" stopColor="#ff6b3d" />
        </linearGradient>
      </defs>
      <g stroke="rgb(14 27 46 / 0.14)" strokeWidth="1" fill="none">
        <path d="M14 104h92M14 104V16" />
        <path d="M14 80h92M14 56h92M14 32h92" strokeDasharray="2 5" />
      </g>
      <polyline points={points.map((p) => p.join(",")).join(" ")} fill="none" stroke="rgb(14 27 46 / 0.2)" strokeWidth="1.4" strokeLinejoin="round" />
      <polyline points={points.map((p) => p.join(",")).join(" ")} pathLength={1} className="art-draw" fill="none" stroke="url(#oppGrad)" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M100 26l-12 3 7 7z" fill="#ff6b3d" className="art-dot" style={{ transitionDelay: "1100ms" }} />
      {points.slice(0, 4).map(([x, y], i) => (
        <circle key={i} className="art-dot" cx={x} cy={y} r="3.2" fill={i % 2 ? "#ff6b3d" : "#1f5eff"} style={{ transitionDelay: `${250 + i * 220}ms` }} />
      ))}
      <path className="art-dot" d="M92 70l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#1f5eff" style={{ transitionDelay: "1200ms" }} />
    </svg>
  );
}

function ChoiceCard({ href, title, text, art, cta }: { href: string; title: string; text: string; art: ReactNode; cta: string }) {
  function track(e: MouseEvent<HTMLAnchorElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
  }
  return (
    <Link href={href} onMouseMove={track} className="choice-card flex flex-col items-start gap-4 rounded-[1.25rem] sm:flex-row sm:items-center sm:gap-5 border border-slate-200 bg-panel p-6">
      {art}
      <div className="min-w-0 space-y-1.5">
        <h3 className="font-display text-xl font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{text}</p>
        <p className="go inline-block pt-1 text-sm font-medium text-violet-300">{cta} →</p>
      </div>
    </Link>
  );
}

export function HomeStart() {
  const [profile] = useProfile();
  const [user] = useUser();
  if (!profileIsSet(profile)) {
    return (
      <section className="space-y-3 rounded-2xl border border-violet-400/30 bg-panel p-6 ">
        <h2 className="text-xl font-semibold">{user.name ? `${user.name}, start with your profile` : "Start with your profile"}</h2>
        <p className="text-sm text-slate-600">Nationality, age, school, languages and budget. Then Hapi shows only what you can really apply to.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/profile" className="rounded bg-teal-700 px-4 py-2 text-sm font-medium text-white">
            Set up my profile
          </Link>
          <Link href="/?demo=1" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm">
            Try it with a sample student
          </Link>
        </div>
      </section>
    );
  }
  const stage = EDUCATION.find((e) => e.value === profile.schoolType)?.label ?? "";
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-2xl font-bold">{user.name ? `${user.name}, what are you looking for?` : "What are you looking for?"}</h2>
        <p className="text-xs text-slate-500">
          {profile.nationality} · {profile.age} · {stage.toLowerCase()} ·{" "}
          <Link href="/profile" className="text-violet-300 underline underline-offset-2 hover:text-teal-800">
            edit profile
          </Link>
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ChoiceCard href="/universities" title="Universities" text="Bachelor programmes you can apply to, the fee you would pay, entry tests and scholarships." art={<GlobeArt />} cta="Explore universities" />
        <ChoiceCard href="/opportunities" title="Opportunities" text="Hackathons, competitions, exchanges, internships, certificates and events you can join." art={<RiseArt />} cta="Explore opportunities" />
      </div>
      <p className="text-sm text-slate-600">
        Then plan the money in your{" "}
        <Link href="/plan" className="text-violet-300 underline underline-offset-2 hover:text-teal-800">
          cost plan
        </Link>{" "}
        and keep every date in your{" "}
        <Link href="/calendar" className="text-violet-300 underline underline-offset-2 hover:text-teal-800">
          calendar
        </Link>
        .
      </p>
    </section>
  );
}
