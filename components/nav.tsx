"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountMenu } from "./account-menu";
import { Logo } from "./logo";

const LINKS = [
  { href: "/profile", label: "Profile" },
  { href: "/universities", label: "Universities" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/calendar", label: "Calendar" },
  { href: "/plan", label: "Cost plan" },
  { href: "/cv", label: "CV" },
  { href: "/about", label: "About" },
  { href: "/premium", label: "✦ Premium", mobileOnly: true },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07051099] backdrop-blur-xl print:hidden">
      <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0" aria-label="Hapi home">
          <Logo size={30} />
        </Link>
        <div className="-mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
          {LINKS.map((l) => {
            const active = path === l.href || path.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition ${"mobileOnly" in l ? "sm:hidden " : ""}${
                  active
                    ? "bg-violet-500/20 text-white shadow-[inset_0_0_0_1px_rgba(167,139,250,0.6),0_0_16px_-4px_rgba(139,92,246,0.9)]"
                    : "text-slate-600 hover:bg-white/5 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        <Link
          href="/premium"
          className={`hidden shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium sm:inline-flex ${
            path === "/premium" ? "border-cyan-300/70 bg-cyan-400/15 text-cyan-100" : "border-violet-400/50 text-violet-200 hover:border-cyan-300/70 hover:text-cyan-100"
          }`}
        >
          ✦ Premium
        </Link>
        <AccountMenu />
      </nav>
    </header>
  );
}
