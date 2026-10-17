import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { INDUSTRIES, type IndustryKey } from "../convex/industries";
import { Icon, VerdictDot, type IconName } from "./Icons";
import { art, color, prefersReducedMotion, text } from "./theme";

// The guide opens and plays by itself the first time someone visits each category (Decision 1).
// Set to false to keep it closed until tapped.
const GUIDE_AUTO_OPEN_FIRST_VISIT = true;

// "shade" draws a shape as a flat silhouette, for the hard shadow a flash throws behind it.
type Tone = "ink" | "muted" | "dim" | "shade";
const SHADE = "#121418";
const TONES: Record<Tone, { line: string; soft: string; fill: string; glass: string; lamp: string; shadow: string }> = {
  ink: { line: color.ink, soft: art.grey, fill: "#fff", glass: art.inkGlass, lamp: color.accent, shadow: art.inkShadow },
  muted: { line: art.mutedLine, soft: art.mutedSoft, fill: art.mutedFill, glass: art.mutedGlass, lamp: art.mutedLamp, shadow: "transparent" },
  dim: { line: "#4d525c", soft: "#3b3f47", fill: "#262a30", glass: "#2e3238", lamp: "#5a5032", shadow: "#16181c" },
  shade: { line: SHADE, soft: SHADE, fill: SHADE, glass: SHADE, lamp: SHADE, shadow: "transparent" },
};

// Drawn in a 220×100 box, wheels on y=100, front three-quarter view.
function Car({ tone = "ink" }: { tone?: Tone }) {
  const t = TONES[tone];
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx="114" cy="100" rx="104" ry="4.5" fill={t.shadow} />
      <circle cx="25" cy="89" r="10" fill={t.fill} stroke={t.line} strokeWidth="2.5" />
      <path d="M8 84 V53 L52 48 L88 23 L127 20 L182 22 L204 43 L214 46 L216 80 L211 84 L60 89 Z" fill={t.fill} stroke={t.line} strokeWidth="2.5" />
      <path d="M52 48 L98 46 L127 20 L88 23 Z" fill={t.glass} stroke={t.line} strokeWidth="2" />
      <path d="M106 43 L128 25 H150 V43 Z M156 43 V25 L177 26 L195 43 Z" fill={t.glass} stroke={t.line} strokeWidth="2" />
      <path d="M8 53 L60 50 V89 M60 50 L98 46 L204 44 M153 46 V85" fill="none" stroke={t.line} strokeWidth="2" />
      <path d="M60 67 L214 62 M8 76 L60 79" fill="none" stroke={t.soft} strokeWidth="1.8" />
      <path d="M100 45 L94 41 L101 39 Z" fill={t.fill} stroke={t.line} strokeWidth="1.8" />
      <path d="M42 56 L56 55 V61 L42 62 Z M12 57 L23 56.5 V62 L12 62.5 Z" fill={t.lamp} stroke={t.line} strokeWidth="1.6" />
      <path d="M27 65 L39 64.5 V72 L27 72.5 Z" fill="none" stroke={t.soft} strokeWidth="1.8" />
      <path d="M66 88 A19 19 0 0 1 103 86 M169 85 A18 18 0 0 1 204 83" fill="none" stroke={t.line} strokeWidth="2" />
      {[[84, 86, 14], [186, 87, 13]].map(([cx, cy, r]) => (
        <g key={cx}>
          <circle cx={cx} cy={cy} r={r} fill={t.fill} stroke={t.line} strokeWidth="2.5" />
          <circle cx={cx} cy={cy} r={r * 0.42} fill="none" stroke={t.soft} strokeWidth="2" />
        </g>
      ))}
    </g>
  );
}

// Drawn in a 100×100 box, base on y=100, front three-quarter view. Closed lid, ribbon and bow.
function GiftBox({ tone = "ink" }: { tone?: Tone }) {
  const t = TONES[tone];
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx="49" cy="97" rx="46" ry="5" fill={t.shadow} />
      <path d="M68 46 L86 36 V90 L68 100 Z" fill={t.glass} stroke={t.line} strokeWidth="2.5" />
      <rect x="8" y="46" width="60" height="54" fill={t.fill} stroke={t.line} strokeWidth="2.5" />
      <path d="M32 46 H44 V100 H32 Z M75.2 42 L78.8 40 V94 L75.2 96 Z" fill={t.lamp} stroke={t.line} strokeWidth="1.8" />
      <path d="M4 32 L22 22 H90 L72 32 Z" fill={t.fill} stroke={t.line} strokeWidth="2.5" />
      <path d="M72 32 L90 22 V38 L72 48 Z" fill={t.glass} stroke={t.line} strokeWidth="2.5" />
      <rect x="4" y="32" width="68" height="16" fill={t.fill} stroke={t.line} strokeWidth="2.5" />
      <path
        d="M9.4 29 H77.4 L84.6 25 H16.6 Z M32 32 H44 L62 22 H50 Z M32 32 H44 V48 H32 Z M79.2 28 L82.8 26 V42 L79.2 44 Z"
        fill={t.lamp}
        stroke={t.line}
        strokeWidth="1.8"
      />
      <path d="M47 25 C40 11 25 11 27 21 C28 27 40 27 47 25 Z M47 25 C54 11 69 11 67 21 C66 27 54 27 47 25 Z" fill={t.lamp} stroke={t.line} strokeWidth="2" />
      <ellipse cx="47" cy="25" rx="4.5" ry="3.5" fill={t.lamp} stroke={t.line} strokeWidth="2" />
    </g>
  );
}

// Outline of a shirt on a hanger, in a 100×116 box.
const SHIRT = "M42 18 L16 30 L8 88 L19 90 L25 50 V104 Q26 114 50 114 Q74 114 75 104 V50 L81 90 L92 88 L84 30 L58 18 Q50 24 42 18 Z";

// Drawn in a 100×116 box: nail at the top, hanger hook, shirt hanging below.
function HangingShirt({ tone = "ink" }: { tone?: Tone }) {
  const t = TONES[tone];
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d="M50 21 V10 A4 4 0 0 1 58 10 V12" fill="none" stroke={t.line} strokeWidth="2.2" />
      <circle cx="54" cy="8" r="2" fill={t.line} />
      <path d={SHIRT} fill={t.fill} stroke={t.line} strokeWidth="2.5" />
      <path d="M25 50 L21 31 M75 50 L79 31 M9.5 80 L20 82 M90.5 80 L80 82 M50 28 V114" fill="none" stroke={t.soft} strokeWidth="1.8" />
      <rect x="30" y="42" width="12" height="12" rx="1.5" fill="none" stroke={t.soft} strokeWidth="1.8" />
      <path d="M42 18 L50 29 L43 34 L37 20.5 Z M58 18 L50 29 L57 34 L63 20.5 Z" fill={t.glass} stroke={t.line} strokeWidth="2" />
      {[42, 56, 70, 84, 98].map((y) => (
        <circle key={y} cx="50" cy={y} r="1.8" fill={t.line} />
      ))}
    </g>
  );
}

// Drawn in a 50×100 box, base on y=100: serum bottle with a dropper cap, label facing.
function Serum({ tone = "ink" }: { tone?: Tone }) {
  const t = TONES[tone];
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx="25" cy="99" rx="27" ry="3.5" fill={t.shadow} />
      <path d="M18 31 V18 Q18 6 25 6 Q32 6 32 18 V31 Z" fill={t.line} stroke={t.line} strokeWidth="2" />
      <rect x="14" y="30" width="22" height="10" rx="1.5" fill={t.fill} stroke={t.line} strokeWidth="2" />
      <path d="M16 40 H34 Q46 41 46 52 V93 Q46 100 39 100 H11 Q4 100 4 93 V52 Q4 41 16 40 Z" fill={t.glass} stroke={t.line} strokeWidth="2.5" />
      <rect x="9" y="56" width="32" height="31" rx="2" fill={t.fill} stroke={t.line} strokeWidth="1.8" />
      <rect x="9" y="61" width="32" height="7" fill={t.lamp} stroke={t.line} strokeWidth="1.6" />
      <path d="M15 75 H35 M15 81 H29" stroke={t.soft} strokeWidth="1.8" />
    </g>
  );
}

// Drawn in a 70×50 box, base on y=50: cream jar with a screw lid.
function Jar({ tone = "ink" }: { tone?: Tone }) {
  const t = TONES[tone];
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx="35" cy="49" rx="34" ry="3" fill={t.shadow} />
      <path d="M8 17 H62 V42 Q62 50 54 50 H16 Q8 50 8 42 Z" fill={t.glass} stroke={t.line} strokeWidth="2.5" />
      <rect x="15" y="24" width="40" height="19" rx="2" fill={t.fill} stroke={t.line} strokeWidth="1.8" />
      <path d="M21 30 H49 M21 36 H41" stroke={t.soft} strokeWidth="1.8" />
      <rect x="5" y="4" width="60" height="14" rx="3" fill={t.fill} stroke={t.line} strokeWidth="2.5" />
      <path d="M14 7 V15 M24 7 V15 M34 7 V15 M44 7 V15 M54 7 V15" stroke={t.soft} strokeWidth="1.6" />
    </g>
  );
}

// One path per corner, each measured as length 1, so in the guide all four trace themselves at once
// (one path with four pieces would trace them one after another in some browsers and together in others).
function Corners({ x, y, w, h, len = 14 }: { x: number; y: number; w: number; h: number; len?: number }) {
  const corners = [
    `M${x} ${y + len}V${y}H${x + len}`,
    `M${x + w - len} ${y}H${x + w}V${y + len}`,
    `M${x + w} ${y + h - len}V${y + h}H${x + w - len}`,
    `M${x + len} ${y + h}H${x}V${y + h - len}`,
  ];
  return (
    <g fill="none" stroke={color.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {corners.map((d) => (
        <path key={d} className="pg-corners" pathLength={1} d={d} />
      ))}
    </g>
  );
}

function Phone({ x, y, tone = "ink" }: { x: number; y: number; tone?: Tone }) {
  const t = TONES[tone];
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="13" height="22" rx="2.5" fill={t.fill} stroke={t.line} strokeWidth="2" />
      <circle cx="6.5" cy="5" r="1.8" fill={t.line} />
    </g>
  );
}

// Phone held flat at the top of a 160-wide tile, pointing down at whatever is below.
function PhoneDown({ cx }: { cx: number }) {
  return (
    <>
      <g transform={`translate(${cx - 6.5} 4) rotate(90 6.5 11)`}>
        <Phone x={0} y={0} />
      </g>
      <path d={`M${cx} 24 V36 M${cx - 5} 31 L${cx} 37 L${cx + 5} 31`} fill="none" stroke={color.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

function Frame({ label, w, h, dark, children }: { label: string; w: number; h: number; dark?: boolean; children: ReactNode }) {
  const clip = `pg${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  // --pg-r lets a parent round the drawing more tightly (the 64×40 still on the closed card).
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} style={{ display: "block", width: "100%", height: "auto", borderRadius: "var(--pg-r, 10px)" }}>
      <defs>
        <clipPath id={clip}>
          <rect width={w} height={h} rx="10" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width={w} height={h} fill={dark ? art.night : art.stage} />
        {children}
      </g>
    </svg>
  );
}

type ArtProps = { label: string };

const CarGood = ({ label }: ArtProps) => (
  <Frame label={label} w={320} h={200}>
    <path d="M0 168 H320" stroke={art.grey} strokeWidth="1.5" />
    <g className="pg-line">
      <path d="M27 128 H300" stroke={color.accent} strokeWidth="2" strokeDasharray="5 5" />
    </g>
    <g transform="translate(34 68)">
      <Car />
    </g>
    <g className="pg-phone">
      <Phone x={10} y={117} />
    </g>
    {/* Kept clear of the guide's "Like this" pill (top left) and play control (bottom right), down to 320px screens. */}
    <Corners x={28} y={62} w={236} h={120} />
  </Frame>
);

const CarCropped = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <path d="M0 112 H160" stroke={art.grey} strokeWidth="1.5" />
    <g transform="translate(-52 30) scale(0.98)">
      <Car />
    </g>
  </Frame>
);

const CarAbove = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <g strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx="82" cy="74" rx="62" ry="32" fill={TONES.ink.shadow} />
      {[[38, 42], [104, 42], [38, 94], [104, 94]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="18" height="9" rx="3" fill={color.ink} />
      ))}
      <rect x="22" y="46" width="116" height="52" rx="18" fill="#fff" stroke={color.ink} strokeWidth="2.5" />
      <path d="M46 52 L60 58 V86 L46 92 Z M106 58 L118 54 V90 L106 86 Z" fill={TONES.ink.glass} stroke={color.ink} strokeWidth="2" />
      <rect x="62" y="56" width="42" height="32" rx="4" fill="#fff" stroke={color.ink} strokeWidth="2" />
      <path d="M57 46 L52 40 M57 98 L52 104" stroke={color.ink} strokeWidth="2.5" />
      <rect x="24" y="52" width="5" height="9" rx="2" fill={color.accent} />
      <rect x="24" y="83" width="5" height="9" rx="2" fill={color.accent} />
    </g>
    <g transform="translate(76 4) rotate(90 6.5 11)">
      <Phone x={0} y={0} />
    </g>
    <path d="M82 24 V36 M77 31 L82 37 L87 31" fill="none" stroke={color.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Frame>
);

const CarCluttered = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <path d="M0 101 H160" stroke={art.grey} strokeWidth="1.5" />
    <g transform="translate(74 52) scale(0.42)">
      <Car tone="muted" />
    </g>
    <path d="M140 18 V101" stroke={art.grey} strokeWidth="3" strokeLinecap="round" />
    <g transform="translate(12 46) scale(0.55)">
      <Car />
    </g>
    <g stroke={color.ink} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="#fff">
      <path d="M40 101 V84 Q40 74 50 74 H54 Q64 74 64 84 V101" />
      <circle cx="52" cy="66" r="7" />
    </g>
  </Frame>
);

const CarDark = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120} dark>
    <path d="M0 101 H160" stroke="#33373f" strokeWidth="1.5" />
    <g transform="translate(19 46) scale(0.55)">
      <Car tone="dim" />
    </g>
    <path d="M26 14 A11 11 0 1 0 38 28 A9 9 0 0 1 26 14 Z" fill="#4d525c" />
  </Frame>
);

const DIM_TABLE = "#23262b";
const DIM_EDGE = "#33373f";

// 320×200 hero scene: a side table on the floor. Items stand on its top at y=147,
// and the frame corners end on the table top (y 136–158), clear of its edges.
function HeroTable() {
  return (
    <>
      <path d="M0 190 H320" stroke={art.grey} strokeWidth="1.5" />
      <g stroke={color.ink} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M260 150 V182" stroke={art.grey} />
        <path d="M94 166 V190 M222 166 V190" />
        <path d="M84 158 L120 136 H268 L232 158 Z" fill={art.table} />
        <path d="M84 158 H232 V166 H84 Z M232 158 L268 136 V144 L232 166 Z" fill="#fff" />
      </g>
    </>
  );
}

function Glare({ x, y }: { x: number; y: number }) {
  return (
    <>
      <circle cx={x} cy={y} r="6" fill="#fff" opacity="0.85" />
      <circle cx={x} cy={y} r="13" fill="#fff" opacity="0.15" />
    </>
  );
}

// Fashion: one outfit on a hanger, never next to anything else.

const FashionGood = ({ label }: ArtProps) => (
  <Frame label={label} w={320} h={200}>
    <path d="M0 190 H320" stroke={art.grey} strokeWidth="1.5" />
    <g className="pg-line">
      <path d="M27 96 H300" stroke={color.accent} strokeWidth="2" strokeDasharray="5 5" />
    </g>
    <g transform="translate(140 32) scale(1.2)">
      <HangingShirt />
    </g>
    <g className="pg-phone">
      <Phone x={10} y={85} />
    </g>
    {/* Like CarGood: clear of the "Like this" pill, the progress bars and the play control, down to 320px screens. */}
    <Corners x={136} y={24} w={128} h={160} />
  </Frame>
);

const FashionCropped = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <g transform="translate(-20 -4) scale(2)">
      <HangingShirt />
    </g>
  </Frame>
);

const FashionAbove = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <rect width="160" height="120" fill="#e3e6eb" />
    <rect width="160" height="5" fill={art.grey} />
    <path d="M10 74 Q22 66 32 78 M120 110 Q134 102 152 108 M128 46 Q140 52 152 48" fill="none" stroke="#cdd1d8" strokeWidth="1.5" strokeLinecap="round" />
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d="M11 13 Q34 8 57 13 Q62 25 57 37 Q34 42 11 37 Q6 25 11 13 Z" fill="#fff" stroke={color.ink} strokeWidth="2" />
      <path d="M17 25 Q34 21 51 25" fill="none" stroke={art.grey} strokeWidth="1.5" />
      <g transform="translate(46 36) scale(0.8)">
        <path d="M42 4 L28 9 L6 30 L16 42 L30 30 V98 H70 V30 L84 42 L94 30 L72 9 L58 4 Q50 10 42 4 Z" fill="#fff" stroke={color.ink} strokeWidth="2.5" />
        <path d="M30 30 L27 12 M70 30 L73 12 M50 15 V98" fill="none" stroke={art.grey} strokeWidth="2" />
        <path d="M42 4 L50 15 L43 20 L37 6.5 Z M58 4 L50 15 L57 20 L63 6.5 Z" fill={TONES.ink.glass} stroke={color.ink} strokeWidth="2" />
        {[32, 50, 68, 86].map((y) => (
          <circle key={y} cx="50" cy={y} r="2" fill={color.ink} />
        ))}
      </g>
    </g>
    <PhoneDown cx={86.5} />
  </Frame>
);

// Other clothes on the same rail, and a person beside it. Hooks sit on the rail at y=16.
const FashionCluttered = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <path d="M-2 16 H162" stroke={art.grey} strokeWidth="3" />
    {[-34, -2].map((x) => (
      <g key={x} transform={`translate(${x} 10.4) scale(0.7)`}>
        <HangingShirt tone="muted" />
      </g>
    ))}
    <g transform="translate(32 10.4) scale(0.7)">
      <HangingShirt />
    </g>
    <g stroke={color.ink} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="#fff">
      <path d="M94 120 V86 Q94 68 111 68 H115 Q132 68 132 86 V120" />
      <circle cx="113" cy="55" r="9" />
    </g>
  </Frame>
);

const FashionDark = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120} dark>
    <g transform="translate(57 26) scale(0.62)">
      <path d={SHIRT} fill={SHADE} />
    </g>
    <g transform="translate(48 20) scale(0.62)">
      <HangingShirt tone="dim" />
    </g>
    <Glare x={80} y={52} />
  </Frame>
);

// Gifting: one closed gift box on a table.

const GiftGood = ({ label }: ArtProps) => (
  <Frame label={label} w={320} h={200}>
    <HeroTable />
    <g className="pg-line">
      <path d="M27 109 H300" stroke={color.accent} strokeWidth="2" strokeDasharray="5 5" />
    </g>
    <g transform="translate(127 52) scale(0.95)">
      <GiftBox />
    </g>
    <g className="pg-phone">
      <Phone x={10} y={98} />
    </g>
    {/* Starts below the "Like this" pill at 320px; the bow top is at about y=64. */}
    <Corners x={114} y={61} w={114} h={94} len={12} />
  </Frame>
);

const GiftCropped = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <rect y="108" width="160" height="12" fill={art.table} />
    <path d="M0 108 H160" stroke={art.grey} strokeWidth="1.5" />
    <g transform="translate(-30 -22) scale(1.3)">
      <GiftBox />
    </g>
  </Frame>
);

// Seen from high up: mostly the lid (far edge narrower), with a thin strip of the front showing.
const GiftAbove = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <rect width="160" height="120" fill={art.table} />
    <g stroke={color.ink} strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx="84" cy="112" rx="46" ry="5" fill={art.tableShadow} stroke="none" />
      <rect x="47" y="103" width="70" height="8" fill="#fff" strokeWidth="2.5" />
      <rect x="43" y="96" width="78" height="8" fill="#fff" strokeWidth="2.5" />
      <path d="M49 43 H115 L121 96 H43 Z" fill="#fff" strokeWidth="2.5" />
      <path d="M46.6 64 H117.4 L118.7 76 H45.3 Z M77 43 H87 L88 96 H76 Z M76 96 H88 V104 H76 Z M76 103 H88 V111 H76 Z" fill={color.accent} strokeWidth="1.8" />
      <path d="M82 70 C70 55 55 61 61 73 C65 81 76 77 82 70 Z M82 70 C94 55 109 61 103 73 C99 81 88 77 82 70 Z" fill={color.accent} strokeWidth="2" />
      <ellipse cx="82" cy="70" rx="5" ry="4" fill={color.accent} strokeWidth="2" />
    </g>
    <PhoneDown cx={82} />
  </Frame>
);

const GiftCluttered = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <g strokeLinejoin="round" strokeLinecap="round">
      {[
        [4, 18, "#c9ccd2"], [12, 22, "#e3e5e9"], [20, 14, "#b4b8c0"], [28, 20, "#d3d6dc"], [36, 24, "#c9ccd2"], [44, 16, "#e3e5e9"],
      ].map(([x, h, c]) => (
        <rect key={x} x={x as number} y={40 - (h as number)} width="7" height={h as number} fill={c as string} stroke={art.grey} strokeWidth="1" />
      ))}
      <path d="M0 40 H160" stroke={art.grey} strokeWidth="3" />
      {/* Plant shifted left so the red x badge sits on empty wall. */}
      <g transform="translate(-34 0)">
        <path d="M108 40 L111 30 H125 L128 40 Z" fill="#fff" stroke={art.grey} strokeWidth="1.5" />
        <g stroke={color.success} strokeWidth="1.8" fill="#cfe6d5">
          <path d="M118 30 Q112 18 104 14 Q114 14 118 30 Z M118 30 Q122 16 130 12 Q128 24 118 30 Z" />
        </g>
      </g>
    </g>
    <g transform="translate(44 38) scale(0.72)">
      <GiftBox />
    </g>
    <g stroke={color.ink} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="#fff">
      <path d="M0 74 H28 Q40 74 40 85 V91 Q40 102 28 102 H0" />
      {[76, 82.5, 89, 95.5].map((y) => (
        <rect key={`l${y}`} x="38" y={y} width="20" height="6.5" rx="3.25" />
      ))}
      <path d="M160 74 H132 Q120 74 120 85 V91 Q120 102 132 102 H160" />
      {[76, 82.5, 89, 95.5].map((y) => (
        <rect key={`r${y}`} x="100" y={y} width="20" height="6.5" rx="3.25" />
      ))}
    </g>
  </Frame>
);

const GiftDark = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120} dark>
    <rect y="100" width="160" height="20" fill={DIM_TABLE} />
    <path d="M0 100 H160" stroke={DIM_EDGE} strokeWidth="1.5" />
    <g transform="translate(55 22) scale(0.74)">
      <GiftBox tone="shade" />
    </g>
    <g transform="translate(45 26) scale(0.74)">
      <GiftBox tone="dim" />
    </g>
    <Glare x={66} y={80} />
  </Frame>
);

// Skincare: one bottle standing upright on a table, label facing.

const SkinGood = ({ label }: ArtProps) => (
  <Frame label={label} w={320} h={200}>
    <HeroTable />
    <g className="pg-line">
      <path d="M27 100 H300" stroke={color.accent} strokeWidth="2" strokeDasharray="5 5" />
    </g>
    <g transform="translate(146.5 37) scale(1.1)">
      <Serum />
    </g>
    <g className="pg-phone">
      <Phone x={10} y={89} />
    </g>
    {/* Starts right of the "Like this" pill at 320px. */}
    <Corners x={138} y={28} w={80} h={127} len={12} />
  </Frame>
);

const SkinCropped = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <rect y="100" width="160" height="20" fill={art.table} />
    <path d="M0 100 H160" stroke={art.grey} strokeWidth="1.5" />
    <g transform="translate(36 -22) scale(1.5)">
      <Serum />
    </g>
  </Frame>
);

// Seen from above: the tops of the shoulders and collar show as rings, the body narrows away.
const SkinAbove = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <rect width="160" height="120" fill={art.table} />
    <g stroke={color.ink} strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx="86" cy="113" rx="30" ry="5" fill={art.tableShadow} stroke="none" />
      <path d="M54 74 L60 104 Q62 113 82 113 Q102 113 104 104 L110 74 Z" fill={TONES.ink.glass} strokeWidth="2.5" />
      <path d="M57.5 89 Q82 98 106.5 89 L103.5 103 Q82 111 60.5 103 Z" fill="#fff" strokeWidth="1.8" />
      <path d="M58.6 94.5 Q82 103 105.4 94.5" fill="none" stroke={color.accent} strokeWidth="4" strokeLinecap="butt" />
      <ellipse cx="82" cy="74" rx="28" ry="14" fill={TONES.ink.glass} strokeWidth="2.5" />
      <path d="M69 66 V73 Q82 80 95 73 V66" fill="#fff" strokeWidth="2" />
      <ellipse cx="82" cy="66" rx="13" ry="6.5" fill="#fff" strokeWidth="2" />
      <path d="M74 66 Q74 51 82 51 Q90 51 90 66 Q82 70 74 66 Z" fill={color.ink} strokeWidth="2" />
    </g>
    <PhoneDown cx={82} />
  </Frame>
);

// A hand gripping the bottle, with a tube and a jar crowding it.
const SkinCluttered = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <rect y="100" width="160" height="20" fill={art.table} />
    <path d="M0 100 H160" stroke={art.grey} strokeWidth="1.5" />
    <g stroke={TONES.muted.line} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill={TONES.muted.fill}>
      <path d="M8 90 L4 36 H30 L26 90 Z" />
      <path d="M5 41 H29" fill="none" />
      <rect x="10" y="89" width="14" height="11" rx="1.5" />
    </g>
    <g transform="translate(18 70) scale(0.6)">
      <Jar tone="muted" />
    </g>
    <g transform="translate(56 18) scale(0.82)">
      <Serum />
    </g>
    <g stroke={color.ink} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="#fff">
      <path d="M160 60 H136 Q124 60 124 71 V77 Q124 88 136 88 H160" />
      {[62, 68.5, 75, 81.5].map((y) => (
        <rect key={y} x="78" y={y} width="48" height="6.5" rx="3.25" />
      ))}
    </g>
  </Frame>
);

const SkinDark = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120} dark>
    <rect y="100" width="160" height="20" fill={DIM_TABLE} />
    <path d="M0 100 H160" stroke={DIM_EDGE} strokeWidth="1.5" />
    <g transform="translate(70 16) scale(0.8)">
      <Serum tone="shade" />
    </g>
    <g transform="translate(60 20) scale(0.8)">
      <Serum tone="dim" />
    </g>
    <Glare x={88} y={58} />
  </Frame>
);

type Art = (p: ArtProps) => ReactNode;
type AvoidId = (typeof INDUSTRIES)[IndustryKey]["photoAvoid"][number]["id"];
// Every vertical needs its own full set, so no vertical ever shows another's product.
// `alt` / `avoidAlt` describe what each drawing shows, for screen readers.
const ART: Record<IndustryKey, { good: Art; caption: string; alt: string; avoid: Record<AvoidId, Art>; avoidAlt: Record<AvoidId, string> }> = {
  automotive: {
    good: CarGood,
    caption: "Whole car in view, shot from the front corner, phone at headlight height.",
    alt: "A whole car seen from its front corner, with space around it. The phone is held low, level with the headlights.",
    avoid: { cropped: CarCropped, above: CarAbove, cluttered: CarCluttered, dark: CarDark },
    avoidAlt: {
      cropped: "A car so close that its front bumper and front wheel are cut off by the frame.",
      above: "A car seen from above, with the phone pointing down at its roof.",
      cluttered: "A car with a person standing in front of it, and a pole and another car behind it.",
      dark: "A car at night, too dark to see clearly.",
    },
  },
  fashion: {
    good: FashionGood,
    caption: "On a hanger against a plain wall. Whole outfit in view, phone at chest height.",
    alt: "A shirt on a hanger, hung on a hook on a plain wall, with space around it. The phone is held level with the middle of the shirt.",
    avoid: { cropped: FashionCropped, above: FashionAbove, cluttered: FashionCluttered, dark: FashionDark },
    avoidAlt: {
      cropped: "A shirt so close that its sleeves and hem are cut off by the frame.",
      above: "A shirt laid flat on a bed, shot from above with the phone pointing down.",
      cluttered: "A shirt squeezed between other clothes on a rail, with a person standing beside it.",
      dark: "A shirt on a hanger in a dark room, with flash glare and a hard shadow behind it.",
    },
  },
  gifting: {
    good: GiftGood,
    caption: "Closed and standing on a table. Whole gift in view, phone level with its middle.",
    alt: "A closed gift box with a ribbon and bow, standing on a table with space around it. The phone is held level with the middle of the box.",
    avoid: { cropped: GiftCropped, above: GiftAbove, cluttered: GiftCluttered, dark: GiftDark },
    avoidAlt: {
      cropped: "A gift box so close that its bow and left side are cut off by the frame.",
      above: "A gift box seen from high above, with the phone pointing down at its lid.",
      cluttered: "Hands holding a gift box in front of a busy shelf.",
      dark: "A gift box in a dark room, with flash glare and a hard shadow behind it.",
    },
  },
  skincare: {
    good: SkinGood,
    caption: "Standing upright on a table, label facing you. Whole product in view, phone level with it.",
    alt: "A serum bottle with a dropper cap, standing upright on a table with its label facing forward and space around it. The phone is held level with the middle of the bottle.",
    avoid: { cropped: SkinCropped, above: SkinAbove, cluttered: SkinCluttered, dark: SkinDark },
    avoidAlt: {
      cropped: "A serum bottle so close that its dropper cap and base are cut off by the frame.",
      above: "A serum bottle seen from above, with the phone pointing down at its cap.",
      cluttered: "A hand holding a serum bottle, with a tube and a jar crowding it.",
      dark: "A serum bottle in a dark room, with a bright flash spot on the glass and a hard shadow behind it.",
    },
  },
};

type TipId = (typeof INDUSTRIES)[IndustryKey]["photoTips"][number]["id"];

// The guide plays one scene per photo tip, in the order of photoTips. A tip with an "avoid" partner
// plays a before-and-after: the drawing to avoid first, then the good drawing.
const PAIR: Record<IndustryKey, Partial<Record<TipId, AvoidId>>> = {
  gifting: { whole: "cropped", height: "above", plain: "cluttered", light: "dark" },
  fashion: { hang: "above", whole: "cropped", plain: "cluttered", light: "dark" },
  skincare: { whole: "cropped", height: "above", plain: "cluttered", light: "dark" },
  automotive: { whole: "cropped", height: "above", light: "dark", clear: "cluttered" },
};
// Milliseconds: when the avoid drawing gives way to the good one, and how long each kind of scene lasts.
// Four paired scenes and one solo scene make every category about 14.4 s in total.
const LEN = { swap: 1100, paired: 3000, solo: 2400 };

type Phase = "rest" | "avoid" | "good";
type Status = "idle" | "playing" | "paused" | "done";

function Badge({ ok = false }: { ok?: boolean }) {
  return <VerdictDot ok={ok} size={ok ? 28 : 20} className="pg-badge" />;
}

// The phone's "reduce motion" setting, kept up to date if it changes while the page is open.
function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

// The vertical's first photo tip as one line, shown above the photo buttons so the most
// important advice is visible without opening the guide.
export function PhotoTip({ industry }: { industry: IndustryKey }) {
  const tip = INDUSTRIES[industry].photoTips[0];
  return (
    <p style={{ fontSize: 15, lineHeight: 1.4, margin: "0 0 12px", color: color.ink }}>
      <span aria-hidden="true" style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color.accent, marginRight: 8, verticalAlign: "middle" }} />
      <b style={{ fontWeight: 600 }}>{tip.title}.</b> <span style={{ color: color.muted }}>{tip.detail}</span>
    </p>
  );
}

// openSignal: bump it to open the guide (a photo warning or a rejected cut-out).
export default function PhotoGuide({ industry, defaultOpen = false, openSignal = 0 }: { industry: IndustryKey; defaultOpen?: boolean; openSignal?: number }) {
  const copy = INDUSTRIES[industry];
  const pics = ART[industry];
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef<HTMLDetailsElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // Only signals sent after mount open it, so switching greeting/offer doesn't reopen it or jump the page.
  const seen = useRef(openSignal);
  const Good = pics.good;

  // The player. `run` goes up each time a scene starts, which remounts the stage drawings so their animations replay.
  const reduced = useReducedMotion();
  const scenes = copy.photoTips.map((t) => ({ tip: t.id, avoid: PAIR[industry][t.id] }));
  const [at, setAt] = useState({ i: 0, phase: "rest" as Phase, run: 0 });
  const [status, setStatus] = useState<Status>("idle");
  const [inView, setInView] = useState(true); // at least half the stage on screen (stays true without IntersectionObserver)
  const [pageShown, setPageShown] = useState(true); // the browser tab is showing
  const live = open && !reduced && status === "playing" && inView && pageShown;
  const wasLive = useRef(false);
  const startScene = (i: number) => setAt((a) => ({ i, phase: scenes[i].avoid ? "avoid" : "good", run: a.run + 1 }));

  useEffect(() => {
    const el = ref.current;
    if (openSignal > 0 && openSignal !== seen.current && el) {
      el.open = true;
      setOpen(true);
      // Don't pull the page away from a field the person is typing in.
      const active = document.activeElement;
      const typing = (active instanceof HTMLInputElement && active.type !== "file") || active instanceof HTMLTextAreaElement;
      if (!typing) {
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
      }
    }
    seen.current = openSignal;
  }, [openSignal]);

  // First visit to this category in this browser: open the guide once, without scrolling.
  // If storage is blocked, leave it closed rather than open it on every visit.
  useEffect(() => {
    const el = ref.current;
    if (!GUIDE_AUTO_OPEN_FIRST_VISIT || !el || el.open) return;
    let first = false;
    try {
      const key = `mmv-guide-seen:${industry}`;
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, "1");
        first = true;
      }
    } catch {
      first = false;
    }
    if (first) {
      el.open = true;
      setOpen(true);
    }
  }, [industry]);

  // Opening the card plays from the first scene; closing it goes back to the still frame.
  useEffect(() => {
    setAt((a) => (a.i === 0 && a.phase === "rest" ? a : { ...a, i: 0, phase: "rest" }));
    setStatus(open ? "playing" : "idle");
  }, [open]);

  // Pause while less than half the stage is on screen.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        setInView(e.isIntersecting && e.intersectionRatio >= 0.5);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  // Pause while the browser tab is hidden.
  useEffect(() => {
    const update = () => setPageShown(document.visibilityState !== "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  // Restart the current scene whenever playback becomes live again (play, back on screen, tab shown).
  useEffect(() => {
    if (live && !wasLive.current) startScene(at.i);
    wasLive.current = live;
  }, [live]);

  // One scene at a time. Cleared on pause, close, off screen, unmount and StrictMode re-runs. It never loops.
  useEffect(() => {
    if (!live) return;
    const s = scenes[at.i];
    const swap = s.avoid ? window.setTimeout(() => setAt((a) => ({ ...a, phase: "good" })), LEN.swap) : undefined;
    const next = window.setTimeout(() => (at.i + 1 < scenes.length ? startScene(at.i + 1) : setStatus("done")), s.avoid ? LEN.paired : LEN.solo);
    return () => {
      window.clearTimeout(swap);
      window.clearTimeout(next);
    };
  }, [live, at.run]);

  // Playing: pause. Paused: play again (the current scene restarts). Done: replay from the first scene.
  const onControl = () => {
    if (status === "playing") {
      setStatus("paused");
      return;
    }
    if (status === "done") setAt((a) => ({ ...a, i: 0, phase: "rest" }));
    setStatus("playing");
  };

  // Tapping a tip jumps to its scene and plays from there.
  const onTip = (k: number) => {
    if (live) {
      startScene(k);
      return;
    }
    // Not live (paused, off screen or tab hidden): show the new scene's still frame until playback starts it.
    setAt((a) => ({ ...a, i: k, phase: "rest" }));
    setStatus("playing");
  };

  const i = at.i;
  const scene = scenes[i];
  const avoidId = scene.avoid;
  const Avoid = avoidId ? pics.avoid[avoidId] : null;
  const yes = at.phase !== "avoid";
  const ctl: { icon: IconName; label: string } =
    status === "playing" ? { icon: "pause", label: "Pause guide" } : status === "done" ? { icon: "replay", label: "Replay guide" } : { icon: "play", label: "Play guide" };
  const goodLabel = `Drawing of a good photo. ${pics.alt}`;

  // Story-style progress: one segment per scene; the current one fills over the scene's length.
  const segments = (full: boolean) => (
    <div className="pg-segs">
      {scenes.map((s, k) => (
        <span
          key={s.tip}
          className="pg-seg"
          data-state={full || k < i ? "done" : k === i ? "now" : undefined}
          style={!full && k === i ? ({ "--len": `${s.avoid ? LEN.paired : LEN.solo}ms` } as CSSProperties) : undefined}
        >
          <i />
        </span>
      ))}
    </div>
  );

  const caption = (
    <figcaption style={{ ...text.small, color: color.muted, marginTop: 12 }}>
      <b style={{ color: color.success, fontWeight: 600 }}>Like this:</b> {pics.caption}
    </figcaption>
  );

  return (
    <details
      ref={ref}
      className="mmv-guide"
      open={defaultOpen}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      style={{ margin: "8px 0 16px", border: `1px solid ${color.line}`, borderRadius: 16, background: color.surface }}
    >
      <summary style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 56, padding: "12px 16px", boxSizing: "border-box", cursor: "pointer" }}>
        <span aria-hidden="true" style={{ flex: "none", display: "block", width: 64, height: 40, borderRadius: 8, overflow: "hidden", "--pg-r": "8px" } as CSSProperties}>
          <Good label={goodLabel} />
        </span>
        <span style={{ flex: 1, minWidth: 0, textWrap: "balance" }}>
          <b style={{ display: "block", fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>How to take a great photo</b>
          <span style={{ display: "block", ...text.small, color: color.muted }}>
            {open ? "Good photos make good ads." : "See what works, with pictures."}
          </span>
        </span>
        <span aria-hidden="true" style={{ display: "flex", flex: "none", color: color.muted }}>
          <Icon name="chevronDown" className="mmv-chev" />
        </span>
      </summary>

      <div className="mmv-guide-body" style={{ padding: "0 16px 16px" }}>
        {reduced ? (
          // Reduce motion: the finished still, with every segment full. No player.
          <figure style={{ margin: 0 }}>
            <div className="pg-stage" data-phase="rest">
              <div className="pg-layer pg-good">
                <Good label={goodLabel} />
              </div>
              <div aria-hidden="true">
                {segments(true)}
                <span className="pg-verdict pg-verdict--yes" style={{ animation: "none" }}>
                  <VerdictDot ok />
                  Like this
                </span>
              </div>
            </div>
            {caption}
          </figure>
        ) : (
          <figure style={{ margin: 0 }}>
            <div ref={stageRef} className="pg-stage" data-phase={at.phase} data-tip={scene.tip} data-paused={live ? undefined : ""}>
              {/* The drawings only show what the tips below say, so screen readers skip them. */}
              <div key={`${i}-${at.run}`} aria-hidden="true">
                {Avoid && avoidId && (
                  <div className="pg-layer pg-avoid">
                    {/* Sized from the width, because a % height doesn't resolve inside the grid layer and overflows the
                        stage. Up to 68% of the stage's width, and small enough on phones that the 4:3 frame (sitting
                        6px above the bottom) starts below the verdict pill, which ends 44px from the top. */}
                    <div style={{ width: "min(68%, calc(83.3% - 70px))", height: "auto" }}>
                      <Avoid label={`Drawing of a photo to avoid: ${pics.avoidAlt[avoidId]}`} />
                    </div>
                  </div>
                )}
                <div className="pg-layer pg-good">
                  <Good label={goodLabel} />
                </div>
                {segments(status === "done")}
                <span key={at.phase} className={`pg-verdict pg-verdict--${yes ? "yes" : "no"}`}>
                  <VerdictDot ok={yes} />
                  {yes ? "Like this" : "Avoid"}
                </span>
              </div>
              {/* Outside the remounted part, so it keeps keyboard focus from scene to scene. The outline
                  sits inside the button because the stage clips anything past its edge. */}
              <button type="button" className="pg-ctl" aria-label={ctl.label} onClick={onControl} style={{ outlineOffset: -4 }}>
                <span>
                  <Icon name={ctl.icon} size={18} />
                </span>
              </button>
            </div>
            {caption}
          </figure>
        )}

        <ol className="pg-tips">
          {copy.photoTips.map((tip, k) =>
            reduced ? (
              <li key={tip.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "8px 0", fontSize: 15, lineHeight: 1.4, color: color.muted }}>
                <span className="pg-num" aria-hidden="true">{k + 1}</span>
                <span>
                  <b style={{ color: color.ink, fontWeight: 600 }}>{tip.title}.</b> {tip.detail}
                </span>
              </li>
            ) : (
              <li key={tip.id}>
                <button
                  type="button"
                  className="pg-tip"
                  aria-current={(status === "playing" || status === "paused") && k === i ? "step" : undefined}
                  onClick={() => onTip(k)}
                >
                  <span className="pg-num" aria-hidden="true">{k + 1}</span>
                  <span>
                    <b>{tip.title}.</b> {tip.detail}
                  </span>
                </button>
              </li>
            ),
          )}
        </ol>

        <p style={{ margin: "24px 0 12px", fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>Avoid these</p>
        <ul className="pg-avoid-grid">
          {copy.photoAvoid.map((avoid) => {
            const Thumb = pics.avoid[avoid.id];
            return (
              <li key={avoid.id}>
                <div className="pg-thumb">
                  <Thumb label={`Drawing of a photo to avoid: ${pics.avoidAlt[avoid.id]}`} />
                  <Badge />
                </div>
                <b style={{ display: "block", fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>{avoid.title}</b>
                <span style={{ display: "block", marginTop: 2, fontSize: 13, lineHeight: 1.35, color: color.muted }}>{avoid.detail}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
