"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { DEMO_KEY } from "@/lib/demo";
import { STORAGE } from "@/lib/profile";
import { onStoredChange, writeRaw } from "@/lib/storage";
import { accountsEnabled, supabase } from "@/lib/supabase";

// Everything a student saves in Hapi; synced as one private row per account (row-level security in Supabase).
const SYNC_KEYS = [STORAGE.profile, STORAGE.plan, STORAGE.saved, STORAGE.log, STORAGE.premium, STORAGE.coach, STORAGE.cv, STORAGE.uniMarks, STORAGE.events, STORAGE.user];
const TABLE = "user_data";

type SyncStatus = "idle" | "syncing" | "saved" | "error";
type Result = { ok: true } | { ok: false; message: string };

type Account = {
  enabled: boolean;
  ready: boolean;
  email: string | null;
  status: SyncStatus;
  signUp: (name: string, email: string, password: string) => Promise<Result>;
  signIn: (email: string, password: string) => Promise<Result>;
  signOut: () => Promise<void>;
};

const AccountContext = createContext<Account | null>(null);

function inDemo(): boolean {
  try {
    return window.localStorage.getItem(DEMO_KEY) === "true";
  } catch {
    return false;
  }
}

function snapshot(): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const k of SYNC_KEYS) {
    try {
      out[k] = window.localStorage.getItem(k);
    } catch {
      out[k] = null;
    }
  }
  return out;
}

function friendly(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Email or password is not right.";
  if (/already registered|already been registered/i.test(message)) return "There is already an account with this email. Log in instead.";
  if (/password/i.test(message) && /6|short|weak/i.test(message)) return "Use a password with at least 8 characters.";
  if (/rate limit/i.test(message)) return "Too many tries. Wait a minute and try again.";
  if (/email/i.test(message) && /invalid/i.test(message)) return "That email address does not look right.";
  return "Something went wrong. Try again in a moment.";
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!accountsEnabled);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const timer = useRef<number | null>(null);
  const userId = session?.user.id ?? null;

  const push = useCallback(async (uid: string) => {
    const sb = supabase();
    if (!sb || inDemo()) return;
    setStatus("syncing");
    const { error } = await sb.from(TABLE).upsert({ user_id: uid, data: snapshot(), updated_at: new Date().toISOString() });
    setStatus(error ? "error" : "saved");
  }, []);

  // After sign-in: the account's saved data wins; a new account starts from what is on this device.
  const pull = useCallback(
    async (uid: string) => {
      const sb = supabase();
      if (!sb || inDemo()) return;
      setStatus("syncing");
      const { data, error } = await sb.from(TABLE).select("data").eq("user_id", uid).maybeSingle();
      if (error) {
        setStatus("error");
        return;
      }
      const remote = (data?.data ?? null) as Record<string, string | null> | null;
      if (remote && Object.values(remote).some((v) => v !== null)) {
        writeRaw(Object.fromEntries(SYNC_KEYS.map((k) => [k, remote[k] ?? null])));
        setStatus("saved");
      } else {
        await push(uid);
      }
    },
    [push],
  );

  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
      if (data.session) void pull(data.session.user.id);
    });
    const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_IN" && s) void pull(s.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, [pull]);

  // Every change saved in the app is sent to the account a moment later.
  useEffect(() => {
    if (!userId) return;
    return onStoredChange((key) => {
      if (!(SYNC_KEYS as string[]).includes(key) || inDemo()) return;
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void push(userId), 1200);
    });
  }, [userId, push]);

  const signUp = useCallback(async (name: string, email: string, password: string): Promise<Result> => {
    const sb = supabase();
    if (!sb) return { ok: false, message: "Accounts are not switched on." };
    if (password.length < 8) return { ok: false, message: "Use a password with at least 8 characters." };
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name } } });
    if (error) return { ok: false, message: friendly(error.message) };
    if (!data.session) return { ok: false, message: "Check your inbox to confirm your email, then log in." };
    return { ok: true };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<Result> => {
    const sb = supabase();
    if (!sb) return { ok: false, message: "Accounts are not switched on." };
    const { error } = await sb.auth.signInWithPassword({ email, password });
    return error ? { ok: false, message: friendly(error.message) } : { ok: true };
  }, []);

  // Signing out also clears this device, so the next person on a shared computer starts fresh.
  const signOut = useCallback(async () => {
    const sb = supabase();
    if (!sb) return;
    if (userId) await push(userId);
    await sb.auth.signOut();
    writeRaw(Object.fromEntries(SYNC_KEYS.map((k) => [k, null])));
    setStatus("idle");
  }, [userId, push]);

  return (
    <AccountContext.Provider value={{ enabled: accountsEnabled, ready, email: session?.user.email ?? null, status, signUp, signIn, signOut }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount(): Account {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount outside AccountProvider");
  return ctx;
}
