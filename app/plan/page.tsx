import { PageHero } from "@/components/ui";
import { CostPlan } from "@/components/cost-plan";
import { Roadmap } from "@/components/roadmap";

export default function PlanPage() {
  return (
    <div className="space-y-6">
      <PageHero kicker="Plan the way there" title="Your" highlight="plan" subtitle="Every step from language certificate to your first day, then every cost in one table. Family can sponsor a cost with a PayPal invoice, and nothing is sent before you approve it." />
      <Roadmap />
      <CostPlan />
    </div>
  );
}
