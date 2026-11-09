import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import { Suspense } from "react";
import { AccountProvider } from "@/components/account-provider";
import { ChatWidget } from "@/components/chat-widget";
import { UsageCounter } from "@/components/usage-counter";
import { Ambient } from "@/components/ambient";
import { DemoBanner } from "@/components/demo-banner";
import { HapiMark } from "@/components/logo";
import { Nav } from "@/components/nav";
import { Welcome } from "@/components/welcome";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: ["400", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Hapi – your next step abroad",
  description: "Built by a student, for students. Find opportunities you can really apply to, check universities, plan the real cost and let family sponsor it with PayPal.",
};

const FOOTER_LINKS = [
  { href: "/about", label: "About Hapi" },
  { href: "/stats", label: "Hapi in numbers" },
  { href: "/premium", label: "Premium" },
];

const FOOTER_NOTES = ["Every fact links to its official source", "“Check yourself” means not confirmed yet", "PayPal runs in sandbox mode, no real money moves"];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col text-slate-900 print:bg-white">
        <Ambient />
        <AccountProvider>
        <Suspense fallback={null}>
          <DemoBanner />
        </Suspense>
        <Welcome />
        <Nav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 print:max-w-none print:p-0">{children}</main>
        <footer className="mt-16 border-t border-slate-200 bg-white/60 print:hidden">
          <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:pb-8 sm:pr-24">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <HapiMark size={28} />
                <div>
                  <p className="font-display text-sm font-bold text-slate-900">Built by a student, for students.</p>
                  <p className="text-xs text-slate-500">
                    Discover<span className="text-teal-700">.</span> Apply<span className="text-teal-700">.</span> Grow<span className="text-[#dc4a14]">.</span>
                  </p>
                </div>
              </div>
              <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
                {FOOTER_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} className="text-slate-700 hover:text-teal-800">
                    {l.label}
                  </Link>
                ))}
              </nav>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-200 pt-4 text-xs text-slate-500">
              {FOOTER_NOTES.map((n) => (
                <li key={n} className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-slate-400" aria-hidden="true" />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </footer>
        <ChatWidget />
        <UsageCounter />
        </AccountProvider>
      </body>
    </html>
  );
}
