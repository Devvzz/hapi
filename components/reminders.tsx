"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildEvents, isoDay, KIND_LABEL, type CustomEvent } from "@/lib/calendar";
import { formatDate } from "@/lib/dates";
import { EMPTY_MARKS, EMPTY_PLAN, EMPTY_SAVED, STORAGE } from "@/lib/profile";
import { useNow, useStored } from "@/lib/storage";
import { useProfile } from "@/lib/use-profile";

const NO_CUSTOM: CustomEvent[] = [];
const SHOWN_KEY = "hapi.notified";
const NONE: string[] = [];

function daysLeft(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00`) - Date.parse(`${from}T12:00:00`)) / 86_400_000);
}

function when(n: number): string {
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  return `In ${n} days`;
}

// Deadlines and plan steps in the next 14 days, for everyone. Optional browser notifications for the next 3 days.
export function Reminders() {
  const [saved] = useStored(STORAGE.saved, EMPTY_SAVED);
  const [marks] = useStored(STORAGE.uniMarks, EMPTY_MARKS);
  const [plan] = useStored(STORAGE.plan, EMPTY_PLAN);
  const [custom] = useStored(STORAGE.events, NO_CUSTOM);
  const [profile] = useProfile();
  const [shown, setShown] = useStored(SHOWN_KEY, NONE);
  const now = useNow();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  const today = now ? isoDay(now) : null;
  const soon = useMemo(() => {
    if (!today) return [];
    const { events } = buildEvents(saved, marks, plan, custom, profile);
    return events
      .filter((e) => e.kind !== "event" && e.kind !== "results" && e.date >= today && daysLeft(today, e.date) <= 14)
      .map((e) => ({ ...e, left: daysLeft(today, e.date) }));
  }, [saved, marks, plan, custom, profile, today]);

  useEffect(() => {
    const p = typeof Notification === "undefined" ? "unsupported" : Notification.permission;
    queueMicrotask(() => setPermission(p));
  }, []);

  // Show each item due within 3 days once per day as a browser notification, while Hapi is open.
  useEffect(() => {
    if (permission !== "granted" || !today) return;
    const due = soon.filter((e) => e.left <= 3 && !shown.includes(`${e.id}@${today}`));
    if (due.length === 0) return;
    for (const e of due) new Notification(`${when(e.left)}: ${KIND_LABEL[e.kind]}`, { body: e.title, tag: e.id });
    setShown([...shown.filter((k) => k.endsWith(`@${today}`)), ...due.map((e) => `${e.id}@${today}`)]);
  }, [permission, soon, shown, setShown, today]);

  if (soon.length === 0) return null;
  return (
    <section className="space-y-3 rounded-2xl border border-amber-300 bg-amber-50 p-5" aria-label="Coming up">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-slate-900">Coming up in the next two weeks</h2>
        {permission === "default" && (
          <button onClick={() => Notification.requestPermission().then(setPermission)} className="rounded-full border border-amber-300 px-3 py-1 text-xs text-amber-700 hover:bg-amber-50">
            Turn on reminders
          </button>
        )}
        {permission === "granted" && <span className="text-xs text-slate-500">Reminders on in this browser</span>}
      </div>
      <ul className="space-y-2">
        {soon.slice(0, 6).map((e) => (
          <li key={e.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
            <span className="min-w-0">
              <span className="text-slate-500">{KIND_LABEL[e.kind]} · </span>
              <span className="text-slate-900">{e.title}</span>
            </span>
            <span className={`shrink-0 font-medium ${e.left <= 3 ? "text-rose-700" : "text-amber-700"}`}>
              {when(e.left)} · {formatDate(e.date)}
            </span>
          </li>
        ))}
      </ul>
      {soon.length > 6 && (
        <Link href="/calendar" className="text-xs text-violet-300 underline">
          {soon.length - 6} more in your calendar
        </Link>
      )}
    </section>
  );
}
