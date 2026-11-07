import { Suspense } from "react";
import { Coach } from "@/components/coach";
import { PremiumPanel } from "@/components/premium-panel";

export default function PremiumPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Premium</h1>
        <p className="text-sm text-slate-600">A monthly PayPal subscription unlocks the weekly AI coach.</p>
      </header>
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <PremiumPanel>
          <Coach />
        </PremiumPanel>
      </Suspense>
    </div>
  );
}
