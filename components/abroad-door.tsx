import { GLYPHS } from "./glyph-field";

// A fixed pick of characters, so the server and the browser render the same thing.
const RISING = [3, 41, 12, 55, 27, 8, 60, 19, 33, 47].map((i) => GLYPHS[i % GLYPHS.length]);

// The arch of the doorway, shared by the frame, the glow and the clip of the view outside.
const ARCH = "M128 372 V118 A72 72 0 0 1 272 118 V372 Z";

// Buildings of a far-away city on the horizon: [x, width, height]. Left and right of the road.
const CITY: [number, number, number][] = [
  [128, 14, 26], [141, 10, 40], [150, 16, 30], [165, 8, 52], [172, 14, 34], [185, 9, 22],
  [207, 10, 28], [216, 15, 46], [230, 9, 36], [238, 13, 58], [250, 11, 30], [260, 14, 42],
];

// Lit windows in the buildings: [x, y]. Some of them blink.
const WINDOWS: [number, number][] = [
  [144, 222], [144, 230], [168, 208], [168, 216], [168, 226], [176, 228], [219, 214], [223, 224], [241, 202], [241, 212], [245, 222], [263, 218], [267, 228],
];

// A student with a backpack, seen from behind, stepping through a glowing doorway into a new country at sunrise.
// Pure SVG and CSS: clouds drift, birds fly, the city lights blink, the light breathes and the student walks on the spot.
export function AbroadDoor({ size = 380, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`abroad-door relative select-none ${className}`} style={{ width: "100%", maxWidth: size }} aria-hidden="true">
      <svg viewBox="0 0 400 440" className="block h-auto w-full overflow-visible">
        <defs>
          <linearGradient id="ad-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3d74ff" />
            <stop offset="0.5" stopColor="#8fb2ff" />
            <stop offset="0.78" stopColor="#ffc9b0" />
            <stop offset="1" stopColor="#ffe3a3" />
          </linearGradient>
          <radialGradient id="ad-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fffbeb" />
            <stop offset="0.45" stopColor="#fde68a" />
            <stop offset="1" stopColor="#fb923c" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ad-road" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff4dc" />
            <stop offset="1" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id="ad-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c9d8ff" />
            <stop offset="1" stopColor="#9db8ff" />
          </linearGradient>
          <linearGradient id="ad-spill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffcf8a" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffcf8a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ad-frame" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0e1b2e" />
            <stop offset="1" stopColor="#1e2f4d" />
          </linearGradient>
          <linearGradient id="ad-leaf" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#eef1f7" />
          </linearGradient>
          <filter id="ad-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="ad-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
          <clipPath id="ad-clip">
            <path d={ARCH} />
          </clipPath>
        </defs>

        {/* floor in front of the door, with the light that falls out of it */}
        <ellipse cx="200" cy="384" rx="170" ry="26" fill="#0e1b2e" opacity="0.06" />
        <polygon className="ad-spill" points="128,372 272,372 380,440 20,440" fill="url(#ad-spill)" />

        {/* soft glow around the doorway */}
        <path d={ARCH} fill="none" stroke="#ffb27a" strokeWidth="18" opacity="0.4" filter="url(#ad-blur)" className="ad-breathe" />

        {/* the country on the other side */}
        <g clipPath="url(#ad-clip)">
          <rect x="120" y="30" width="160" height="350" fill="url(#ad-sky)" />
          <circle cx="200" cy="226" r="50" fill="url(#ad-sun)" className="ad-sun" />
          <circle cx="200" cy="226" r="16" fill="#fffbeb" />
          <g className="ad-clouds" fill="#ffffff" opacity="0.8">
            <ellipse cx="150" cy="110" rx="26" ry="6" />
            <ellipse cx="166" cy="104" rx="16" ry="6" />
            <ellipse cx="248" cy="150" rx="22" ry="5" />
            <ellipse cx="262" cy="145" rx="12" ry="5" />
          </g>
          <g className="ad-birds" fill="none" stroke="#1e2f4d" strokeWidth="1.6" strokeLinecap="round">
            <path className="ad-bird" d="M160 170 q4 -4 8 0 q4 -4 8 0" />
            <path className="ad-bird" d="M178 160 q3 -3 6 0 q3 -3 6 0" style={{ animationDelay: "0.3s" }} />
            <path className="ad-bird" d="M150 158 q2.5 -2.5 5 0 q2.5 -2.5 5 0" style={{ animationDelay: "0.6s" }} />
          </g>
          {/* hills and the city on the horizon */}
          <path d="M120 250 Q150 222 182 244 Q205 228 232 242 Q258 226 280 246 V380 H120 Z" fill="#6f95f0" opacity="0.45" />
          <g fill="#3a5aa8">
            {CITY.map(([x, w, h]) => (
              <rect key={x} x={x} y={252 - h} width={w} height={h} rx="1" />
            ))}
            <path d="M232 214 a7 7 0 0 1 14 0 v4 h-14 z" />
            <rect x="188" y="226" width="2" height="8" />
          </g>
          <g fill="#fde68a">
            {WINDOWS.map(([x, y], i) => (
              <rect key={i} x={x} y={y} width="2.2" height="2.6" className={i % 3 === 0 ? "ad-window" : undefined} style={{ animationDelay: `${(i * 0.7) % 5}s` }} />
            ))}
          </g>
          {/* ground and the road towards the city */}
          <rect x="120" y="252" width="160" height="130" fill="url(#ad-ground)" />
          <polygon points="196,252 204,252 262,372 138,372" fill="url(#ad-road)" />
          <path d="M200 262 V276 M200 290 V308 M200 324 V350" stroke="#ffb27a" strokeWidth="2" strokeDasharray="0" opacity="0.8" />
        </g>

        {/* the door frame */}
        <path d={ARCH} fill="none" stroke="url(#ad-frame)" strokeWidth="5" strokeLinejoin="round" />
        <rect x="118" y="370" width="164" height="7" rx="2" fill="url(#ad-frame)" opacity="0.9" />

        {/* the open door, swung towards us on its left hinge */}
        <path d="M128 112 L76 92 L76 414 L128 372 Z" fill="url(#ad-leaf)" stroke="#0e1b2e" strokeWidth="3" strokeLinejoin="round" />
        <path d="M118 140 L88 128 L88 238 L118 244 Z M118 262 L88 258 L88 380 L118 360 Z" fill="none" stroke="#cfcac0" strokeWidth="1.4" />
        <circle cx="86" cy="252" r="3.4" fill="#ff6b3d" />

        {/* the student's shadow, falling back towards us */}
        <path d="M188 376 L214 376 L236 440 L168 440 Z" fill="#0e1b2e" opacity="0.18" filter="url(#ad-soft)" />

        {/* the student, seen from behind, walking in */}
        <g className="ad-walker">
          <g fill="#ffd9a8" opacity="0.7" filter="url(#ad-soft)">
            <circle cx="200" cy="203" r="14" />
            <path d="M178 226 Q200 214 222 226 L216 292 L184 292 Z" />
          </g>
          <g fill="#0e1b2e" stroke="#0e1b2e" strokeLinecap="round" strokeLinejoin="round">
            {/* back leg, foot lifting */}
            <path className="ad-leg-back" d="M207 288 L213 334 L219 368" fill="none" strokeWidth="13" />
            {/* front leg */}
            <path className="ad-leg-front" d="M193 288 L189 332 L185 374" fill="none" strokeWidth="13" />
            <ellipse cx="184" cy="375" rx="8" ry="3.5" />
            {/* body and jacket */}
            <path d="M180 226 Q200 214 220 226 L216 294 Q200 300 184 294 Z" strokeWidth="2" />
            {/* arms swinging */}
            <path className="ad-arm-left" d="M182 230 L172 262 L174 290" fill="none" strokeWidth="9.5" />
            <path className="ad-arm-right" d="M218 230 L228 260 L226 284" fill="none" strokeWidth="9.5" />
            {/* head and hair */}
            <circle cx="200" cy="203" r="12.5" />
            <path d="M188 200 Q190 188 200 189 Q211 188 212 200 Q206 194 200 195 Q193 194 188 200 Z" fill="#1e2f4d" stroke="none" />
          </g>
          {/* backpack with a rim of sunlight */}
          <rect x="187" y="230" width="26" height="40" rx="7" fill="#ff6b3d" stroke="#ffd9a8" strokeOpacity="0.8" strokeWidth="1.2" />
          <rect x="192" y="252" width="16" height="11" rx="3" fill="#e5532a" />
          <path d="M190 232 L188 226 M210 232 L212 226" stroke="#c9461f" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>

      {/* characters from many alphabets rising out of the light */}
      <div className="pointer-events-none absolute left-[34%] top-[10%] h-[48%] w-[32%]">
        {RISING.map((ch, i) => (
          <span
            key={i}
            className="book-glyph absolute bottom-0 font-semibold"
            style={{ left: `${(i * 37) % 90}%`, animationDelay: `${(i * 0.61) % 6}s`, fontSize: `${12 + ((i * 7) % 10)}px`, color: i % 3 === 0 ? "#ff6b3d" : i % 3 === 1 ? "#1f5eff" : "#0e1b2e" }}
          >
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}
