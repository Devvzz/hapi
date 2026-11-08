"use client";

import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";

// Community data in Supabase: public profiles, likes, reviews (rating + year) and comments.
export type Stats = { opportunity_id: string; likes: number; avg_rating: number | null; reviews: number };
export type Review = { id: number; user_id: string; opportunity_id: string; rating: number; year: number; body: string; created_at: string; profiles: { display_name: string } | null };
export type Comment = { id: number; user_id: string; opportunity_id: string; parent_id: number | null; body: string; created_at: string; profiles: { display_name: string } | null };
export type PublicProfile = { user_id: string; display_name: string; created_at: string };

// One shared copy of the per-opportunity stats, loaded once and refreshed after changes.
let stats: Map<string, Stats> = new Map();
let loaded = false;
const listeners = new Set<() => void>();

export async function refreshStats(): Promise<void> {
  const sb = supabase();
  if (!sb) return;
  const { data } = await sb.from("opportunity_stats").select("*");
  stats = new Map((data ?? []).map((s: Stats) => [s.opportunity_id, { ...s, avg_rating: s.avg_rating === null ? null : Number(s.avg_rating) }]));
  loaded = true;
  listeners.forEach((l) => l());
}

export function useStats(): Map<string, Stats> {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      if (!loaded) void refreshStats();
      return () => listeners.delete(l);
    },
    () => stats,
    () => stats,
  );
}

export async function upsertProfile(userId: string, name: string) {
  const sb = supabase();
  const clean = name.trim().slice(0, 40);
  if (!sb || !clean) return;
  await sb.from("profiles").upsert({ user_id: userId, display_name: clean });
}

export async function myLikes(userId: string): Promise<Set<string>> {
  const sb = supabase();
  if (!sb) return new Set();
  const { data } = await sb.from("likes").select("opportunity_id").eq("user_id", userId);
  return new Set((data ?? []).map((r: { opportunity_id: string }) => r.opportunity_id));
}

export async function setLike(userId: string, opportunityId: string, on: boolean): Promise<boolean> {
  const sb = supabase();
  if (!sb) return false;
  const { error } = on
    ? await sb.from("likes").upsert({ user_id: userId, opportunity_id: opportunityId })
    : await sb.from("likes").delete().eq("user_id", userId).eq("opportunity_id", opportunityId);
  void refreshStats();
  return !error;
}

export async function fetchReviews(opportunityId: string): Promise<Review[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data } = await sb.from("reviews").select("*, profiles(display_name)").eq("opportunity_id", opportunityId).order("year", { ascending: false }).order("created_at", { ascending: false });
  return (data ?? []) as Review[];
}

export async function saveReview(r: { user_id: string; opportunity_id: string; rating: number; year: number; body: string }): Promise<string | null> {
  const sb = supabase();
  if (!sb) return "Accounts are not switched on.";
  const { error } = await sb.from("reviews").upsert(r, { onConflict: "user_id,opportunity_id,year" });
  void refreshStats();
  return error ? "Could not save your review. Try again." : null;
}

export async function deleteReview(id: number) {
  const sb = supabase();
  if (!sb) return;
  await sb.from("reviews").delete().eq("id", id);
  void refreshStats();
}

export async function fetchComments(opportunityId: string): Promise<Comment[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data } = await sb.from("comments").select("*, profiles(display_name)").eq("opportunity_id", opportunityId).order("created_at", { ascending: true });
  return (data ?? []) as Comment[];
}

export async function addComment(c: { user_id: string; opportunity_id: string; parent_id: number | null; body: string }): Promise<string | null> {
  const sb = supabase();
  if (!sb) return "Accounts are not switched on.";
  const { error } = await sb.from("comments").insert(c);
  return error ? "Could not post. Try again." : null;
}

export async function deleteComment(id: number) {
  const sb = supabase();
  if (!sb) return;
  await sb.from("comments").delete().eq("id", id);
}

export async function fetchPublicProfile(userId: string): Promise<{ profile: PublicProfile | null; likes: string[]; reviews: Review[] }> {
  const sb = supabase();
  if (!sb) return { profile: null, likes: [], reviews: [] };
  const [p, l, r] = await Promise.all([
    sb.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    sb.from("likes").select("opportunity_id").eq("user_id", userId).order("created_at", { ascending: false }),
    sb.from("reviews").select("*, profiles(display_name)").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);
  return {
    profile: (p.data as PublicProfile | null) ?? null,
    likes: (l.data ?? []).map((x: { opportunity_id: string }) => x.opportunity_id),
    reviews: (r.data ?? []) as Review[],
  };
}

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(1, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
