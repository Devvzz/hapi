import { CalendarView } from "@/components/calendar-view";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">My calendar</h1>
        <p className="text-sm text-slate-600">
          Every date for the opportunities you added and the programmes you want to apply to, plus payments from your cost plan. Export it to your phone&apos;s calendar with a reminder a week before each deadline.
        </p>
      </header>
      <CalendarView />
    </div>
  );
}
