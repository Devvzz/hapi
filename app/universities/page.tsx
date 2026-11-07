import { ProfileGate } from "@/components/profile-gate";
import { UniversitiesList } from "@/components/universities-list";

export default function UniversitiesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Universities</h1>
        <p className="text-sm text-slate-600">
          Rules check language and non-EU fees against your profile first. The AI only explains the result in plain English. It never changes facts.
        </p>
      </header>
      <ProfileGate what="universities">
        <UniversitiesList />
      </ProfileGate>
    </div>
  );
}
