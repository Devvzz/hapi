"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DEMO_KEY, enterDemo, leaveDemo } from "@/lib/demo";
import { useStored } from "@/lib/storage";

export function DemoBanner() {
  const [demo] = useStored(DEMO_KEY, false);
  const params = useSearchParams();
  const wanted = params.get("demo");

  useEffect(() => {
    if (wanted !== "1" && wanted !== "0") return;
    if (wanted === "1") enterDemo(new Date());
    else leaveDemo();
    // A full reload makes every page read the new storage values.
    const url = new URL(window.location.href);
    url.searchParams.delete("demo");
    window.location.replace(url.toString());
  }, [wanted]);

  if (!demo) return null;
  return (
    <aside aria-label="Demo mode" className="border-b border-amber-300/30 bg-gradient-to-r from-amber-500/15 via-violet-500/15 to-cyan-500/15 px-4 py-2 text-center text-sm text-amber-900 print:hidden">
      Demo mode: a made-up sample student, and Premium is unlocked without PayPal.{" "}
      <a href="?demo=0" className="font-medium underline">
        Leave demo
      </a>
    </aside>
  );
}
