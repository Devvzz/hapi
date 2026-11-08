import { Suspense } from "react";
import { PersonFromQuery } from "@/components/people-view";

export default function PeoplePage() {
  return (
    <Suspense fallback={<p className="pt-10 text-center text-sm text-slate-500">Loading…</p>}>
      <PersonFromQuery />
    </Suspense>
  );
}
