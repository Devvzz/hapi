import { PageHero } from "@/components/ui";
import { ProfileForm } from "@/components/profile-form";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHero kicker="About you" title="Your" highlight="profile" subtitle="Hapi checks every opportunity and university against this. It stays in your browser, or in your account if you have one." />
      <ProfileForm />
    </div>
  );
}
