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
        <footer className="mt-10 border-t border-white/10 print:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2 text-slate-600">
              <HapiMark size={18} />
              <span>
                <span className="font-display font-semibold text-slate-800">Built by a student, for students.</span> Discover. Apply. Grow.
              </span>
            </span>
            <span>
              <Link href="/about" className="text-violet-300 hover:text-cyan-200">
                About Hapi
              </Link>{" "}
              ·{" "}
              <Link href="/stats" className="text-violet-300 hover:text-cyan-200">
                Hapi in numbers
              </Link>{" "}
              · Checked data with source links · &quot;check yourself&quot; means not confirmed · PayPal in sandbox mode, no real money moves
            </span>
          </div>
        </footer>
        <ChatWidget />
        <UsageCounter />
        </AccountProvider>
      </body>
    </html>
  );
}
