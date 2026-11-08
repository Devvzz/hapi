"use client";

import { Starfield } from "./starfield";

// The welcome screen's living background, softer, behind every page.
export function Ambient() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 print:hidden" aria-hidden="true">
      <div className="welcome-orb left-[-15%] top-[-20%] h-[50vmax] w-[50vmax] bg-violet-600/20" />
      <div className="welcome-orb welcome-orb-2 bottom-[-25%] right-[-15%] h-[45vmax] w-[45vmax] bg-cyan-500/10" />
      <Starfield density={26000} className="absolute inset-0 h-full w-full opacity-60" />
    </div>
  );
}
