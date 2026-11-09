import { PageHero } from "@/components/ui";
import { ProfileForm } from "@/components/profile-form";
import { ProfilePass } from "@/components/profile-pass";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHero kicker="About you" title="Your" highlight="profile" subtitle="Hapi checks every opportunity and university against this. It stays in your browser, or in your account if you have one." />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,42rem)_minmax(0,22rem)] lg:justify-between">
        <ProfileForm />
        <ProfilePass />
      </div>
    </div>
  );
}
