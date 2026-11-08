import { PageHero } from "@/components/ui";
import { Suspense } from "react";
import { Coach } from "@/components/coach";
import { PremiumPanel } from "@/components/premium-panel";

export default function PremiumPage() {
  return (
    <div className="space-y-6">
      <PageHero kicker="Hapi Premium" title="Go" highlight="further" subtitle="A chat assistant, a weekly AI coach, a Europass CV builder and your deadline calendar for €2.99 a month, paid with PayPal. The free parts of Hapi stay free." />
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <PremiumPanel>
          <Coach />
        </PremiumPanel>
      </Suspense>
    </div>
  );
}
