import { ProfileGate } from "@/components/profile-gate";
import { UniversitiesList } from "@/components/universities-list";

export default function UniversitiesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Universities</h1>
        <p className="text-sm text-slate-600">
          Grouped by university, with the fee you would pay. Rules check language and budget first; the AI only explains the result.
        </p>
      </header>
      <ProfileGate what="universities">
        <UniversitiesList />
      </ProfileGate>
    </div>
  );
}
