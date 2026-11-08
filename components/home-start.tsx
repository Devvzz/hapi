"use client";

import Link from "next/link";
import { EDUCATION } from "@/lib/education";
import { profileIsSet } from "@/lib/profile";
import { useProfile } from "@/lib/use-profile";

export function HomeStart() {
  const [profile] = useProfile();
  if (!profileIsSet(profile)) {
    return (
      <section className="space-y-3 rounded-2xl border border-violet-400/30 bg-panel p-6 shadow-[0_0_40px_-15px_rgba(139,92,246,0.8)]">
        <h2 className="text-xl font-semibold">Start with your profile</h2>
        <p className="text-sm text-slate-600">Nationality, age, school, languages and budget. Then Hapi shows only what you can really apply to.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/profile" className="rounded bg-teal-700 px-4 py-2 text-sm font-medium text-white">
            Set up my profile
          </Link>
          <Link href="/?demo=1" className="rounded border border-slate-300 px-4 py-2 text-sm">
            Try it with a sample student
          </Link>
        </div>
      </section>
    );
  }
  const stage = EDUCATION.find((e) => e.value === profile.schoolType)?.label ?? "";
  return (
    <section className="space-y-3">
      <p className="text-sm text-slate-600">
        Your profile: {profile.nationality}, {profile.age}, {stage.toLowerCase()} ·{" "}
        <Link href="/profile" className="text-teal-700 underline">
          edit
        </Link>
      </p>
      <h2 className="text-2xl font-bold">Where do you want to go?</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/universities" className="glow-card rounded-2xl border border-white/10 bg-panel p-6">
          <h3 className="font-display text-lg font-semibold text-white">🎓 Universities <span className="text-violet-300">→</span></h3>
          <p className="mt-1 text-sm text-slate-600">Bachelor programmes you can apply to, your real price and scholarships.</p>
        </Link>
        <Link href="/opportunities" className="glow-card rounded-2xl border border-white/10 bg-panel p-6">
          <h3 className="font-display text-lg font-semibold text-white">🚀 Opportunities <span className="text-violet-300">→</span></h3>
          <p className="mt-1 text-sm text-slate-600">Hackathons, competitions, exchanges, internships, certificates and events you can join.</p>
        </Link>
      </div>
      <p className="text-sm text-slate-600">
        Then put the costs in your{" "}
        <Link href="/plan" className="text-teal-700 underline">
          cost plan
        </Link>{" "}
        and let family sponsor them with PayPal.
      </p>
    </section>
  );
}
