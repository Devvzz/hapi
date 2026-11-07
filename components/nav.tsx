import Link from "next/link";

const LINKS = [
  { href: "/opportunities", label: "Opportunities" },
  { href: "/universities", label: "Universities" },
  { href: "/plan", label: "Cost plan" },
  { href: "/profile", label: "My profile" },
  { href: "/premium", label: "Premium" },
];

export function Nav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-teal-700">
          Hapi
        </Link>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm text-slate-600 hover:text-teal-700">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
