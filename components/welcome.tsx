"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GlyphField } from "./glyph-field";
import { AbroadDoor } from "./abroad-door";

// Where the doorway sits on the welcome screen, so the floating characters stream into it.
const BOOK_POINT = { x: 0.5, y: 0.2 };
import { DEMO_KEY } from "@/lib/demo";
import { useStored } from "@/lib/storage";
import { useUser, type HapiUser } from "@/lib/user";
import { useAccount } from "./account-provider";
import { AuthForm } from "./auth-form";

const noop = () => () => {};
const GOALS: { value: NonNullable<HapiUser["goal"]>; title: string; text: string }[] = [
  { value: "universities", title: "Study at a university", text: "Bachelor programmes, fees, entry tests, scholarships" },
  { value: "opportunities", title: "Opportunities", text: "Hackathons, competitions, exchanges, internships" },
  { value: "both", title: "Both", text: "Show me everything" },
];

// First visit: ask for a name and what the student is looking for, over an animated background.
export function Welcome() {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [user, setUser] = useUser();
  const [demo] = useStored(DEMO_KEY, false);
  const path = usePathname();
  const router = useRouter();
  const account = useAccount();
  const [step, setStep] = useState<"name" | "goal" | "account" | "login">("name");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<NonNullable<HapiUser["goal"]>>("both");
  const [stay, setStay] = useState(false);
  const [leaving, setLeaving] = useState(false);

  if (!mounted || (user.name && !stay) || demo || path.startsWith("/api")) return null;
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("demo")) return null;

  const clean = name.trim().replace(/\s+/g, " ").slice(0, 40);

  function next(e: FormEvent) {
    e.preventDefault();
    if (clean.length >= 2) setStep("goal");
  }

  function pickGoal(g: NonNullable<HapiUser["goal"]>) {
    setGoal(g);
    if (account.enabled) {
      setStay(true);
      setStep("account");
    } else finish(g);
  }

  // Close the welcome screen; a new student goes on to the profile, a returning one to the home page.
  function finish(g: NonNullable<HapiUser["goal"]> | null) {
    setLeaving(true);
    window.setTimeout(() => {
      if (g) setUser({ name: clean, goal: g, createdAt: user.createdAt ?? new Date().toISOString() });
      setStay(false);
      router.push(g ? "/profile" : "/");
    }, 450);
  }

  return (
    <div className={`fixed inset-0 z-[100] overflow-hidden bg-[#05040b] transition-opacity duration-500 ${leaving ? "opacity-0" : "opacity-100"}`}>
      <div className="welcome-orb left-[-10%] top-[-15%] h-[55vmax] w-[55vmax] bg-violet-600/30" />
      <div className="welcome-orb welcome-orb-2 bottom-[-20%] right-[-10%] h-[50vmax] w-[50vmax] bg-cyan-500/20" />
      <GlyphField density={20000} target={BOOK_POINT} />

      <div className="relative z-10 flex h-full items-center justify-center px-5">
        <div className="w-full max-w-md text-center">
          <div className="welcome-in mx-auto mb-2 flex justify-center">
            <AbroadDoor size={230} />
          </div>

          {step === "name" ? (
            <form onSubmit={next} key="name" className="space-y-6">
              <div className="welcome-in space-y-2" style={{ animationDelay: "120ms" }}>
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-violet-300">Built by a student, for students</p>
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                  Welcome to <span className="text-gradient">hapi</span>
                </h1>
                <p className="text-slate-600">Your next step abroad starts here. What should we call you?</p>
              </div>
              <div className="welcome-in space-y-3" style={{ animationDelay: "260ms" }}>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your first name"
                  autoComplete="given-name"
                  maxLength={40}
                  className="w-full rounded-2xl border border-violet-400/40 px-5 py-4 text-center text-lg"
                />
                <button type="submit" disabled={clean.length < 2} className="w-full rounded-2xl bg-teal-700 px-5 py-3.5 font-semibold text-white transition disabled:opacity-40">
                  Continue
                </button>
              </div>
              {account.enabled && (
                <p className="welcome-in text-sm text-slate-600" style={{ animationDelay: "330ms" }}>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setStay(true);
                      setStep("login");
                    }}
                    className="font-medium text-violet-300 hover:text-cyan-200"
                  >
                    Log in
                  </button>
                </p>
              )}
              <p className="welcome-in text-xs text-slate-500" style={{ animationDelay: "400ms" }}>
                {account.enabled ? "You can also continue without an account." : "Saved only in this browser. No password, no email."}{" "}
                <Link href="/?demo=1" className="text-violet-300 underline-offset-2 hover:underline">
                  Or try it with a sample student
                </Link>
              </p>
            </form>
          ) : step === "account" || step === "login" ? (
            <div key={step} className="welcome-in space-y-5">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight">
                  {step === "login" ? (
                    <>
                      Welcome <span className="text-gradient">back</span>
                    </>
                  ) : (
                    <>
                      Save your <span className="text-gradient">progress</span>
                    </>
                  )}
                </h1>
                <p className="text-slate-600">{step === "login" ? "Log in to load your profile, plans and calendar." : "Create a free account to keep everything and use Hapi on any device."}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-panel p-5">
                <AuthForm start={step === "login" ? "login" : "signup"} name={clean} onDone={() => finish(step === "login" ? null : goal)} />
              </div>
              {step === "account" ? (
                <button onClick={() => finish(goal)} className="text-sm text-slate-500 hover:text-white">
                  Continue without an account →
                </button>
              ) : (
                <button
                  onClick={() => {
                    setStay(false);
                    setStep("name");
                  }}
                  className="text-xs text-slate-500 hover:text-white"
                >
                  ← Back
                </button>
              )}
            </div>
          ) : (
            <div key="goal" className="space-y-6">
              <div className="welcome-in space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Nice to meet you, <span className="text-gradient">{clean}</span>.
                </h1>
                <p className="text-slate-600">What are you looking for?</p>
              </div>
              <div className="space-y-3">
                {GOALS.map((g, i) => (
                  <button
                    key={g.value}
                    onClick={() => pickGoal(g.value)}
                    className="welcome-in glow-card block w-full rounded-2xl border border-white/10 bg-panel px-5 py-4 text-left"
                    style={{ animationDelay: `${120 + i * 110}ms` }}
                  >
                    <span className="font-display block font-semibold text-white">{g.title}</span>
                    <span className="block text-sm text-slate-600">{g.text}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep("name")} className="text-xs text-slate-500 hover:text-slate-700">
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
