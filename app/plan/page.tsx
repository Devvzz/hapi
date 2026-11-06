import { CostPlan } from "@/components/cost-plan";

export default function PlanPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Cost plan</h1>
        <p className="text-sm text-slate-600">Every cost in one table. Edit any cell. Family members can sponsor a cost with a PayPal invoice after you approve it.</p>
      </header>
      <CostPlan />
    </div>
  );
}
