"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { opportunities } from "@/lib/data";
import { fetchPublicProfile, timeAgo, type PublicProfile, type Review } from "@/lib/social";
import { useAccount } from "./account-provider";
import { HeartIcon, Stars } from "./ui";

type Data = { profile: PublicProfile | null; likes: string[]; reviews: Review[] };

// A student's public page: first name, what they liked and the reviews they wrote. Nothing else is shown.
export function PeopleView({ id }: { id: string }) {
  const account = useAccount();
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let live = true;
    fetchPublicProfile(id).then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, [id]);

  if (!data) return <p className="pt-10 text-center text-sm text-slate-500">Loading…</p>;
  if (!data.profile) return <p className="pt-10 text-center text-slate-600">This profile does not exist.</p>;
  const { profile, likes, reviews } = data;
  const liked = likes.map((l) => opportunities.find((o) => o.id === l)).filter((o) => o !== undefined);
  const mine = account.userId === id;

  return (
    <div className="space-y-10">
      <header className="relative flex flex-wrap items-center gap-6 pt-4">
        <div className="pointer-events-none absolute -left-16 -top-20 h-60 w-60 rounded-full bg-violet-600/25 blur-3xl" />
        <span className="welcome-in relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-cyan-400 font-display text-4xl font-extrabold text-white shadow-[0_0_50px_-8px_rgba(139,92,246,0.9)]">
          {profile.display_name.charAt(0).toUpperCase()}
        </span>
        <div className="relative space-y-1">
          <p className="welcome-in text-xs font-medium uppercase tracking-[0.3em] text-violet-300">{mine ? "Your public profile" : "Student on Hapi"}</p>
          <h1 className="welcome-in text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ animationDelay: "80ms" }}>
            {profile.display_name}
          </h1>
          <p className="welcome-in text-sm text-slate-500" style={{ animationDelay: "160ms" }}>
            Joined {timeAgo(profile.created_at)} · {liked.length} liked · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </p>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <HeartIcon className="text-rose-700" filled /> Liked
        </h2>
        {liked.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing liked yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {liked.map((o, i) => (
              <li key={o.id} className="welcome-in" style={{ animationDelay: `${i * 40}ms` }}>
                <Link href={`/opportunities/${o.id}`} className="glow-card block rounded-2xl border border-white/10 bg-panel p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">{o.type}</p>
                  <p className="font-medium text-white">{o.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500">No reviews yet.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {reviews.map((r) => {
              const o = opportunities.find((x) => x.id === r.opportunity_id);
              return (
                <li key={r.id} className="glow-card space-y-2 rounded-2xl border border-white/10 bg-panel p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/opportunities/${r.opportunity_id}`} className="font-medium text-white hover:text-cyan-200">
                      {o?.title ?? r.opportunity_id}
                    </Link>
                    <Stars value={r.rating} />
                  </div>
                  <p className="text-xs text-slate-500">Took part in {r.year}</p>
                  <p className="whitespace-pre-line text-sm text-slate-700">{r.body}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

// /people?id=… : read the id from the address.
export function PersonFromQuery() {
  const id = useSearchParams().get("id");
  if (!id) return <p className="pt-10 text-center text-slate-600">No profile selected.</p>;
  return <PeopleView id={id} />;
}
