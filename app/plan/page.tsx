import { PageHero } from "@/components/ui";
import { CostPlan } from "@/components/cost-plan";

export default function PlanPage() {
  return (
    <div className="space-y-6">
      <PageHero kicker="Plan the money" title="Your real" highlight="cost plan" subtitle="Every cost in one table. Family can sponsor a cost with a PayPal invoice, and nothing is sent before you approve it." />
      <CostPlan />
    </div>
  );
}
