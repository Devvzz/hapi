"use client";

import Link from "next/link";
import { EMPTY_PROFILE, INTERESTS, LEVELS, STORAGE } from "@/lib/profile";
import { useStored } from "@/lib/storage";
import type { LanguageSkill, Profile } from "@/lib/types";

const LANGUAGE_OPTIONS = ["English", "German", "Italian", "French", "Spanish", "Albanian", "Greek", "Turkish"];

export function ProfileForm() {
  const [profile, setProfile] = useStored(STORAGE.profile, EMPTY_PROFILE);
  const update = (patch: Partial<Profile>) => setProfile({ ...profile, ...patch });

  function setLanguage(i: number, patch: Partial<LanguageSkill>) {
    update({ languages: profile.languages.map((l, j) => (j === i ? { ...l, ...patch } : l)) });
  }

  return (
    <form className="max-w-2xl space-y-5 rounded-xl border border-slate-200 bg-white p-5 text-sm" onSubmit={(e) => e.preventDefault()}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="font-medium">Nationality</span>
          <input className="w-full rounded border border-slate-300 px-2 py-1" placeholder="e.g. Albania" value={profile.nationality} onChange={(e) => update({ nationality: e.target.value })} />
        </label>
        <label className="space-y-1">
          <span className="font-medium">Age</span>
          <input className="w-full rounded border border-slate-300 px-2 py-1" type="number" min={10} max={99} value={profile.age ?? ""} onChange={(e) => update({ age: e.target.value ? Number(e.target.value) : null })} />
        </label>
        <label className="space-y-1">
          <span className="font-medium">School</span>
          <select className="w-full rounded border border-slate-300 px-2 py-1" value={profile.schoolType} onChange={(e) => update({ schoolType: e.target.value as Profile["schoolType"] })}>
            <option value="secondary">Secondary school</option>
            <option value="austrian-school-abroad">Austrian school abroad</option>
            <option value="university">University</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="font-medium">Budget per year (EUR, tuition and fees)</span>
          <input className="w-full rounded border border-slate-300 px-2 py-1" type="number" min={0} value={profile.budgetPerYear ?? ""} onChange={(e) => update({ budgetPerYear: e.target.value ? Number(e.target.value) : null })} />
        </label>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input type="checkbox" checked={profile.student} onChange={(e) => update({ student: e.target.checked })} />
          I am currently a student
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="font-medium">Languages</legend>
        {profile.languages.map((l, i) => (
          <div key={i} className="flex gap-2">
            <select className="rounded border border-slate-300 px-2 py-1" value={l.language} onChange={(e) => setLanguage(i, { language: e.target.value })}>
              {LANGUAGE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <select className="rounded border border-slate-300 px-2 py-1" value={l.level} onChange={(e) => setLanguage(i, { level: e.target.value as LanguageSkill["level"] })}>
              {LEVELS.map((lv) => <option key={lv}>{lv}</option>)}
            </select>
            <button type="button" className="text-rose-700" onClick={() => update({ languages: profile.languages.filter((_, j) => j !== i) })}>Remove</button>
          </div>
        ))}
        <button type="button" className="text-teal-700" onClick={() => update({ languages: [...profile.languages, { language: "German", level: "B1" }] })}>+ Add language</button>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="font-medium">Interests</legend>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => {
            const on = profile.interests.includes(i.label);
            return (
              <button type="button" key={i.label} onClick={() => update({ interests: on ? profile.interests.filter((x) => x !== i.label) : [...profile.interests, i.label] })}
                className={`rounded-full border px-3 py-1 ${on ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300"}`}>
                {i.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <p className="text-xs text-slate-500">Saved automatically in this browser only. Nothing is sent to a server until you ask the AI for an explanation.</p>
      <div className="flex gap-3">
        <Link href="/opportunities" className="rounded bg-teal-700 px-3 py-1.5 text-white">See my opportunities</Link>
        <Link href="/universities" className="rounded border border-teal-700 px-3 py-1.5 text-teal-800">Check universities</Link>
        <button type="button" className="ml-auto text-slate-500" onClick={() => setProfile(EMPTY_PROFILE)}>Reset</button>
      </div>
    </form>
  );
}
