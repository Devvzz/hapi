"use client";

import { STORAGE } from "./profile";
import { useStored } from "./storage";

// Who is using Hapi on this device. Saved in this browser only; there is no server account.
export type HapiUser = { name: string; goal: "universities" | "opportunities" | "both" | null; createdAt: string | null };
export const EMPTY_USER: HapiUser = { name: "", goal: null, createdAt: null };

export function useUser() {
  return useStored(STORAGE.user, EMPTY_USER);
}
