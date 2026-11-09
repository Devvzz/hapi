"use client";

import { useState, type ReactNode, type SVGProps } from "react";
import { useAccount } from "./account-provider";
import { AuthForm } from "./auth-form";

// Page header in the style of the welcome screen: glowing kicker, big title with a gradient word, soft entrance.
export function PageHero({ kicker, title, highlight, subtitle, children }: { kicker: string; title: string; highlight?: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <header className="relative flex flex-wrap items-end justify-between gap-6 pb-2 pt-4">
      <div className="relative max-w-3xl space-y-3">
        <p className="welcome-in text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">{kicker}</p>
        <h1 className="welcome-in break-words text-[2rem] font-extrabold leading-tight tracking-tight sm:text-5xl" style={{ animationDelay: "80ms" }}>
          {title} {highlight && <span className="text-gradient">{highlight}</span>}
        </h1>
        {subtitle && (
          <p className="welcome-in max-w-2xl text-base text-slate-600" style={{ animationDelay: "160ms" }}>
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="welcome-in relative" style={{ animationDelay: "220ms" }}>
          {children}
        </div>
      )}
    </header>
  );
}

type IconProps = SVGProps<SVGSVGElement> & { size?: number };
const base = (size: number) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });

export function HeartIcon({ size = 18, filled, ...p }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(size)} {...p} fill={filled ? "currentColor" : "none"}>
      <path d="M12 20s-7-4.4-9.2-8.6C1.3 8.5 3 5 6.4 5c2 0 3.3 1.1 4 2.3h3.2C14.3 6.1 15.6 5 17.6 5 21 5 22.7 8.5 21.2 11.4 19 15.6 12 20 12 20z" />
    </svg>
  );
}
export function CalendarIcon({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}
export function ExternalIcon({ size = 16, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}
export function ChatIcon({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M5 18l-1.5 3 4-1.5A9 9 0 1 0 5 18z" />
    </svg>
  );
}

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i + 1));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24">
            <defs>
              <linearGradient id={`s${i}-${Math.round(fill * 100)}`}>
                <stop offset={`${fill * 100}%`} stopColor="#fbbf24" />
                <stop offset={`${fill * 100}%`} stopColor="rgb(255 255 255 / 0.15)" />
              </linearGradient>
            </defs>
            <path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2 6.4 20.2l1.1-6.3L2.9 9.5l6.3-.9z" fill={`url(#s${i}-${Math.round(fill * 100)})`} />
          </svg>
        );
      })}
    </span>
  );
}

export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const words = ["", "Poor", "Okay", "Good", "Great", "Amazing"];
  return (
    <span className="inline-flex items-center gap-2" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onMouseEnter={() => setHover(i)} onClick={() => onChange(i)} aria-label={`${i} stars`} className="transition hover:scale-110">
          <svg width="26" height="26" viewBox="0 0 24 24">
            <path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2 6.4 20.2l1.1-6.3L2.9 9.5l6.3-.9z" fill={i <= shown ? "#fbbf24" : "rgb(255 255 255 / 0.12)"} style={i <= shown ? { filter: "drop-shadow(0 0 6px rgba(251,191,36,0.6))" } : undefined} />
          </svg>
        </button>
      ))}
      <span className="w-16 text-sm text-amber-800">{words[shown]}</span>
    </span>
  );
}

// Shown where an action needs an account: one click opens the sign-up / log-in form right there.
export function SignInPrompt({ why }: { why: string }) {
  const account = useAccount();
  const [open, setOpen] = useState(false);
  if (!account.enabled) return <p className="text-sm text-slate-500">Accounts are not switched on for this copy of Hapi.</p>;
  return (
    <div className="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4">
      {open ? (
        <div className="mx-auto max-w-sm">
          <AuthForm onDone={() => setOpen(false)} />
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-700">{why}</p>
          <button onClick={() => setOpen(true)} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white">
            Create account or log in
          </button>
        </div>
      )}
    </div>
  );
}
