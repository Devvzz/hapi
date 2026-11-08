"use client";

import { useState, type FormEvent } from "react";
import { useUser } from "@/lib/user";
import { useAccount } from "./account-provider";

const field = "w-full rounded-xl border border-violet-400/40 px-4 py-3";

// Create an account or log in with email and password.
export function AuthForm({ start = "signup", name: givenName = "", onDone }: { start?: "signup" | "login"; name?: string; onDone?: () => void }) {
  const account = useAccount();
  const [user, setUser] = useUser();
  const [mode, setMode] = useState<"signup" | "login">(start);
  const [name, setName] = useState(givenName || user.name);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const cleanName = name.trim().replace(/\s+/g, " ").slice(0, 40);
    if (mode === "signup") {
      if (cleanName.length < 2) {
        setError("Add your first name.");
        setBusy(false);
        return;
      }
      // The name is saved first so it is part of the first upload to the new account.
      if (!user.name) setUser({ ...user, name: cleanName, createdAt: user.createdAt ?? new Date().toISOString() });
    }
    const result = mode === "signup" ? await account.signUp(cleanName, email.trim(), password) : await account.signIn(email.trim(), password);
    setBusy(false);
    if (!result.ok) setError(result.message);
    else onDone?.();
  }

  return (
    <form onSubmit={submit} className="space-y-3 text-left">
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 text-sm">
        {(["signup", "login"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-lg py-2 transition ${mode === m ? "bg-violet-500/25 text-white shadow-[inset_0_0_0_1px_rgba(167,139,250,0.5)]" : "text-slate-600 hover:text-white"}`}
          >
            {m === "signup" ? "Create account" : "Log in"}
          </button>
        ))}
      </div>
      {mode === "signup" && <input className={field} placeholder="First name" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />}
      <input className={field} type="email" required placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <div className="relative">
        <input
          className={`${field} pr-16`}
          type={show ? "text" : "password"}
          required
          minLength={mode === "signup" ? 8 : undefined}
          placeholder={mode === "signup" ? "Password (at least 8 characters)" : "Password"}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white">
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {error && <p className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-800">{error}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-teal-700 py-3 font-semibold text-white disabled:opacity-50">
        {busy ? "One moment…" : mode === "signup" ? "Create account" : "Log in"}
      </button>
      <p className="text-center text-xs text-slate-500">
        {mode === "signup"
          ? "Your profile, plans, calendar and CV are saved to your account, so you can log in on any device."
          : "Logging in loads your saved account data on this device."}
      </p>
    </form>
  );
}
