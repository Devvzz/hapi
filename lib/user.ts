"use client";

import { STORAGE } from "./profile";
import { useMemo } from "react";
import { useStored } from "./storage";

// Who is using Hapi on this device. Saved in this browser only; there is no server account.
export type HapiUser = { name: string; goal: "universities" | "opportunities" | "both" | null; createdAt: string | null };
export const EMPTY_USER: HapiUser = { name: "", goal: null, createdAt: null };

// "devis" -> "Devis", "anna-maria de luca" -> "Anna-Maria De Luca". Leaves the rest of each word as typed.
export function capitalizeName(name: string): string {
  return name.replace(/(^|[\s'-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase());
}

export function useUser(): [HapiUser, (next: HapiUser) => void] {
  const [raw, setRaw] = useStored(STORAGE.user, EMPTY_USER);
  const user = useMemo(() => (raw.name ? { ...raw, name: capitalizeName(raw.name) } : raw), [raw]);
  return [user, (next: HapiUser) => setRaw({ ...next, name: capitalizeName(next.name) })];
}
