"use client";

import { useEffect, useState } from "react";

// Real cities with the most programmes in Hapi, with their airport-style codes.
const DESTINATIONS = [
  { code: "VIE", city: "Vienna" },
  { code: "MIL", city: "Milan" },
  { code: "MUC", city: "Munich" },
  { code: "BUD", city: "Budapest" },
  { code: "BER", city: "Berlin" },
  { code: "GRZ", city: "Graz" },
  { code: "ROM", city: "Rome" },
  { code: "BLQ", city: "Bologna" },
];

// Fake barcode bars, fixed so the server and the browser draw the same thing.
const BARS = [2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2];

function Flap({ text }: { text: string }) {
  return (
    <span className="flex gap-[3px]" aria-hidden="true">
      {text.split("").map((c, i) => (
        <span
          key={`${c}-${i}`}
          className="wp-flap relative flex h-11 w-8 items-center justify-center rounded-md font-display text-2xl font-extrabold text-[#ffd56b]"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          {c}
        </span>
      ))}
    </span>
  );
}

// A boarding pass for the welcome screen. The student's name appears on it while they type,
// and the destination flips through cities in Hapi like an airport board.
export function WelcomePass({ name }: { name: string }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % DESTINATIONS.length), 2200);
    return () => clearInterval(t);
  }, []);

  const to = DESTINATIONS[i];
  const passenger = name.trim() ? name.trim().toUpperCase() : "YOUR NAME";

  return (
    <div className="wp-float mx-auto w-full max-w-sm" aria-hidden="true">
      <div className="flex -rotate-2 overflow-hidden rounded-2xl border border-[#e4e0d7] bg-white text-left text-[#0e1b2e] shadow-[0_24px_50px_-24px_rgba(14,27,46,0.45)]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between bg-[#1f5eff] px-4 py-2 text-white">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em]">Hapi pass</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90">Boarding</span>
          </div>
          <div className="space-y-3 px-4 pb-4 pt-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-[#5f6675]">Passenger</p>
              <p className={`truncate font-display text-base font-extrabold ${name.trim() ? "text-[#0e1b2e]" : "text-[#9aa1ad]"}`}>{passenger}</p>
            </div>
            <div className="flex items-center gap-2">
              <div>
                <p className="font-display text-2xl font-extrabold leading-none">YOU</p>
                <p className="mt-1 text-[9px] uppercase tracking-wider text-[#5f6675]">Home</p>
              </div>
              <div className="relative mx-1 h-px flex-1 border-t-2 border-dashed border-[#cfcac0]">
                <svg viewBox="0 0 24 24" className="pass-plane absolute -top-[11px] h-5 w-5 -translate-x-1/2 text-[#ff6b3d]" fill="currentColor">
                  <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" transform="rotate(90 12 12)" />
                </svg>
              </div>
              <div className="text-right">
                <Flap key={to.code} text={to.code} />
                <p className="mt-1 text-[9px] uppercase tracking-wider text-[#5f6675]">{to.city}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative flex w-20 shrink-0 flex-col justify-between border-l-2 border-dashed border-[#e4e0d7] px-2 py-3 text-center">
          <span className="absolute -left-[9px] -top-2 h-4 w-4 rounded-full border border-[#e4e0d7] bg-[#f7f5f0]" />
          <span className="absolute -bottom-2 -left-[9px] h-4 w-4 rounded-full border border-[#e4e0d7] bg-[#f7f5f0]" />
          <div>
            <p className="text-[9px] uppercase tracking-widest text-[#5f6675]">Gate</p>
            <p className="font-display text-lg font-extrabold leading-tight">01</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-[#5f6675]">Fare</p>
            <p className="text-xs font-bold text-[#1f5eff]">Free</p>
          </div>
          <div className="flex h-7 items-end justify-center gap-[2px]">
            {BARS.slice(0, 16).map((w, n) => (
              <span key={n} className="h-full bg-[#0e1b2e]" style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
