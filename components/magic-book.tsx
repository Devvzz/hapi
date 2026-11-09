import { GLYPHS } from "./glyph-field";

// A fixed pick of characters so the server and the browser render the same thing.
const RISING = [3, 41, 12, 55, 27, 8, 60, 19, 33, 47, 1, 66, 24, 52].map((i) => GLYPHS[i % GLYPHS.length]);
const RING = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ ✦ ".repeat(2);

function Lines() {
  return (
    <div className="absolute inset-x-[14%] top-[14%] space-y-[7%]" aria-hidden="true">
      {[92, 80, 88, 64, 86, 72, 90, 58].map((wd, i) => (
        <div key={i} className="book-line h-[3px] rounded-full" style={{ width: `${wd}%`, animationDelay: `${i * 0.35}s` }} />
      ))}
    </div>
  );
}

// An open book of knowledge: pages glow and turn, characters from many alphabets rise out of it,
// and a ring of runes turns slowly underneath. Pure CSS animation; it holds still for reduced motion.
export function MagicBook({ size = 320, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`magic-book relative select-none ${className}`} style={{ width: size, height: size * 0.9 }} aria-hidden="true">
      {/* rune ring */}
      <svg viewBox="0 0 200 200" className="book-ring absolute left-1/2 top-[58%] w-[118%] -translate-x-1/2 -translate-y-1/2">
        <defs>
          <path id="ringPath" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0" />
        </defs>
        <circle cx="100" cy="100" r="92" fill="none" stroke="rgb(167 139 250 / 0.25)" strokeWidth="0.6" />
        <circle cx="100" cy="100" r="72" fill="none" stroke="rgb(103 232 249 / 0.2)" strokeWidth="0.6" strokeDasharray="2 4" />
        <text fill="rgb(196 181 253 / 0.55)" fontSize="10" letterSpacing="3">
          <textPath href="#ringPath">{RING}</textPath>
        </text>
      </svg>

      {/* glow */}
      <div className="book-glow absolute left-1/2 top-[38%] h-[70%] w-[90%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(167,139,250,0.55),rgba(34,211,238,0.18),transparent)] blur-2xl" />

      {/* rising characters */}
      <div className="absolute inset-x-[18%] top-[18%] h-[46%]">
        {RISING.map((ch, i) => (
          <span
            key={i}
            className="book-glyph absolute bottom-0 font-semibold"
            style={{ left: `${(i * 37) % 92}%`, animationDelay: `${(i * 0.53) % 6}s`, fontSize: `${14 + ((i * 7) % 12)}px`, color: i % 3 === 0 ? "#fde68a" : i % 3 === 1 ? "#c4b5fd" : "#67e8f9" }}
          >
            {ch}
          </span>
        ))}
      </div>

      {/* the book */}
      <div className="book-body absolute bottom-[8%] left-1/2 h-[44%] w-[92%] -translate-x-1/2" style={{ perspective: size * 3 }}>
        <div className="absolute inset-x-[-3%] bottom-[-6%] top-[6%] rounded-[10px] bg-gradient-to-b from-[#4c1d95] to-[#1e1240] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.9),inset_0_0_0_2px_rgba(253,230,138,0.45)]" />
        <div className="absolute inset-0 flex" style={{ transformStyle: "preserve-3d" }}>
          <div className="book-page relative h-full w-1/2 origin-right rounded-l-md" style={{ transform: "rotateY(14deg)" }}>
            <Lines />
          </div>
          <div className="book-page relative h-full w-1/2 origin-left rounded-r-md" style={{ transform: "rotateY(-14deg)" }}>
            <Lines />
          </div>
          <div className="book-turn book-page absolute right-0 h-full w-1/2 origin-left rounded-r-md">
            <Lines />
          </div>
        </div>
        <div className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 bg-gradient-to-b from-[#fde68a] via-[#a78bfa] to-transparent opacity-80 blur-[1px]" />
      </div>
    </div>
  );
}
