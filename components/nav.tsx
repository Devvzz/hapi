"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { AccountMenu } from "./account-menu";
import { Logo } from "./logo";

const icon = (d: ReactNode) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const LINKS: { href: string; label: string; icon: ReactNode; premium?: boolean }[] = [
  { href: "/profile", label: "Profile", icon: icon(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>) },
  { href: "/universities", label: "Universities", icon: icon(<><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c3 2.5 9 2.5 12 0v-5" /></>) },
  { href: "/opportunities", label: "Opportunities", icon: icon(<><path d="M12 3l2.2 5.3L20 9l-4.4 3.8L17 19l-5-3-5 3 1.4-6.2L4 9l5.8-.7z" /></>) },
  { href: "/calendar", label: "Calendar", premium: true, icon: icon(<><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>) },
  { href: "/plan", label: "Cost plan", icon: icon(<><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18M16 15h2" /></>) },
  { href: "/cv", label: "CV", premium: true, icon: icon(<><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></>) },
  { href: "/about", label: "About", icon: icon(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>) },
];

function Dock({ path }: { path: string }) {
  const box = useRef<HTMLDivElement>(null);
  // On narrow screens the dock scrolls; keep the current page in view.
  useEffect(() => {
    const el = box.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (el && box.current && box.current.scrollWidth > box.current.clientWidth) {
      box.current.scrollTo({ left: el.offsetLeft - box.current.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
    }
  }, [path]);
  return (
    <div ref={box} className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/[0.03] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] [scrollbar-width:none]">
      {LINKS.map((l) => {
        const active = path === l.href || path.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`group relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-medium xl:px-3.5 transition-all duration-300 ${
              active
                ? "bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 text-white shadow-[0_0_24px_-4px_rgba(139,92,246,0.9),inset_0_1px_0_rgba(255,255,255,0.25)]"
                : "text-slate-600 hover:bg-white/[0.07] hover:text-white"
            }`}
          >
            <span className={`transition-all duration-300 ${active ? "text-white" : "text-slate-500 group-hover:-translate-y-px group-hover:text-cyan-300 group-hover:drop-shadow-[0_0_6px_rgba(103,232,249,0.8)]"}`}>{l.icon}</span>
            {l.label}
            {l.premium && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-label="Premium" className={active ? "text-amber-200" : "text-amber-300/80"}>
                <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" />
              </svg>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function PremiumButton({ active }: { active: boolean }) {
  return (
    <Link
      href="/premium"
      className={`premium-btn relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-300 hover:scale-[1.04] ${
        active ? "ring-2 ring-amber-200/70" : ""
      }`}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="relative drop-shadow-[0_0_6px_rgba(253,230,138,0.9)]">
        <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" />
      </svg>
      <span className="relative">Premium</span>
    </Link>
  );
}

export function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#070510b3] backdrop-blur-xl print:hidden">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 lg:flex-nowrap">
        <Link href="/" className="shrink-0" aria-label="Hapi home">
          <Logo size={30} />
        </Link>
        <div className="order-3 w-full min-w-0 lg:order-none lg:w-auto lg:flex-1">
          <div className="flex lg:justify-center">
            <Dock path={path} />
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-3 lg:ml-0">
          <PremiumButton active={path === "/premium"} />
          <AccountMenu />
        </div>
      </nav>
    </header>
  );
}
