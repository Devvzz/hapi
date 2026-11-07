"use client";

import { useMemo } from "react";
import { EMPTY_PROFILE, STORAGE, normalizeProfile } from "./profile";
import { useStored } from "./storage";
import type { Profile } from "./types";

// The stored profile, upgraded from older versions.
export function useProfile(): [Profile, (next: Profile) => void] {
  const [raw, setRaw] = useStored(STORAGE.profile, EMPTY_PROFILE);
  const profile = useMemo(() => normalizeProfile(raw), [raw]);
  return [profile, (next: Profile) => setRaw(normalizeProfile(next))];
}
