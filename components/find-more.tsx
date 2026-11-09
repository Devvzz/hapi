"use client";

import { useState } from "react";
import { track } from "@/lib/track";
import { useProfile } from "@/lib/use-profile";

type Found = {
  title: string;
  provider: string;
  type: string;
  deadline: string | null;
  cost: string | null;
  sourceUrl: string;
  sourceTitle: string;
};

export function FindMore() {
  const [profile] = useProfile();
  const [topic, setTopic] = useState("");
  const [items, setItems] = useState<Found[] | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error" | "quota">("idle");

  async function search() {
    if (!topic.trim()) return;
    setState("loading");
    track("find_more");
    try {
      const res = await fetch("/api/find-more", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, country: profile.nationality || undefined }),
      });
      if (res.status === 429) {
        setState("quota");
        return;
      }
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { items: Found[] };
      setItems(data.items);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-panel p-4">
      <h2 className="font-semibold">Find more with AI</h2>
      <p className="text-sm text-slate-600">Gemini searches the web with Google Search. Results are unverified until you check the link, and they are never added to the checked list.</p>
      <div className="flex flex-wrap gap-2">
        <input
          className="min-w-60 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          placeholder="e.g. AI summer school, robotics competition, free certificates"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <button onClick={search} disabled={state === "loading"} className="rounded bg-violet-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">
          {state === "loading" ? "Searching…" : "Find more"}
        </button>
      </div>
      {state === "error" && <p className="text-sm text-rose-700">The AI search is unavailable right now. Try again in a minute.</p>}
      {state === "quota" && <p className="text-sm text-rose-700">The web search quota for today is used up. The checked opportunities above are not affected.</p>}
      {items && items.length === 0 && <p className="text-sm text-slate-600">Nothing with a source link was found.</p>}
      {items && items.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Unverified – check the link</p>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.sourceUrl + item.title} className="rounded border border-amber-200 bg-amber-50 p-3 text-sm">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-slate-600">
                  {item.type} · {item.provider} · Deadline: {item.deadline ?? "TBA"} · Cost: {item.cost ?? "check yourself"}
                </p>
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-700 underline">
                  {item.sourceTitle}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
