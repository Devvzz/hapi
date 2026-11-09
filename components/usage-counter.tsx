"use client";

import { useEffect } from "react";
import { EMPTY_PLAN, profileIsSet, STORAGE } from "@/lib/profile";
import { useStored } from "@/lib/storage";
import { trackOnce } from "@/lib/track";
import { useProfile } from "@/lib/use-profile";

// Counts, once per browser and without any personal data, that someone made a profile (with their country)
// and that someone started a cost plan. Renders nothing.
export function UsageCounter() {
  const [profile] = useProfile();
  const [plan] = useStored(STORAGE.plan, EMPTY_PLAN);
  const ready = profileIsSet(profile);

  useEffect(() => {
    if (ready) trackOnce("profile", "profile", profile.nationality);
  }, [ready, profile.nationality]);

  useEffect(() => {
    if (plan.length > 0) trackOnce("cost-plan", "cost_plan");
  }, [plan.length]);

  return null;
}
