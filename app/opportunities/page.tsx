import { OpportunitiesFeed } from "@/components/opportunities-feed";

export default function OpportunitiesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Opportunities</h1>
        <p className="text-sm text-slate-600">
          Every card has its source link and all known dates. &quot;TBA&quot; means not published yet. Sorted by how well it fits your profile, then by deadline.
        </p>
      </header>
      <OpportunitiesFeed />
    </div>
  );
}
