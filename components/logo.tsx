import { useId } from "react";

// The Hapi mark: an italic H whose crossbar is a rising arrow (violet to cyan).
export function HapiMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset="0.55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d9d3ff" />
        </linearGradient>
        <mask id={`m${id}`}>
          <rect width="64" height="64" fill="white" />
          <path d="M4 53 C 18 49, 33 41, 48 18" fill="none" stroke="black" strokeWidth="17" strokeLinecap="round" />
          <path d="M61 4 L40 10 L55 25 Z" fill="black" stroke="black" strokeWidth="6" strokeLinejoin="round" />
        </mask>
        <filter id={`f${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>
      <g mask={`url(#m${id})`} fill={`url(#b${id})`}>
        <path d="M7 17 L22 9 L22 55 L7 63 Z" />
        <path d="M38 9 L53 1 L53 47 L38 55 Z" />
      </g>
      <g fill={`url(#g${id})`}>
        <path d="M4 53 C 18 49, 33 41, 48 18" fill="none" stroke={`url(#g${id})`} strokeWidth="10" strokeLinecap="round" opacity="0.5" filter={`url(#f${id})`} />
        <path d="M4 53 C 18 49, 33 41, 48 18" fill="none" stroke={`url(#g${id})`} strokeWidth="8.5" strokeLinecap="round" />
        <path d="M61 4 L40 10 L55 25 Z" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display relative inline-flex items-baseline font-bold tracking-tight text-white ${className}`}>
      hap
      <span className="relative">
        ı
        <span className="absolute left-1/2 top-[0.08em] h-[0.2em] w-[0.2em] -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-400 to-cyan-300 shadow-[0_0_10px_rgba(167,139,250,0.9)]" />
      </span>
    </span>
  );
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <HapiMark size={size} />
      <Wordmark className="text-2xl" />
    </span>
  );
}
