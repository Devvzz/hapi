"use client";

import Link from "next/link";
import { useMemo } from "react";
import { opportunities, programs } from "@/lib/data";
import { EDUCATION, diplomaLabel } from "@/lib/education";
import { checkProgram } from "@/lib/eligibility";
import { matchOpportunity } from "@/lib/match";
import { useNow } from "@/lib/storage";
import { useProfile } from "@/lib/use-profile";
import { capitalizeName, useUser } from "@/lib/user";

const euro = (n: number | null | undefined) => (n == null ? "No limit" : n === 0 ? "Free only" : `€${n.toLocaleString("en-GB")}`);

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5f6675]">{label}</p>
      <p className="line-clamp-2 text-sm font-bold leading-snug text-[#0e1b2e]">{value || "Not set"}</p>
    </div>
  );
}

// The profile as a boarding pass next to the form. It updates while the student types
// and shows how much of Hapi is open to them right now.
export function ProfilePass() {
  const [profile] = useProfile();
  const [user] = useUser();
  const now = useNow();

  const counts = useMemo(() => {
    if (!now) return null;
    const progs = programs.filter((p) => checkProgram(p, profile).status === "ok").length;
    const opps = opportunities.filter((o) => matchOpportunity(o, profile, now).verdict === "fits").length;
    return { progs, opps };
  }, [profile, now]);

  const school = EDUCATION.find((e) => e.value === profile.schoolType)?.label.split(" (")[0] ?? "";
  const langs = profile.languages.map((l) => `${l.language} ${l.level}`).join(", ");

  return (
    <aside className="lg:sticky lg:top-24" aria-label="Your profile at a glance">
      <div className="overflow-hidden rounded-2xl border border-[#e4e0d7] bg-white shadow-[0_18px_40px_-20px_rgba(14,27,46,0.35)]">
        <div className="flex items-center justify-between bg-[#1f5eff] px-5 py-3 text-white">
          <span className="text-xs font-bold uppercase tracking-[0.2em]">Hapi pass</span>
          <span className="text-xs font-semibold text-white">Student</span>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5f6675]">Passenger</p>
            <p className="font-display text-2xl font-extrabold leading-tight text-[#0e1b2e]">{capitalizeName(user.name) || "You"}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label="Passport" value={profile.nationality} />
            <Field label="Age" value={profile.age ? String(profile.age) : ""} />
            <Field label="Now" value={school} />
            <Field label="Diploma" value={profile.diploma ? diplomaLabel(profile.diploma) : ""} />
            <Field label="Budget a year" value={euro(profile.budgetPerYear)} />
            <Field label="Per opportunity" value={euro(profile.opportunityBudget)} />
          </div>
          <Field label="Languages" value={langs} />
        </div>
        <div className="relative border-t-2 border-dashed border-[#e4e0d7]">
          <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full border border-[#e4e0d7] bg-[#f7f5f0]" />
          <span className="absolute -right-2 -top-2 h-4 w-4 rounded-full border border-[#e4e0d7] bg-[#f7f5f0]" />
        </div>
        <div className="grid grid-cols-2 divide-x divide-[#e4e0d7]">
          <Link href="/universities" className="group p-4 text-center transition hover:bg-[#f2f5ff]">
            <p className="font-display text-3xl font-extrabold text-[#1f5eff]">{counts ? counts.progs : "…"}</p>
            <p className="text-xs text-[#4a5161] group-hover:text-[#0e1b2e]">programmes open to you</p>
          </Link>
          <Link href="/opportunities" className="group p-4 text-center transition hover:bg-[#f2f5ff]">
            <p className="font-display text-3xl font-extrabold text-[#dc4a14]">{counts ? counts.opps : "…"}</p>
            <p className="text-xs text-[#4a5161] group-hover:text-[#0e1b2e]">opportunities that fit</p>
          </Link>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">Updates while you edit the form</p>
    </aside>
  );
}
