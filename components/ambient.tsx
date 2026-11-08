"use client";

import { SpaceDepth } from "./space-depth";

// Background for every page: twinkling stars on three depth layers that shift as you scroll.
export function Ambient() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 print:hidden" aria-hidden="true">
      <SpaceDepth />
    </div>
  );
}
