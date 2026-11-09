"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { opportunities, programs } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { isoDay } from "@/lib/calendar";
import { useNow } from "@/lib/storage";

type Pass = { id: string; href: string; code: string; place: string; title: string; sub: string; date: string; label: string; extra: string; tone: string };

const TONES = ["bg-[#1f5eff]", "bg-[#0e1b2e]", "bg-[#ff6b3d]"];

const code = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 3)
    .toUpperCase();

// Bars of a fake barcode, the same every time for the same id.
function bars(id: string): number[] {
  let h = 2166136261;
  return Array.from({ length: 26 }, (_, i) => {
    h = Math.imul(h ^ id.charCodeAt(i % id.length), 16777619);
    return 1 + (Math.abs(h) % 3);
  });
}

function pick(today: string): Pass[] {
  const progs = programs
    .filter((p) => p.applyBy && p.applyBy >= today && p.program)
    .sort((a, b) => a.applyBy!.localeCompare(b.applyBy!));
  const seen = new Set<string>();
  const out: Pass[] = [];
  for (const p of progs) {
    if (seen.has(p.country) || out.length === 2) continue;
    seen.add(p.country);
    out.push({
      id: p.id,
      href: "/universities",
      code: code(p.city ?? p.country),
      place: p.city ?? p.country,
      title: p.university,
      sub: p.program ?? "",
      date: p.applyBy!,
      label: "Apply by",
      extra: p.applicationFeeShort ? `Fee ${p.applicationFeeShort}` : p.entryTest === "no" ? "No entry test" : "Bachelor",
      tone: "",
    });
  }
  const opp = opportunities
    .filter((o) => o.deadline && o.deadline.slice(0, 10) >= today)
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!))[0];
  if (opp) {
    const place = opp.location?.split(",")[0] || (opp.mode === "online" ? "Online" : opp.provider);
    out.splice(1, 0, {
      id: opp.id,
      href: `/opportunities/${opp.id}`,
      code: place === "Online" ? "WEB" : code(place),
      place,
      title: opp.title,
      sub: opp.provider,
      date: opp.deadline!.slice(0, 10),
      label: "Deadline",
      extra: opp.travelPaid === "full" ? "Travel paid" : opp.costType === "free" ? "Free" : opp.type,
      tone: "",
    });
  }
  return out.slice(0, 3).map((p, i) => ({ ...p, tone: TONES[i] }));
}

function Ticket({ p }: { p: Pass }) {
  return (
    <Link href={p.href} className="flex h-full overflow-hidden rounded-2xl border border-[#e4e0d7] bg-white text-[#0e1b2e] shadow-[0_18px_40px_-20px_rgba(14,27,46,0.35)]">
      <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
        <div className="flex items-center justify-between gap-2">
          <span className={`rounded-md ${p.tone} px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white`}>hapi pass</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#5f6675]">{p.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <p className="font-display text-2xl font-extrabold leading-none">YOU</p>
            <p className="text-[10px] uppercase text-[#5f6675]">today</p>
          </div>
          <div className="relative h-px flex-1 border-t-2 border-dashed border-[#cfcac0]">
            <svg viewBox="0 0 24 24" className="pass-plane absolute -top-[11px] h-5 w-5 -translate-x-1/2 text-[#1f5eff]" fill="currentColor" aria-hidden="true">
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" transform="rotate(90 12 12)" />
            </svg>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-extrabold leading-none">{p.code}</p>
            <p className="max-w-[7rem] truncate text-[10px] uppercase text-[#5f6675]">{p.place}</p>
          </div>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{p.title}</p>
          <p className="truncate text-xs text-[#5f6675]">{p.sub}</p>
        </div>
      </div>
      <div className="relative flex w-24 shrink-0 flex-col justify-between border-l-2 border-dashed border-[#e4e0d7] p-3 text-center">
        <span className="absolute -left-[9px] -top-2 h-4 w-4 rounded-full border border-[#e4e0d7] bg-[#f7f5f0]" />
        <span className="absolute -bottom-2 -left-[9px] h-4 w-4 rounded-full border border-[#e4e0d7] bg-[#f7f5f0]" />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#5f6675]">{p.label}</p>
          <p className="font-display text-sm font-extrabold leading-tight">{formatDate(p.date)}</p>
        </div>
        <p className="truncate text-[10px] font-semibold capitalize text-[#1f5eff]">{p.extra}</p>
        <div className="flex h-8 items-end justify-center gap-[2px]" aria-hidden="true">
          {bars(p.id).map((w, i) => (
            <span key={i} className="h-full bg-[#0e1b2e]" style={{ width: w }} />
          ))}
        </div>
      </div>
    </Link>
  );
}

// Three boarding passes for the next real deadlines. They shuffle on their own, fan out on hover and move on with a click.
export function BoardingPasses() {
  const now = useNow();
  const passes = useMemo(() => (now ? pick(isoDay(now)) : []), [now]);
  const [front, setFront] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (passes.length < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setFront((f) => (f + 1) % passes.length), 4200);
    return () => clearInterval(t);
  }, [passes.length, paused]);

  if (passes.length === 0) return <div className="h-64 w-full max-w-md" />;
  return (
    <div className="w-full max-w-md px-2 sm:px-0">
      <div className="pass-stack relative h-52 sm:h-56" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {passes.map((p, i) => {
          const depth = (i - front + passes.length) % passes.length;
          return (
            <div key={p.id} className="pass-card absolute inset-x-0 top-0 h-44 sm:h-48" data-depth={depth} style={{ zIndex: 10 - depth }}>
              <Ticket p={p} />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Next real deadlines in Hapi</span>
        <button onClick={() => setFront((f) => (f + 1) % passes.length)} className="rounded-full border border-slate-300 px-3 py-1 text-slate-600 transition hover:border-slate-400 hover:text-slate-900">
          Next pass
        </button>
      </div>
    </div>
  );
}
