"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { buildEvents, isoDay, KIND_LABEL, KIND_STYLE, toIcs, type CalEvent, type CustomEvent } from "@/lib/calendar";
import { formatDate } from "@/lib/dates";
import { EMPTY_MARKS, EMPTY_PLAN, EMPTY_SAVED, STORAGE } from "@/lib/profile";
import { useNow, useStored } from "@/lib/storage";

const NO_CUSTOM: CustomEvent[] = [];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function daysBetween(from: string, to: string): number {
  return Math.round((new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime()) / 86_400_000);
}

export function CalendarView() {
  const [saved, setSaved] = useStored(STORAGE.saved, EMPTY_SAVED);
  const [marks, setMarks] = useStored(STORAGE.uniMarks, EMPTY_MARKS);
  const [plan] = useStored(STORAGE.plan, EMPTY_PLAN);
  const [custom, setCustom] = useStored(STORAGE.events, NO_CUSTOM);
  const now = useNow();
  const [cursor, setCursor] = useState<{ y: number; m: number } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", date: "", note: "" });

  const { events, undated } = useMemo(() => buildEvents(saved, marks, plan, custom), [saved, marks, plan, custom]);
  const byDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return map;
  }, [events]);

  if (!now) return <p className="text-sm text-slate-500">Loading…</p>;
  const today = isoDay(now);
  const view = cursor ?? { y: now.getFullYear(), m: now.getMonth() };
  const first = new Date(view.y, view.m, 1);
  const lead = (first.getDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => isoDay(new Date(view.y, view.m, i + 1)))];
  while (cells.length % 7) cells.push(null);
  const move = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };
  const upcoming = events.filter((e) => e.date >= today).slice(0, 40);
  const shown = picked ? byDay.get(picked) ?? [] : null;

  function remove(e: CalEvent) {
    if (e.source === "opportunity" && e.refId) setSaved(saved.filter((id) => id !== e.refId));
    if (e.source === "university" && e.refId) {
      const next = { ...marks };
      delete next[e.refId];
      setMarks(next);
    }
    if (e.source === "custom") setCustom(custom.filter((c) => c.id !== e.id));
  }

  function addCustom() {
    if (!form.title.trim() || !form.date) return;
    setCustom([...custom, { id: `custom-${Date.now()}`, title: form.title.trim(), date: form.date, note: form.note.trim() }]);
    setForm({ title: "", date: "", note: "" });
  }

  function exportIcs() {
    const blob = new Blob([toIcs(events, new Date())], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hapi-calendar.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => move(-1)} className="rounded border border-slate-300 bg-panel px-2 py-1 text-sm">
          ‹
        </button>
        <h2 className="w-44 text-center font-semibold">{first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
        <button onClick={() => move(1)} className="rounded border border-slate-300 bg-panel px-2 py-1 text-sm">
          ›
        </button>
        <button onClick={() => { setCursor(null); setPicked(today); }} className="rounded border border-slate-300 bg-panel px-2 py-1 text-sm">
          Today
        </button>
        <button onClick={exportIcs} disabled={events.length === 0} className="ml-auto rounded bg-teal-700 px-3 py-1.5 text-sm text-white disabled:opacity-50">
          Export to Google / Apple / Outlook (.ics)
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-panel">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-medium text-slate-500">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1.5">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const list = d ? byDay.get(d) ?? [] : [];
            return (
              <button
                key={i}
                disabled={!d}
                onClick={() => d && setPicked(d === picked ? null : d)}
                className={`min-h-20 border-b border-r border-slate-100 p-1 text-left align-top ${d === picked ? "bg-teal-50" : ""} ${!d ? "bg-slate-50" : "hover:bg-slate-50"}`}
              >
                {d && (
                  <>
                    <span className={`inline-block rounded-full px-1.5 text-xs ${d === today ? "bg-teal-700 text-white" : "text-slate-500"}`}>{Number(d.slice(8))}</span>
                    <div className="mt-0.5 space-y-0.5">
                      {list.slice(0, 3).map((e) => (
                        <div key={e.id} className={`truncate rounded px-1 text-[10px] leading-4 ${KIND_STYLE[e.kind]}`} title={`${KIND_LABEL[e.kind]}: ${e.title}`}>
                          {e.title}
                        </div>
                      ))}
                      {list.length > 3 && <div className="text-[10px] text-slate-500">+{list.length - 3} more</div>}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {(Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[]).map((k) => (
          <span key={k} className={`rounded px-2 py-0.5 ${KIND_STYLE[k]}`}>
            {KIND_LABEL[k]}
          </span>
        ))}
      </div>

      {shown && (
        <section className="space-y-2">
          <h3 className="font-semibold">{formatDate(picked)}</h3>
          {shown.length === 0 ? <p className="text-sm text-slate-500">Nothing on this day.</p> : <ul className="space-y-2">{shown.map((e) => <EventRow key={e.id} e={e} today={today} onRemove={remove} />)}</ul>}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-2">
          <h3 className="font-semibold">Coming up</h3>
          {events.length === 0 ? (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              Your calendar is empty. Click <span className="font-medium">📅 Add to calendar</span> on <Link href="/opportunities" className="underline">opportunities</Link>, or{" "}
              <span className="font-medium">☆ Want to apply</span> on <Link href="/universities" className="underline">university programmes</Link>.
            </p>
          ) : upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing coming up.</p>
          ) : (
            <ul className="space-y-2">{upcoming.map((e) => <EventRow key={e.id} e={e} today={today} onRemove={remove} />)}</ul>
          )}
        </section>

        <aside className="space-y-4">
          <section className="space-y-2 rounded-xl border border-slate-200 bg-panel p-4 text-sm">
            <h3 className="font-semibold">Add your own</h3>
            <input className="w-full rounded border border-slate-300 px-2 py-1" placeholder="e.g. IELTS exam, school exams" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input type="date" className="w-full rounded border border-slate-300 px-2 py-1" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <input className="w-full rounded border border-slate-300 px-2 py-1" placeholder="Note (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            <button onClick={addCustom} disabled={!form.title.trim() || !form.date} className="rounded bg-violet-600 px-3 py-1 text-white disabled:opacity-50">
              Add
            </button>
          </section>

          {undated.length > 0 && (
            <section className="space-y-2 rounded-xl border border-slate-200 bg-panel p-4 text-sm">
              <h3 className="font-semibold">No date yet</h3>
              <p className="text-xs text-slate-500">On your list, but the date is not published. Check the official page later.</p>
              <ul className="space-y-1">
                {undated.map((u) => (
                  <li key={u.id}>
                    {u.link ? (
                      <a href={u.link} target="_blank" rel="noopener noreferrer" className="text-teal-700 hover:underline">
                        {u.title}
                      </a>
                    ) : (
                      u.title
                    )}
                    <span className="block text-xs text-slate-500">{u.why}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function EventRow({ e, today, onRemove }: { e: CalEvent; today: string; onRemove: (e: CalEvent) => void }) {
  const left = daysBetween(today, e.date);
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-panel p-2 text-sm">
      <span className="w-24 shrink-0 text-xs text-slate-500">{formatDate(e.date)}</span>
      <span className={`rounded px-1.5 py-0.5 text-xs ${KIND_STYLE[e.kind]}`}>{KIND_LABEL[e.kind]}</span>
      <span className="min-w-0 flex-1">
        {e.link ? (
          <a href={e.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {e.title}
          </a>
        ) : (
          e.title
        )}
        {e.note && <span className="block text-xs text-slate-500">{e.note}</span>}
      </span>
      <span className={`text-xs ${left <= 7 && left >= 0 ? "font-semibold text-rose-700" : "text-slate-500"}`}>{left === 0 ? "today" : left === 1 ? "tomorrow" : left > 0 ? `in ${left} days` : left === -1 ? "yesterday" : `${-left} days ago`}</span>
      {e.source !== "plan" && (
        <button onClick={() => onRemove(e)} className="text-xs text-slate-400 hover:text-rose-700" title="Remove from calendar">
          ✕
        </button>
      )}
    </li>
  );
}
