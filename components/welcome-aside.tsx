import { opportunities, programs } from "@/lib/data";
import { HapiMark, Wordmark } from "./logo";

const COUNTRIES = new Set(programs.map((p) => p.country)).size;

const POINTS = [
  {
    title: "Only what you can apply to",
    text: "Checked against your passport, age and school.",
    icon: "M20 6 9 17l-5-5",
  },
  {
    title: "The price you would really pay",
    text: "Fees for your nationality, with the official source.",
    icon: "M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  },
  {
    title: "Family can help pay",
    text: "Send a PayPal request to family for any cost.",
    icon: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z",
  },
];

// The left side of the welcome and login screen: what Hapi is, in a few calm lines.
export function WelcomeAside() {
  const numbers = [
    { n: opportunities.length, l: "opportunities" },
    { n: programs.length, l: "programmes" },
    { n: COUNTRIES, l: "countries" },
  ];
  return (
    <aside className="relative flex h-full flex-col justify-between overflow-hidden bg-[#0e1b2e] p-10 text-white lg:p-14">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#1f5eff]/25 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[#ff6b3d]/15 blur-3xl" aria-hidden="true" />

      <div className="relative flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
          <HapiMark size={28} />
        </span>
        <Wordmark className="!text-white text-2xl" />
      </div>

      <div className="relative max-w-md space-y-8">
        <h2 className="font-display text-4xl font-extrabold leading-tight !text-white lg:text-5xl">
          Every chance abroad, in one <span className="text-[#ff8a63]">honest</span> place.
        </h2>
        <ul className="space-y-5">
          {POINTS.map((p, i) => (
            <li key={p.title} className="welcome-in flex gap-4" style={{ animationDelay: `${200 + i * 120}ms` }}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#9cb8ff]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={p.icon} />
                </svg>
              </span>
              <span>
                <span className="block font-semibold text-white">{p.title}</span>
                <span className="block text-sm text-[#c4cfe3]">{p.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative space-y-5">
        <dl className="grid max-w-md grid-cols-3 gap-4 border-t border-white/15 pt-6">
          {numbers.map((x) => (
            <div key={x.l}>
              <dt className="sr-only">{x.l}</dt>
              <dd>
                <span className="font-display block text-3xl font-extrabold !text-white">{x.n}</span>
                <span className="text-sm text-[#c4cfe3]">{x.l}</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-[#c4cfe3]">Built by a student, for students. Free, no ads.</p>
      </div>
    </aside>
  );
}
