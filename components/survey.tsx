"use client";

import { EMPTY_SAVED, profileIsSet, STORAGE } from "@/lib/profile";
import { useStored } from "@/lib/storage";
import { track } from "@/lib/track";
import { useProfile } from "@/lib/use-profile";

const KEY = "hapi.survey";

// One quick question, asked once, after the student has saved something.
export function Survey() {
  const [answer, setAnswer] = useStored<string>(KEY, "");
  const [saved] = useStored(STORAGE.saved, EMPTY_SAVED);
  const [profile] = useProfile();

  if (!profileIsSet(profile) || saved.length === 0 || answer === "done") return null;
  if (answer === "yes" || answer === "no")
    return (
      <section className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-slate-700">
        Thank you! That helps Hapi get better.{" "}
        <button onClick={() => setAnswer("done")} className="text-xs text-slate-500 underline">
          Close
        </button>
      </section>
    );

  function reply(v: "yes" | "no") {
    track("survey", v);
    setAnswer(v);
  }

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-400/30 bg-cyan-500/[0.07] p-4" aria-label="Quick question">
      <p className="text-sm text-slate-900">
        <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-teal-700">Quick question</span>
        Did Hapi show you something you did not know about before?
      </p>
      <div className="flex gap-2">
        <button onClick={() => reply("yes")} className="rounded-full bg-teal-700 px-4 py-1.5 text-sm font-medium text-white">
          Yes
        </button>
        <button onClick={() => reply("no")} className="rounded-full border border-slate-200 px-4 py-1.5 text-sm text-slate-700 hover:text-slate-900">
          Not yet
        </button>
        <button onClick={() => setAnswer("done")} aria-label="Hide question" className="px-2 text-slate-500 hover:text-slate-900">
          ×
        </button>
      </div>
    </section>
  );
}
