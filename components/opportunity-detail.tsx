"use client";

import { capitalizeName } from "@/lib/user";
import { track } from "@/lib/track";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/dates";
import { GROUP_LABEL } from "@/lib/education";
import { matchOpportunity } from "@/lib/match";
import { EMPTY_SAVED, STORAGE } from "@/lib/profile";
import { addComment, deleteComment, deleteReview, fetchComments, fetchReviews, myLikes, saveReview, setLike, timeAgo, useStats, type Comment, type Review } from "@/lib/social";
import { useNow, useStored } from "@/lib/storage";
import { useProfile } from "@/lib/use-profile";
import type { Opportunity } from "@/lib/types";
import { useAccount } from "./account-provider";
import { CalendarIcon, ChatIcon, ExternalIcon, HeartIcon, PageHero, SignInPrompt, StarPicker, Stars } from "./ui";

const VERDICT = { fits: ["You can apply", "border-emerald-400/50 bg-emerald-500/10 text-emerald-800"], check: ["Check first", "border-amber-300/50 bg-amber-500/10 text-amber-800"], "not-eligible": ["Not open to you", "border-rose-400/50 bg-rose-500/10 text-rose-800"] } as const;

function cost(o: Opportunity): string {
  if (o.costType === "free") return "Free";
  if (o.price) return `${o.price.amount.toLocaleString("en-GB")} ${o.price.currency}`;
  return "Check yourself";
}

function Name({ id, name }: { id: string; name: string | undefined }) {
  return (
    <Link href={`/people?id=${id}`} className="font-medium text-slate-900 hover:text-teal-800">
      {name ? capitalizeName(name) : "Student"}
    </Link>
  );
}

function Avatar({ name }: { name: string | undefined }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
      {(name ?? "?").charAt(0).toUpperCase()}
    </span>
  );
}

export function OpportunityDetail({ o }: { o: Opportunity }) {
  const account = useAccount();
  const [profile] = useProfile();
  const now = useNow();
  const stats = useStats().get(o.id);
  const [saved, setSaved] = useStored(STORAGE.saved, EMPTY_SAVED);
  const [liked, setLiked] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const uid = account.userId;

  const load = useCallback(async () => {
    const [r, c] = await Promise.all([fetchReviews(o.id), fetchComments(o.id)]);
    setReviews(r);
    setComments(c);
  }, [o.id]);

  useEffect(() => {
    let live = true;
    Promise.all([fetchReviews(o.id), fetchComments(o.id)]).then(([r, c]) => {
      if (!live) return;
      setReviews(r);
      setComments(c);
    });
    return () => {
      live = false;
    };
  }, [o.id]);
  useEffect(() => {
    if (uid) void myLikes(uid).then((s) => setLiked(s.has(o.id)));
  }, [uid, o.id]);

  const m = now ? matchOpportunity(o, profile, now) : null;
  const inCalendar = saved.includes(o.id);
  const likes = stats?.likes ?? 0;

  async function toggleLike() {
    if (!uid) return;
    setLiked(!liked);
    await setLike(uid, o.id, !liked);
  }

  const byYear = useMemo(() => {
    const map = new Map<number, Review[]>();
    for (const r of reviews) map.set(r.year, [...(map.get(r.year) ?? []), r]);
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [reviews]);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const facts: [string, string][] = [
    ["Applications open", formatDate(o.applyOpens)],
    ["Deadline", formatDate(o.deadline)],
    ["Event", o.eventDates ?? "TBA"],
    ["Results", formatDate(o.resultsDate)],
    ["Cost", cost(o)],
    ["Travel", o.travelPaid === "full" ? "Paid by organiser" : o.travelPaid === "partial" ? "Partly paid" : o.travelPaid === "none" ? "Not covered" : "Check yourself"],
    ["Format", [o.mode ?? "TBA", o.location].filter(Boolean).join(" · ")],
    ["Who can apply", o.eligibility.levels ? o.eligibility.levels.map((l) => GROUP_LABEL[l]).join(", ") : "Not limited by education level"],
  ];

  return (
    <div className="space-y-10">
      <PageHero kicker={`${o.type.replace("-", " ")} · ${o.provider}`} title={o.title} subtitle={o.note}>
        <div className="flex flex-col items-end gap-2">
          {m && <span className={`rounded-full border px-3 py-1 text-sm ${VERDICT[m.verdict][1]}`}>{VERDICT[m.verdict][0]}</span>}
          {stats && stats.reviews > 0 && (
            <span className="flex items-center gap-2 text-sm text-slate-600">
              <Stars value={stats.avg_rating ?? 0} /> {stats.avg_rating} · {stats.reviews} {stats.reviews === 1 ? "review" : "reviews"}
            </span>
          )}
        </div>
      </PageHero>

      <div className="welcome-in flex flex-wrap gap-3" style={{ animationDelay: "260ms" }}>
        <button
          onClick={toggleLike}
          disabled={!uid}
          title={uid ? undefined : "Log in to like"}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition ${liked ? "border-rose-400/60 bg-rose-500/15 text-rose-800 " : "border-slate-200 bg-panel hover:border-rose-400/50"} disabled:opacity-60`}
        >
          <HeartIcon filled={liked} /> {liked ? "Liked" : "Like"} · {likes + (liked && !stats ? 1 : 0)}
        </button>
        <button
          onClick={() => {
            setSaved(inCalendar ? saved.filter((x) => x !== o.id) : [...saved, o.id]);
            if (!inCalendar) track("save", o.type);
          }}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition ${inCalendar ? "border-cyan-300/60 bg-cyan-400/10 text-teal-800" : "border-slate-200 bg-panel hover:border-cyan-300/50"}`}
        >
          <CalendarIcon /> {inCalendar ? "In your calendar" : "Add to calendar"}
        </button>
        <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white">
          Official page <ExternalIcon />
        </a>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map(([k, v], i) => (
          <div key={k} className="welcome-in rounded-2xl border border-slate-200 bg-panel p-4" style={{ animationDelay: `${300 + i * 40}ms` }}>
            <p className="text-xs uppercase tracking-wider text-slate-500">{k}</p>
            <p className="mt-1 font-medium text-slate-900">{v}</p>
          </div>
        ))}
      </section>

      {m && m.reasons.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-panel p-5">
          <h2 className="mb-2 text-lg font-bold">For you</h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {m.reasons.map((r) => (
              <li key={r} className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-slate-700">
                {r}
              </li>
            ))}
          </ul>
          {o.eligibility.nationality?.evidence && <p className="mt-3 text-xs text-slate-500">From the official page: &ldquo;{o.eligibility.nationality.evidence}&rdquo;</p>}
        </section>
      )}

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-violet-300">From students who took part</p>
            <h2 className="text-3xl font-extrabold">
              Reviews <span className="text-gradient">by year</span>
            </h2>
          </div>
          {reviews.length > 0 && (
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-panel px-5 py-3">
              <span className="font-display text-4xl font-bold text-gradient">{avg.toFixed(1)}</span>
              <div className="space-y-1">
                <Stars value={avg} />
                <p className="text-xs text-slate-500">
                  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </p>
              </div>
              <div className="hidden w-32 space-y-0.5 sm:block">
                {[5, 4, 3, 2, 1].map((n) => {
                  const c = reviews.filter((r) => r.rating === n).length;
                  return (
                    <div key={n} className="flex items-center gap-1 text-[10px] text-slate-500">
                      {n}
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <span className="block h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300" style={{ width: `${(c / reviews.length) * 100}%` }} />
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {uid ? <ReviewForm o={o} uid={uid} mine={reviews.filter((r) => r.user_id === uid)} onSaved={load} /> : <SignInPrompt why="Took part before? Log in to rate it and tell the next students what it was really like." />}

        {byYear.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No reviews yet. If you took part in an earlier year, be the first to share how it went.</p>
        ) : (
          byYear.map(([year, list]) => (
            <div key={year} className="space-y-3">
              <h3 className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                <span className="font-display text-2xl font-bold normal-case tracking-normal text-slate-900">{year}</span> {list.length} {list.length === 1 ? "review" : "reviews"}
                <span className="h-px flex-1 bg-gradient-to-r from-violet-500/40 to-transparent" />
              </h3>
              <ul className="grid gap-3 md:grid-cols-2">
                {list.map((r) => (
                  <li key={r.id} className="glow-card space-y-2 rounded-2xl border border-slate-200 bg-panel p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.profiles?.display_name} />
                      <div className="min-w-0 flex-1 text-sm">
                        <Name id={r.user_id} name={r.profiles?.display_name} />
                        <p className="text-xs text-slate-500">{timeAgo(r.created_at)}</p>
                      </div>
                      <Stars value={r.rating} />
                    </div>
                    <p className="whitespace-pre-line text-sm text-slate-700">{r.body}</p>
                    {r.user_id === uid && (
                      <button onClick={() => deleteReview(r.id).then(load)} className="text-xs text-slate-500 hover:text-rose-700">
                        Delete my review
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <Comments o={o} uid={uid} comments={comments} reload={load} />
    </div>
  );
}

function ReviewForm({ o, uid, mine, onSaved }: { o: Opportunity; uid: string; mine: Review[]; onSaved: () => void }) {
  const thisYear = new Date().getFullYear();
  const [rating, setRating] = useState(0);
  const [year, setYear] = useState(thisYear);
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | string>("idle");
  const existing = mine.find((r) => r.year === year);

  async function submit() {
    if (rating === 0 || body.trim().length < 10) return;
    setState("saving");
    const err = await saveReview({ user_id: uid, opportunity_id: o.id, rating, year, body: body.trim() });
    if (err) setState(err);
    else {
      setState("done");
      setBody("");
      setRating(0);
      onSaved();
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-violet-400/30 bg-panel p-5 ">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">Took part? Leave a review</h3>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          I took part in
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-lg border border-slate-200 px-2 py-1">
            {Array.from({ length: 7 }, (_, i) => thisYear - i).map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>
      <StarPicker value={rating} onChange={setRating} />
      <textarea
        rows={3}
        maxLength={1500}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What was it like? Was it worth it, how hard was it to get in, what should others know?"
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={submit} disabled={rating === 0 || body.trim().length < 10 || state === "saving"} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
          {state === "saving" ? "Saving…" : existing ? `Update my ${year} review` : "Post review"}
        </button>
        <span className="text-xs text-slate-500">{state === "done" ? "Thanks! Your review is live." : state !== "idle" && state !== "saving" ? state : "Shown with your first name. At least 10 characters."}</span>
      </div>
    </div>
  );
}

function Comments({ o, uid, comments, reload }: { o: Opportunity; uid: string | null; comments: Comment[]; reload: () => void }) {
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const top = comments.filter((c) => c.parent_id === null).reverse();

  async function post(body: string, parent: number | null) {
    if (!uid || !body.trim()) return;
    await addComment({ user_id: uid, opportunity_id: o.id, parent_id: parent, body: body.trim() });
    if (parent) {
      setReply("");
      setReplyTo(null);
    } else setText("");
    reload();
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-violet-300">Ask and answer</p>
        <h2 className="flex items-center gap-2 text-3xl font-extrabold">
          Questions <span className="text-gradient">&amp; comments</span>
        </h2>
      </div>
      {uid ? (
        <div className="flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} onKeyDown={(e) => e.key === "Enter" && post(text, null)} placeholder="Ask something or share a tip…" className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
          <button onClick={() => post(text, null)} disabled={!text.trim()} className="flex items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-medium text-white disabled:opacity-40">
            <ChatIcon size={16} /> Post
          </button>
        </div>
      ) : (
        <SignInPrompt why="Log in to ask a question or answer someone else's." />
      )}
      {top.length === 0 && <p className="text-sm text-slate-500">No questions yet.</p>}
      <ul className="space-y-3">
        {top.map((c) => {
          const replies = comments.filter((r) => r.parent_id === c.id);
          return (
            <li key={c.id} className="space-y-3 rounded-2xl border border-slate-200 bg-panel p-4">
              <div className="flex gap-3">
                <Avatar name={c.profiles?.display_name} />
                <div className="min-w-0 flex-1 text-sm">
                  <p>
                    <Name id={c.user_id} name={c.profiles?.display_name} /> <span className="text-xs text-slate-500">· {timeAgo(c.created_at)}</span>
                  </p>
                  <p className="whitespace-pre-line text-slate-700">{c.body}</p>
                  <div className="mt-1 flex gap-3 text-xs">
                    {uid && (
                      <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)} className="text-violet-300 hover:text-teal-800">
                        Reply
                      </button>
                    )}
                    {c.user_id === uid && (
                      <button onClick={() => deleteComment(c.id).then(reload)} className="text-slate-500 hover:text-rose-700">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {replies.length > 0 && (
                <ul className="ml-12 space-y-2 border-l border-violet-400/30 pl-4">
                  {replies.map((r) => (
                    <li key={r.id} className="text-sm">
                      <Name id={r.user_id} name={r.profiles?.display_name} /> <span className="text-xs text-slate-500">· {timeAgo(r.created_at)}</span>
                      <p className="whitespace-pre-line text-slate-700">{r.body}</p>
                      {r.user_id === uid && (
                        <button onClick={() => deleteComment(r.id).then(reload)} className="text-xs text-slate-500 hover:text-rose-700">
                          Delete
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {replyTo === c.id && (
                <div className="ml-12 flex gap-2">
                  <input autoFocus value={reply} onChange={(e) => setReply(e.target.value)} maxLength={1000} onKeyDown={(e) => e.key === "Enter" && post(reply, c.id)} placeholder="Write a reply…" className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  <button onClick={() => post(reply, c.id)} disabled={!reply.trim()} className="rounded-xl bg-teal-700 px-3 text-sm text-white disabled:opacity-40">
                    Reply
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
