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

// Birds far away over the city: [x, y, size].
const BIRDS: [number, number, number][] = [
  [158, 168, 1],
  [176, 158, 0.8],
  [146, 154, 0.65],
];

// One bird with its wings out, as a small filled shape.
const bird = (x: number, y: number, k: number) =>
  `M${x - 8 * k} ${y - 1 * k} Q${x - 4 * k} ${y - 5 * k} ${x} ${y + 1 * k} Q${x + 4 * k} ${y - 5 * k} ${x + 8 * k} ${y - 1 * k} Q${x + 4 * k} ${y - 2 * k} ${x} ${y + 3 * k} Q${x - 4 * k} ${y - 2 * k} ${x - 8 * k} ${y - 1 * k} Z`;

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
          <linearGradient id="ad-shadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0e1b2e" stopOpacity="0.22" />
            <stop offset="1" stopColor="#0e1b2e" stopOpacity="0" />
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
          <g className="ad-birds" fill="#1e2f4d">
            {BIRDS.map(([x, y, k], i) => (
              <path key={i} className="ad-bird" style={{ animationDelay: `${i * 0.23}s` }} d={bird(x, y, k)} />
            ))}
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

        {/* the student's shadow, falling back towards us and fading out */}
        <path d="M186 374 L214 374 L232 440 L170 440 Z" fill="url(#ad-shadow)" filter="url(#ad-soft)" />

        {/* the student, seen from behind, mid-step into the light */}
        <g className="ad-walker" strokeLinejoin="round">
          {/* sunlight wrapping around the edges */}
          <g fill="#ffd9a8" opacity="0.55" filter="url(#ad-soft)">
            <ellipse cx="200" cy="211" rx="14" ry="15" />
            <path d="M179 232 Q200 222 221 232 L232 290 L168 290 Z" />
          </g>

          {/* legs: the front foot is further away, so it sits a little higher */}
          <path d="M184 292 L199 294 L197.5 330 L196 359 L187 359 L185.5 330 Z" fill="#2c4470" />
          <path d="M201 294 L216 292 L215.5 330 L214.5 366 L205 366 L203 330 Z" fill="#33507f" />
          {/* sneakers, seen from the heel */}
          <path d="M186.5 355 h10 q2 0 2 2 v3 q0 4.5 -5 4.5 h-4 q-5 0 -5 -4.5 v-3 q0 -2 2 -2 z" fill="#f4f1ea" stroke="#0e1b2e" strokeWidth="1" />
          <path d="M185.6 361.5 q5.9 2.5 11.8 0" fill="none" stroke="#ff6b3d" strokeWidth="1.4" />
          <path d="M205 362 h10 q2.2 0 2.2 2 v3.5 q0 4.5 -5 4.5 h-4.4 q-5 0 -5 -4.5 v-3.5 q0 -2 2.2 -2 z" fill="#f4f1ea" stroke="#0e1b2e" strokeWidth="1" />
          <path d="M203.9 369 q6.2 2.5 12.4 0" fill="none" stroke="#ff6b3d" strokeWidth="1.4" />

          {/* jacket */}
          <path d="M182 232 Q200 224 218 232 Q223 236 222 252 L218.5 297 Q200 300 181.5 297 L178 252 Q177 236 182 232 Z" fill="#1d2b45" stroke="#ffd9a8" strokeOpacity="0.6" strokeWidth="1" />
          <path d="M182 293 Q200 296 218 293" fill="none" stroke="#0e1b2e" strokeWidth="1.4" />
          {/* arms hanging loose, hands in the light */}
          <path d="M181 234 Q173 238 171.5 257 L170 285 Q172.5 289 177 287.5 L179.5 262 Q180.5 249 184 242 Z" fill="#24365a" />
          <path d="M219 234 Q227 238 228.5 257 L230 285 Q227.5 289 223 287.5 L220.5 262 Q219.5 249 216 242 Z" fill="#24365a" />
          <ellipse cx="173.5" cy="290.5" rx="3.6" ry="4.6" fill="#d9a07a" />
          <ellipse cx="226.5" cy="290.5" rx="3.6" ry="4.6" fill="#d9a07a" />

          {/* neck, ears and hair */}
          <path d="M195 219 h10 v11 q-5 3 -10 0 z" fill="#c98d68" />
          <ellipse cx="188.6" cy="213" rx="2.4" ry="3.4" fill="#d9a07a" />
          <ellipse cx="211.4" cy="213" rx="2.4" ry="3.4" fill="#d9a07a" />
          <ellipse cx="200" cy="210.5" rx="11.5" ry="12.5" fill="#2a1d17" stroke="#ffd9a8" strokeOpacity="0.7" strokeWidth="1" />
          <path d="M191 203 Q196 199 203 200" fill="none" stroke="#4a3426" strokeWidth="1.4" strokeLinecap="round" />

          {/* backpack */}
          <path d="M187 236 L185 230 M213 236 L215 230" stroke="#c9461f" strokeWidth="3.2" strokeLinecap="round" />
          <rect x="186" y="236" width="28" height="46" rx="8" fill="#ff6b3d" stroke="#ffd9a8" strokeOpacity="0.8" strokeWidth="1" />
          <path d="M196 236.5 q4 -5 8 0" fill="none" stroke="#c9461f" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M189 248 H211" stroke="#c9461f" strokeWidth="1.2" strokeLinecap="round" />
          <rect x="190.5" y="259" width="19" height="16" rx="4.5" fill="#e5532a" />
          <path d="M193 263 H207" stroke="#c9461f" strokeWidth="1" strokeLinecap="round" />
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
