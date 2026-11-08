"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/user";
import { useAccount } from "./account-provider";
import { AuthForm } from "./auth-form";

const STATUS_TEXT = { idle: "", syncing: "Saving…", saved: "All changes saved", error: "Could not save. Retrying on next change." } as const;

// The avatar in the top bar: who is signed in, sync status, and sign in / out.
export function AccountMenu() {
  const [user] = useUser();
  const account = useAccount();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<null | "signup" | "login">(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  if (!user.name && !account.email) return null;
  const initial = (user.name || account.email || "?").charAt(0).toUpperCase();

  return (
    <div ref={box} className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3 text-sm text-slate-700 hover:border-violet-400/60"
        aria-expanded={open}
      >
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-xs font-bold text-white">
          {initial}
          {account.email && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#070510] bg-emerald-400" />}
        </span>
        <span className="hidden max-w-24 truncate xl:inline">{user.name || "Account"}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-72 space-y-3 rounded-2xl border border-white/10 bg-[#0d0a1ef2] p-4 text-sm shadow-[0_20px_60px_-15px_rgba(139,92,246,0.7)] backdrop-blur-xl">
          <div>
            <p className="font-display font-semibold text-white">{user.name || "Your account"}</p>
            <p className="text-xs text-slate-500">{account.email ?? "Saved on this device only"}</p>
            {account.email && STATUS_TEXT[account.status] && (
              <p className={`mt-1 text-xs ${account.status === "error" ? "text-rose-700" : "text-emerald-700"}`}>{STATUS_TEXT[account.status]}</p>
            )}
          </div>
          <Link href="/profile" onClick={() => setOpen(false)} className="block rounded-lg px-2 py-1.5 text-slate-700 hover:bg-white/5">
            My profile
          </Link>
          {account.userId && (
            <Link href={`/people?id=${account.userId}`} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-1.5 text-slate-700 hover:bg-white/5">
              My public page: likes and reviews
            </Link>
          )}
          {account.enabled && !account.email && (
            <div className="space-y-2 rounded-xl border border-violet-400/30 bg-violet-500/10 p-3">
              <p className="text-xs text-slate-700">Create an account to keep your data and use it on any device.</p>
              <div className="flex gap-2">
                <button onClick={() => { setDialog("signup"); setOpen(false); }} className="flex-1 rounded-lg bg-teal-700 py-1.5 text-xs font-medium text-white">
                  Create account
                </button>
                <button onClick={() => { setDialog("login"); setOpen(false); }} className="flex-1 rounded-lg border border-white/15 py-1.5 text-xs">
                  Log in
                </button>
              </div>
            </div>
          )}
          {account.email && (
            <button
              onClick={async () => {
                setOpen(false);
                await account.signOut();
              }}
              className="w-full rounded-lg border border-white/10 py-1.5 text-slate-700 hover:border-rose-400/50 hover:text-rose-800"
            >
              Sign out
            </button>
          )}
        </div>
      )}

      {dialog && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
          <div className="welcome-in w-full max-w-sm space-y-4 rounded-3xl border border-violet-400/40 bg-[#0b0818f2] p-6 shadow-[0_0_80px_-20px_rgba(139,92,246,0.9)]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Your Hapi account</h2>
              <button onClick={() => setDialog(null)} className="text-slate-500 hover:text-white" aria-label="Close">
                ✕
              </button>
            </div>
            <AuthForm start={dialog} onDone={() => setDialog(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
