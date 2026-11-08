import { PageHero } from "@/components/ui";
import { ProfileGate } from "@/components/profile-gate";
import { OpportunitiesFeed } from "@/components/opportunities-feed";

export default function OpportunitiesPage() {
  return (
    <div className="space-y-6">
      <PageHero kicker="Discover" title="Opportunities" highlight="you can join" subtitle="Hackathons, competitions, exchanges, internships, certificates and events, each with its source link and every known date. Only what you can apply to is shown first." />
      <ProfileGate what="opportunities">
        <OpportunitiesFeed />
      </ProfileGate>
    </div>
  );
}
