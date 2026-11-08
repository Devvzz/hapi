"use client";

import { useEffect, useRef, useState } from "react";

const CHARS = "0123456789";

// A split-flap board like at the airport: the numbers rattle through digits and land on the real value.
export function DepartureBoard({ rows }: { rows: { label: string; value: string; note?: string }[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(-1); // -1 = not started; counts up while flipping
  const STEPS = 14;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      let n = 0;
      timer = setInterval(() => {
        n += 1;
        setTick(n);
        if (n >= STEPS) clearInterval(timer);
      }, 70);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearInterval(timer);
    };
  }, []);

  const shown = (value: string, row: number) =>
    value
      .split("")
      .map((c, i) => {
        if (tick < 0 || tick >= STEPS || !/\d/.test(c)) return c;
        // later characters settle later
        return tick > 4 + i * 2 + row ? c : CHARS[(tick * 7 + i * 3 + row) % 10];
      })
      .join("");

  return (
    <div ref={box} className="overflow-hidden rounded-2xl border border-white/10 bg-[#07060d] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#fcd34d]">
        <span>Departures</span>
        <span className="flex items-center gap-1.5 text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> On time
        </span>
      </div>
      <div className="grid gap-px bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((r, row) => (
          <div key={r.label} className="flex items-center justify-between gap-3 bg-[#07060d] px-4 py-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold uppercase tracking-wider text-white">{r.label}</p>
              {r.note && <p className="truncate text-xs text-slate-600">{r.note}</p>}
            </div>
            <div className="flex shrink-0 gap-[3px]" aria-label={r.value}>
              {shown(r.value, row)
                .split("")
                .map((c, i) => (
                  <span key={i} className="flap font-mono relative flex h-11 w-8 items-center justify-center rounded-md text-2xl font-bold sm:h-12 sm:w-9 sm:text-[1.7rem]" aria-hidden="true">
                    {c}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
