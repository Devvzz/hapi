import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { DemoBanner } from "@/components/demo-banner";
import { Nav } from "@/components/nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hapi – your next step abroad",
  description: "Find student opportunities, check university eligibility, plan the real cost and let your family sponsor it with PayPal.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 print:bg-white">
        <Suspense fallback={null}>
          <DemoBanner />
        </Suspense>
        <Nav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 print:max-w-none print:p-0">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 print:hidden">
          Hapi uses checked data with source links. Values marked &quot;check yourself&quot; are not confirmed. PayPal runs in sandbox mode: no real money moves.
        </footer>
      </body>
    </html>
  );
}
