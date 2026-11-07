"use client";

import { useState } from "react";
import Link from "next/link";
import { profileIsSet } from "@/lib/profile";
import { useProfile } from "@/lib/use-profile";

// Asks for the profile first, because every check on these pages depends on it.
export function ProfileGate({ what, children }: { what: string; children: React.ReactNode }) {
  const [profile] = useProfile();
  const [browse, setBrowse] = useState(false);
  if (profileIsSet(profile) || browse) return <>{children}</>;
  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-teal-200 bg-white p-6 text-center">
      <h2 className="text-lg font-semibold">First, tell Hapi about you</h2>
      <p className="text-sm text-slate-600">
        Hapi checks {what} against your nationality, age, school and budget. It takes about 2 minutes, and it stays in your browser.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/profile" className="rounded bg-teal-700 px-4 py-2 text-sm font-medium text-white">
          Set up my profile
        </Link>
        <button onClick={() => setBrowse(true)} className="rounded border border-slate-300 px-4 py-2 text-sm">
          Just browse
        </button>
      </div>
    </div>
  );
}
