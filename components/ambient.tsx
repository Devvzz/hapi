"use client";

import { GlyphField } from "./glyph-field";

// Background for every page: characters from the world's alphabets drifting slowly upwards.
export function Ambient() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 print:hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(91,33,182,0.18),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(14,116,144,0.12),transparent_60%)]" />
      <GlyphField density={34000} />
    </div>
  );
}
