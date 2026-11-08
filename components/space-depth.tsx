"use client";

import { useEffect, useRef } from "react";

// Three layers of tiny stars. Far stars are small and slow, near ones bigger and faster;
// they twinkle gently and shift at different speeds when the page scrolls (parallax).
const LAYERS = [
  { count: 0.00011, size: [0.4, 0.9], speed: 0.04, parallax: 0.06, alpha: 0.55 },
  { count: 0.00005, size: [0.8, 1.4], speed: 0.08, parallax: 0.14, alpha: 0.75 },
  { count: 0.000016, size: [1.3, 2.1], speed: 0.14, parallax: 0.28, alpha: 0.95 },
];
const COLORS = ["255,255,255", "221,214,254", "196,181,253", "165,243,252"];

type Star = { x: number; y: number; r: number; c: string; phase: number; tw: number; layer: number };

export function SpaceDepth() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let frame = 0;
    let drift = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = LAYERS.flatMap((L, layer) =>
        Array.from({ length: Math.round(w * h * L.count) }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          r: L.size[0] + Math.random() * (L.size[1] - L.size[0]),
          c: COLORS[Math.floor(Math.random() * COLORS.length)],
          phase: Math.random() * Math.PI * 2,
          tw: 0.6 + Math.random() * 1.6,
          layer,
        })),
      );
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, w, h);
      const scroll = window.scrollY;
      for (const s of stars) {
        const L = LAYERS[s.layer];
        const y = (((s.y - scroll * L.parallax - drift * L.speed) % h) + h) % h;
        const x = (((s.x + drift * L.speed * 0.35) % w) + w) % w;
        const twinkle = still ? 1 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.tw + s.phase);
        const a = L.alpha * twinkle;
        if (s.r > 1.2) {
          ctx!.shadowColor = `rgba(${s.c},${a})`;
          ctx!.shadowBlur = 6;
        }
        ctx!.fillStyle = `rgba(${s.c},${a})`;
        ctx!.beginPath();
        ctx!.arc(x, y, s.r, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }
    }

    let last = performance.now();
    function tick(t: number) {
      drift += (t - last) * 0.02;
      last = t;
      draw(t);
      frame = requestAnimationFrame(tick);
    }

    resize();
    if (still) {
      draw(0);
      const redraw = () => draw(0);
      window.addEventListener("scroll", redraw, { passive: true });
      window.addEventListener("resize", () => {
        resize();
        draw(0);
      });
      return () => window.removeEventListener("scroll", redraw);
    }
    frame = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 h-full w-full" aria-hidden="true" />;
}
