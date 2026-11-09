"use client";

import { useEffect, useRef } from "react";

// Letters and symbols from the world's alphabets, old runes and science: knowledge from everywhere.
export const GLYPHS = [
  ..."αβγδλπΣΩφψ", // Greek
  ..."ЖЯДФЩЮ", // Cyrillic
  ..."كمعسب", // Arabic
  ..."学知书文", // Chinese: study, know, book, writing
  ..."ᚠᚢᚦᚨᚱᚲᚷᚹᚺᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ", // old runes
  ..."אבשת", // Hebrew
  ..."ঃকখ", // Bengali
  ..."∑∫∂√∞≈∇", // maths
  ..."ëçÇ", // Albanian
];
const COLORS = ["196,181,253", "167,139,250", "103,232,249", "253,230,138"];

type G = { x: number; y: number; vy: number; sway: number; phase: number; size: number; ch: string; c: string; life: number; pulled: number };

// A slow upward drift of glowing characters. They lean towards the cursor; with `target` they also stream
// into one point (the open book on the welcome screen), fade there and are reborn at the bottom.
export function GlyphField({ density = 26000, target, className = "absolute inset-0 h-full w-full" }: { density?: number; target?: { x: number; y: number }; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999 };
    let w = 0;
    let h = 0;
    let glyphs: G[] = [];
    let frame = 0;

    const spawn = (anywhere: boolean): G => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 20 + Math.random() * 60,
      vy: 0.15 + Math.random() * 0.35,
      sway: 0.3 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      size: 12 + Math.random() * 14,
      ch: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 1,
      pulled: 0,
    });

    function resize() {
      w = canvas!.clientWidth;
      h = canvas!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, (w * h) / density));
      glyphs = Array.from({ length: count }, () => spawn(true));
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, w, h);
      const tx = target ? target.x * w : null;
      const ty = target ? target.y * h : null;
      for (let i = 0; i < glyphs.length; i++) {
        const g = glyphs[i];
        if (!still) {
          g.y -= g.vy;
          g.x += Math.sin(t * 0.0006 * g.sway + g.phase) * 0.25;
          // The cursor gently pulls nearby characters towards it.
          const dx = mouse.x - g.x;
          const dy = mouse.y - g.y;
          const d = Math.hypot(dx, dy);
          if (d < 180 && d > 1) {
            g.x += (dx / d) * 0.6;
            g.y += (dy / d) * 0.6;
          }
          // Streaming into the book: characters that come close are drawn in and fade.
          if (tx !== null && ty !== null) {
            const bx = tx - g.x;
            const by = ty - g.y;
            const bd = Math.hypot(bx, by);
            if (bd < Math.min(w, h) * 0.45) g.pulled = Math.min(1, g.pulled + 0.01);
            if (g.pulled > 0) {
              g.x += (bx / bd) * 1.6 * g.pulled;
              g.y += (by / bd) * 1.6 * g.pulled;
              if (bd < 30) g.life -= 0.06;
            }
          }
          if (g.y < -30 || g.life <= 0) glyphs[i] = spawn(false);
        }
        const twinkle = 0.55 + 0.45 * Math.sin(t * 0.002 + g.phase);
        const edge = Math.min(1, g.y / (h * 0.25)); // fade out near the top
        const a = Math.max(0, 0.7 * twinkle * edge * g.life);
        ctx!.font = `${g.size}px "Segoe UI Symbol", "Noto Sans", serif`;
        ctx!.shadowColor = `rgba(${g.c},${a})`;
        ctx!.shadowBlur = 12;
        ctx!.fillStyle = `rgba(${g.c},${a})`;
        ctx!.fillText(g.ch, g.x, g.y);
      }
      ctx!.shadowBlur = 0;
    }

    const loop = (t: number) => {
      draw(t);
      frame = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    resize();
    if (still) draw(0);
    else frame = requestAnimationFrame(loop);
    const onResize = () => {
      resize();
      if (still) draw(0);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [density, target]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
