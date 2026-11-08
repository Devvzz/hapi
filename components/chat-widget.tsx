"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EMPTY_MARKS, EMPTY_PREMIUM, EMPTY_SAVED, STORAGE } from "@/lib/profile";
import { useStored } from "@/lib/storage";
import { useProfile } from "@/lib/use-profile";

type Msg = { role: "user" | "assistant"; content: string };
const NO_MESSAGES: Msg[] = [];
const CHAT_KEY = "hapi.chat";

const STARTERS = ["What can I apply to this month?", "Which universities are cheapest for me?", "Which scholarships fit me?", "How do I write a motivation letter?"];

// Turns [text](/path) and [text](https://...) into links; everything else stays plain text.
function Rich({ text: raw }: { text: string }) {
  const text = raw.replace(/^\s*[*-]\s+/gm, "• ").replace(/^#{1,4}\s+/gm, "");
  const parts: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(((?:\/|https:\/\/)[^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[3]) parts.push(<strong key={m.index}>{m[3]}</strong>);
    else if (m[2].startsWith("/"))
      parts.push(
        <Link key={m.index} href={m[2]} className="text-cyan-300 underline underline-offset-2">
          {m[1]}
        </Link>,
      );
    else
      parts.push(
        <a key={m.index} href={m[2]} target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline underline-offset-2">
          {m[1]}
        </a>,
      );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <span className="whitespace-pre-wrap">{parts}</span>;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [premium] = useStored(STORAGE.premium, EMPTY_PREMIUM);
  const [profile] = useProfile();
  const [saved] = useStored(STORAGE.saved, EMPTY_SAVED);
  const [marks] = useStored(STORAGE.uniMarks, EMPTY_MARKS);
  const [messages, setMessages] = useStored(CHAT_KEY, NO_MESSAGES);
  const [input, setInput] = useState("");
  const [state, setState] = useState<"idle" | "thinking" | "error">("idle");
  const end = useRef<HTMLDivElement>(null);
  const active = premium.status === "ACTIVE" && premium.subscriptionId;

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, state, open]);

  async function send(text: string) {
    const q = text.trim().slice(0, 1500);
    if (!q || state === "thinking" || !premium.subscriptionId) return;
    const next = [...messages, { role: "user" as const, content: q }].slice(-20);
    setMessages(next);
    setInput("");
    setState("thinking");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: premium.subscriptionId,
          profile,
          savedIds: saved,
          starredIds: Object.keys(marks).filter((k) => marks[k] === "apply"),
          messages: next,
        }),
      });
      const data = (await res.json()) as { reply?: string };
      if (!res.ok || !data.reply) throw new Error("failed");
      const reply: Msg = { role: "assistant", content: data.reply };
      setMessages([...next, reply].slice(-20));
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div className="welcome-in flex h-[min(34rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-violet-400/30 bg-[#0d0a1a]/95 shadow-[0_30px_80px_-20px_rgba(139,92,246,0.7)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="font-display text-sm font-semibold text-white">Ask Hapi</p>
              <p className="text-[11px] text-slate-500">Answers from checked data only</p>
            </div>
            <div className="flex items-center gap-1">
              {active && messages.length > 0 && (
                <button onClick={() => setMessages([])} className="rounded-full px-2 py-1 text-xs text-slate-500 hover:text-white">
                  Clear
                </button>
              )}
              <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full px-2 py-1 text-lg leading-none text-slate-500 hover:text-white">
                ×
              </button>
            </div>
          </div>

          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#fcd34d]">Premium</p>
              <p className="font-display text-lg font-semibold text-white">Your own study-abroad assistant</p>
              <p className="text-sm text-slate-600">Ask anything: what you can apply to, which universities you can afford, how to write your motivation letter. It knows your profile and only uses checked data.</p>
              <Link href="/premium" onClick={() => setOpen(false)} className="premium-btn relative overflow-hidden rounded-full px-5 py-2 text-sm font-semibold text-white">
                <span className="relative">Get Premium · €2.99/month</span>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
                {messages.length === 0 && (
                  <div className="space-y-3">
                    <p className="text-slate-600">Hi! Ask me about opportunities, universities, costs or applications. I only use what Hapi has checked for you.</p>
                    <div className="flex flex-wrap gap-2">
                      {STARTERS.map((s) => (
                        <button key={s} onClick={() => send(s)} className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-left text-xs text-violet-200 transition hover:border-cyan-300/60 hover:text-white">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${m.role === "user" ? "rounded-br-sm bg-gradient-to-r from-violet-600 to-indigo-500 text-white" : "rounded-bl-sm bg-white/[0.06] text-slate-800"}`}>
                      {m.role === "assistant" ? <Rich text={m.content} /> : m.content}
                    </div>
                  </div>
                ))}
                {state === "thinking" && (
                  <div className="flex gap-1 px-1" aria-label="Thinking">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-violet-300" style={{ animationDelay: `${i * 120}ms` }} />
                    ))}
                  </div>
                )}
                {state === "error" && <p className="text-xs text-rose-700">The AI is busy right now. Try again in a moment.</p>}
                <div ref={end} />
              </div>
              <form
                className="flex gap-2 border-t border-white/10 p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about going abroad…"
                  maxLength={1500}
                  className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm"
                />
                <button type="submit" disabled={!input.trim() || state === "thinking"} className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open Ask Hapi chat"}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 via-indigo-500 to-cyan-500 text-white shadow-[0_10px_30px_-6px_rgba(139,92,246,0.9)] transition-transform hover:scale-105"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M5 18l-1.5 3 4-1.5A9 9 0 1 0 5 18zM8.5 11h.01M12 11h.01M15.5 11h.01" />}
        </svg>
        {!active && !open && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fcd34d" className="absolute -right-0.5 -top-0.5 drop-shadow" aria-hidden="true">
            <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
