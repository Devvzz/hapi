"use client";

import { useCallback, useSyncExternalStore } from "react";

// Small localStorage store: the profile, plan and activity log live in the browser only.
const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: unknown }>();
const changeListeners = new Set<(key: string) => void>();

// Called after the app itself changes a stored value (used to sync to the account).
export function onStoredChange(cb: (key: string) => void): () => void {
  changeListeners.add(cb);
  return () => {
    changeListeners.delete(cb);
  };
}

// Replaces stored values without triggering a sync (used when loading data from the account).
export function writeRaw(entries: Record<string, string | null>) {
  for (const [key, raw] of Object.entries(entries)) {
    try {
      if (raw === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, raw);
    } catch {
      // storage blocked
    }
    cache.delete(key);
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    raw = null;
  }
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  let value: T = fallback;
  if (raw) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

// Current time, read in the browser only (null while prerendering), refreshed once a minute.
let nowCache: { minute: number; date: Date } | null = null;
function readNow(): Date {
  const minute = Math.floor(Date.now() / 60_000);
  if (!nowCache || nowCache.minute !== minute) nowCache = { minute, date: new Date(minute * 60_000) };
  return nowCache.date;
}
function subscribeMinute(listener: () => void) {
  const timer = window.setInterval(listener, 60_000);
  return () => window.clearInterval(timer);
}
export function useNow(): Date | null {
  return useSyncExternalStore(subscribeMinute, readNow, () => null);
}

export function useStored<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback,
  );
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = read(key, fallback);
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // storage blocked: keep working for this page view only
        cache.set(key, { raw: null, value: resolved });
      }
      listeners.forEach((l) => l());
      changeListeners.forEach((l) => l(key));
    },
    [key, fallback],
  );
  return [value, set];
}

