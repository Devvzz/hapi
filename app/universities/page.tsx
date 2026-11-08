import { PageHero } from "@/components/ui";
import { ProfileGate } from "@/components/profile-gate";
import { UniversitiesList } from "@/components/universities-list";

export default function UniversitiesPage() {
  return (
    <div className="space-y-6">
      <PageHero kicker="Study abroad" title="Universities" highlight="that fit you" subtitle="Every programme with the fee you would pay, entry test, application fee and dates. Rules check language and budget first; the AI only explains." />
      <ProfileGate what="universities">
        <UniversitiesList />
      </ProfileGate>
    </div>
  );
}
