"use client";

import { useState } from "react";
import Link from "next/link";
import { resolveCountry, suggestCountries } from "@/lib/countries";
import { DIPLOMAS, EDUCATION } from "@/lib/education";
import { EMPTY_PROFILE, INTERESTS, LEVELS, profileIsSet } from "@/lib/profile";
import { useProfile } from "@/lib/use-profile";
import type { LanguageSkill, Profile } from "@/lib/types";

const LANGUAGE_OPTIONS = [
  "English", "German", "Italian", "French", "Spanish", "Albanian", "Greek", "Turkish", "Serbian", "Croatian", "Bosnian",
  "Macedonian", "Montenegrin", "Bulgarian", "Romanian", "Slovenian", "Hungarian", "Polish", "Czech", "Slovak", "Ukrainian",
  "Russian", "Dutch", "Portuguese", "Swedish", "Norwegian", "Danish", "Finnish", "Estonian", "Latvian", "Lithuanian",
  "Arabic", "Chinese", "Japanese", "Korean", "Hindi", "Urdu", "Persian", "Hebrew",
];
const LEVEL_LABEL: Record<string, string> = { A1: "A1 beginner", A2: "A2", B1: "B1", B2: "B2", C1: "C1 advanced", C2: "C2 / native" };

const TUITION_PRESETS: { label: string; value: number | null }[] = [
  { label: "Free only", value: 0 },
  { label: "€1,000", value: 1000 },
  { label: "€3,000", value: 3000 },
  { label: "€5,000", value: 5000 },
  { label: "€10,000", value: 10000 },
  { label: "€20,000", value: 20000 },
  { label: "No limit", value: null },
];
const OPPORTUNITY_PRESETS: { label: string; value: number | null }[] = [
  { label: "Free only", value: 0 },
  { label: "€50", value: 50 },
  { label: "€200", value: 200 },
  { label: "€500", value: 500 },
  { label: "€1,000", value: 1000 },
  { label: "No limit", value: null },
];

function MoneyField(props: { label: string; hint: string; value: number | null; presets: typeof TUITION_PRESETS; onChange: (v: number | null) => void }) {
  const [text, setText] = useState(props.value === null ? "" : String(props.value));
  const [prev, setPrev] = useState(props.value);
  if (prev !== props.value) {
    setPrev(props.value);
    setText(props.value === null ? "" : String(props.value));
  }
  return (
    <div className="space-y-1 sm:col-span-2">
      <span className="font-medium">{props.label}</span>
      <p className="text-xs text-slate-500">{props.hint}</p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded border border-slate-300 px-2 py-1">
          <span className="text-slate-500">€</span>
          <input
            className="w-28 px-1 outline-none"
            inputMode="numeric"
            placeholder="no limit"
            value={text}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^\d]/g, "");
              setText(digits);
              props.onChange(digits ? Number(digits) : null);
            }}
          />
        </div>
        {props.presets.map((p) => (
          <button
            type="button"
            key={p.label}
            onClick={() => props.onChange(p.value)}
            className={`rounded-full border px-3 py-0.5 text-xs ${props.value === p.value ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300"}`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function NationalityField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setText(value);
  }
  const confirmed = value !== "" && text === value;
  const suggestions = confirmed ? [] : suggestCountries(text);

  function commit(country: string) {
    setText(country);
    onChange(country);
  }

  return (
    <div className="space-y-1">
      <span className="font-medium">Nationality (passport)</span>
      <input
        className="w-full rounded border border-slate-300 px-2 py-1"
        placeholder="Start typing, e.g. Albania"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (!e.target.value) onChange("");
        }}
        onBlur={() => {
          const c = resolveCountry(text);
          if (c && suggestions[0] === c) commit(c);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && suggestions[0]) {
            e.preventDefault();
            commit(suggestions[0]);
          }
        }}
      />
      {confirmed && <p className="text-xs text-emerald-700">✓ {value}</p>}
      {!confirmed && text && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 text-xs">
          <span className="text-slate-500">Did you mean</span>
          {suggestions.map((s) => (
            <button type="button" key={s} onMouseDown={(e) => e.preventDefault()} onClick={() => commit(s)} className="rounded-full border border-teal-700 px-2 text-teal-800">
              {s}
            </button>
          ))}
        </div>
      )}
      {!confirmed && text.length > 2 && suggestions.length === 0 && <p className="text-xs text-amber-700">Country not found. Check the spelling.</p>}
    </div>
  );
}

export function ProfileForm() {
  const [profile, setProfile] = useProfile();
  const update = (patch: Partial<Profile>) => setProfile({ ...profile, ...patch });

  function setLanguage(i: number, patch: Partial<LanguageSkill>) {
    update({ languages: profile.languages.map((l, j) => (j === i ? { ...l, ...patch } : l)) });
  }
  const unusedLanguage = LANGUAGE_OPTIONS.find((o) => !profile.languages.some((l) => l.language === o)) ?? "German";
  const ready = profileIsSet(profile);

  return (
    <form className="max-w-2xl space-y-6 rounded-xl border border-slate-200 bg-panel p-5 text-sm" onSubmit={(e) => e.preventDefault()}>
      <div className="grid gap-4 sm:grid-cols-2">
        <NationalityField value={profile.nationality} onChange={(nationality) => update({ nationality })} />
        <label className="space-y-1">
          <span className="font-medium">Age</span>
          <input
            className="w-full rounded border border-slate-300 px-2 py-1"
            inputMode="numeric"
            placeholder="e.g. 17"
            value={profile.age ?? ""}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^\d]/g, "").slice(0, 2);
              update({ age: digits ? Number(digits) : null });
            }}
          />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="font-medium">Where are you now?</span>
          <select className="w-full rounded border border-slate-300 px-2 py-1" value={profile.schoolType} onChange={(e) => update({ schoolType: e.target.value })}>
            {EDUCATION.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="font-medium">Which school-leaving diploma will you have?</span>
          <select
            className="w-full rounded border border-slate-300 px-2 py-1"
            value={profile.diploma ?? "national"}
            onChange={(e) => update({ diploma: e.target.value, austrianSchool: e.target.value === "austrian-matura" })}
          >
            {DIPLOMAS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <span className="block text-xs text-slate-500">If you already finished school, pick the one you have. Some universities treat diplomas from their own schools abroad like local ones.</span>
        </label>
        <MoneyField
          label="University budget per year"
          hint="Tuition and fees you can pay per year. Living costs are planned separately."
          value={profile.budgetPerYear}
          presets={TUITION_PRESETS}
          onChange={(budgetPerYear) => update({ budgetPerYear })}
        />
        <MoneyField
          label="Most you can pay for one opportunity"
          hint="Entry fees, exam fees and travel for one hackathon, course, exam or event."
          value={profile.opportunityBudget ?? null}
          presets={OPPORTUNITY_PRESETS}
          onChange={(opportunityBudget) => update({ opportunityBudget })}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="font-medium">Languages</legend>
        {profile.languages.map((l, i) => (
          <div key={i} className="flex flex-wrap gap-2">
            <select className="rounded border border-slate-300 px-2 py-1" value={l.language} onChange={(e) => setLanguage(i, { language: e.target.value })}>
              {LANGUAGE_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <select className="rounded border border-slate-300 px-2 py-1" value={l.level} onChange={(e) => setLanguage(i, { level: e.target.value as LanguageSkill["level"] })}>
              {LEVELS.map((lv) => (
                <option key={lv} value={lv}>
                  {LEVEL_LABEL[lv]}
                </option>
              ))}
            </select>
            <button type="button" className="text-rose-700" onClick={() => update({ languages: profile.languages.filter((_, j) => j !== i) })}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="text-teal-700" onClick={() => update({ languages: [...profile.languages, { language: unusedLanguage, level: "B1" }] })}>
          + Add language
        </button>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="font-medium">Interests</legend>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => {
            const on = profile.interests.includes(i.label);
            return (
              <button
                type="button"
                key={i.label}
                onClick={() => update({ interests: on ? profile.interests.filter((x) => x !== i.label) : [...profile.interests, i.label] })}
                className={`rounded-full border px-3 py-1 ${on ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300"}`}
              >
                {i.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <p className="text-xs text-slate-500">Saved automatically in this browser only. Nothing is sent to a server until you ask the AI for help.</p>

      {ready ? (
        <div className="space-y-2">
          <p className="font-medium">Profile ready. What do you want to look at?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/universities" className="rounded-lg border border-teal-700 p-3 hover:bg-teal-50">
              <span className="font-semibold text-teal-800">Universities →</span>
              <span className="block text-xs text-slate-600">Programmes you can apply to, your real price, scholarships</span>
            </Link>
            <Link href="/opportunities" className="rounded-lg border border-teal-700 p-3 hover:bg-teal-50">
              <span className="font-semibold text-teal-800">Opportunities →</span>
              <span className="block text-xs text-slate-600">Hackathons, competitions, exchanges, internships and more</span>
            </Link>
          </div>
        </div>
      ) : (
        <p className="rounded bg-amber-50 p-2 text-amber-900">Add at least your nationality and age to continue.</p>
      )}
      <button type="button" className="text-xs text-slate-500 underline" onClick={() => setProfile(EMPTY_PROFILE)}>
        Reset profile
      </button>
    </form>
  );
}
