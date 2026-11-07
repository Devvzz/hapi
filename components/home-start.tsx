"use client";

import Link from "next/link";
import { EDUCATION } from "@/lib/education";
import { profileIsSet } from "@/lib/profile";
import { useProfile } from "@/lib/use-profile";

export function HomeStart() {
  const [profile] = useProfile();
  if (!profileIsSet(profile)) {
    return (
      <section className="space-y-3 rounded-xl border border-teal-200 bg-white p-6">
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
      <h2 className="text-xl font-semibold">What do you want to look at?</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/universities" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-400">
          <h3 className="font-semibold text-teal-800">Universities →</h3>
          <p className="mt-1 text-sm text-slate-600">Bachelor programmes you can apply to, your real price and scholarships.</p>
        </Link>
        <Link href="/opportunities" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-400">
          <h3 className="font-semibold text-teal-800">Opportunities →</h3>
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
