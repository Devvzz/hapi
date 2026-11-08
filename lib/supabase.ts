"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Accounts are optional: without these two public settings the app works on this device only.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "hapi.auth" } });
  return client;
}

export const accountsEnabled = Boolean(url && key);
