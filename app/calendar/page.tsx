import { PageHero } from "@/components/ui";
import { CalendarView } from "@/components/calendar-view";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <PageHero kicker="Never miss a date" title="Your" highlight="calendar" subtitle="Deadlines for what you added, programmes you starred and payments from your plan. Export it to your phone with reminders two weeks, three days and one day before each deadline." />
      <CalendarView />
    </div>
  );
}
