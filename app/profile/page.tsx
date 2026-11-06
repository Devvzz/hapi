import { ProfileForm } from "@/components/profile-form";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">My profile</h1>
        <p className="text-sm text-slate-600">Used to match opportunities and check which universities you can apply to.</p>
      </header>
      <ProfileForm />
    </div>
  );
}
