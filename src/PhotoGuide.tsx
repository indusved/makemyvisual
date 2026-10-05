import { useId, useState, type ReactNode } from "react";
import { INDUSTRIES, type IndustryKey } from "../convex/industries";

const INK = "#111317";
const GREY = "#8a8f99";
const AMBER = "#F5B700";
const MUTED = "#5b6170";
const PAPER = "#f4f5f7";
const NIGHT = "#1d2025";
const RED = "#d93025";
const GREEN = "#1e8e3e";
// Darker green for small text, so it stays readable (about 6:1 on white).
const GREEN_TEXT = "#137333";

// "shade" draws a shape as a flat silhouette, for the hard shadow a flash throws behind it.
type Tone = "ink" | "muted" | "dim" | "shade";
const SHADE = "#121418";
const TONES: Record<Tone, { line: string; soft: string; fill: string; glass: string; lamp: string; shadow: string }> = {
  ink: { line: INK, soft: GREY, fill: "#fff", glass: "#e6e9ee", lamp: AMBER, shadow: "#e2e5ea" },
  muted: { line: "#b4b8c0", soft: "#c9ccd2", fill: "#fbfbfc", glass: "#f0f1f4", lamp: "#e3e5e9", shadow: "transparent" },
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

function Corners({ x, y, w, h, len = 14 }: { x: number; y: number; w: number; h: number; len?: number }) {
  const d = `M${x} ${y + len}V${y}H${x + len}M${x + w - len} ${y}H${x + w}V${y + len}M${x + w} ${y + h - len}V${y + h}H${x + w - len}M${x + len} ${y + h}H${x}V${y + h - len}`;
  return <path d={d} fill="none" stroke={AMBER} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
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
      <path d={`M${cx} 24 V36 M${cx - 5} 31 L${cx} 37 L${cx + 5} 31`} fill="none" stroke={AMBER} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

function Frame({ label, w, h, dark, children }: { label: string; w: number; h: number; dark?: boolean; children: ReactNode }) {
  const clip = `pg${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} style={{ display: "block", width: "100%", height: "auto", borderRadius: 10 }}>
      <defs>
        <clipPath id={clip}>
          <rect width={w} height={h} rx="10" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width={w} height={h} fill={dark ? NIGHT : PAPER} />
        {children}
      </g>
    </svg>
  );
}

type ArtProps = { label: string };

const CarGood = ({ label }: ArtProps) => (
  <Frame label={label} w={320} h={200}>
    <path d="M0 168 H320" stroke={GREY} strokeWidth="1.5" />
    <path d="M27 128 H300" stroke={AMBER} strokeWidth="2" strokeDasharray="5 5" />
    <g transform="translate(52 68)">
      <Car />
    </g>
    <Phone x={10} y={117} />
    <Corners x={38} y={46} w={252} h={136} />
  </Frame>
);

const CarCropped = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <path d="M0 112 H160" stroke={GREY} strokeWidth="1.5" />
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
        <rect key={`${x}-${y}`} x={x} y={y} width="18" height="9" rx="3" fill={INK} />
      ))}
      <rect x="22" y="46" width="116" height="52" rx="18" fill="#fff" stroke={INK} strokeWidth="2.5" />
      <path d="M46 52 L60 58 V86 L46 92 Z M106 58 L118 54 V90 L106 86 Z" fill={TONES.ink.glass} stroke={INK} strokeWidth="2" />
      <rect x="62" y="56" width="42" height="32" rx="4" fill="#fff" stroke={INK} strokeWidth="2" />
      <path d="M57 46 L52 40 M57 98 L52 104" stroke={INK} strokeWidth="2.5" />
      <rect x="24" y="52" width="5" height="9" rx="2" fill={AMBER} />
      <rect x="24" y="83" width="5" height="9" rx="2" fill={AMBER} />
    </g>
    <g transform="translate(76 4) rotate(90 6.5 11)">
      <Phone x={0} y={0} />
    </g>
    <path d="M82 24 V36 M77 31 L82 37 L87 31" fill="none" stroke={AMBER} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Frame>
);

const CarCluttered = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <path d="M0 101 H160" stroke={GREY} strokeWidth="1.5" />
    <g transform="translate(74 52) scale(0.42)">
      <Car tone="muted" />
    </g>
    <path d="M140 18 V101" stroke={GREY} strokeWidth="3" strokeLinecap="round" />
    <g transform="translate(12 46) scale(0.55)">
      <Car />
    </g>
    <g stroke={INK} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="#fff">
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

const TABLE = "#e9ecf0";
const TABLE_SHADOW = "#dde1e7";
const DIM_TABLE = "#23262b";
const DIM_EDGE = "#33373f";

// 320×200 hero scene: a side table on the floor. Items stand on its top at y=147,
// and the frame corners end on the table top (y 136–158), clear of its edges.
function HeroTable() {
  return (
    <>
      <path d="M0 190 H320" stroke={GREY} strokeWidth="1.5" />
      <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M260 150 V182" stroke={GREY} />
        <path d="M94 166 V190 M222 166 V190" />
        <path d="M84 158 L120 136 H268 L232 158 Z" fill={TABLE} />
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
    <path d="M0 190 H320" stroke={GREY} strokeWidth="1.5" />
    <path d="M27 96 H300" stroke={AMBER} strokeWidth="2" strokeDasharray="5 5" />
    <g transform="translate(110 22) scale(1.3)">
      <HangingShirt />
    </g>
    <Phone x={10} y={85} />
    <Corners x={92} y={14} w={166} h={170} />
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
    <rect width="160" height="5" fill={GREY} />
    <path d="M10 74 Q22 66 32 78 M120 110 Q134 102 152 108 M128 46 Q140 52 152 48" fill="none" stroke="#cdd1d8" strokeWidth="1.5" strokeLinecap="round" />
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d="M11 13 Q34 8 57 13 Q62 25 57 37 Q34 42 11 37 Q6 25 11 13 Z" fill="#fff" stroke={INK} strokeWidth="2" />
      <path d="M17 25 Q34 21 51 25" fill="none" stroke={GREY} strokeWidth="1.5" />
      <g transform="translate(46 36) scale(0.8)">
        <path d="M42 4 L28 9 L6 30 L16 42 L30 30 V98 H70 V30 L84 42 L94 30 L72 9 L58 4 Q50 10 42 4 Z" fill="#fff" stroke={INK} strokeWidth="2.5" />
        <path d="M30 30 L27 12 M70 30 L73 12 M50 15 V98" fill="none" stroke={GREY} strokeWidth="2" />
        <path d="M42 4 L50 15 L43 20 L37 6.5 Z M58 4 L50 15 L57 20 L63 6.5 Z" fill={TONES.ink.glass} stroke={INK} strokeWidth="2" />
        {[32, 50, 68, 86].map((y) => (
          <circle key={y} cx="50" cy={y} r="2" fill={INK} />
        ))}
      </g>
    </g>
    <PhoneDown cx={86.5} />
  </Frame>
);

// Other clothes on the same rail, and a person beside it. Hooks sit on the rail at y=16.
const FashionCluttered = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <path d="M-2 16 H162" stroke={GREY} strokeWidth="3" />
    {[-34, -2].map((x) => (
      <g key={x} transform={`translate(${x} 10.4) scale(0.7)`}>
        <HangingShirt tone="muted" />
      </g>
    ))}
    <g transform="translate(32 10.4) scale(0.7)">
      <HangingShirt />
    </g>
    <g stroke={INK} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="#fff">
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
    <path d="M27 109 H300" stroke={AMBER} strokeWidth="2" strokeDasharray="5 5" />
    <g transform="translate(127 52) scale(0.95)">
      <GiftBox />
    </g>
    <Phone x={10} y={98} />
    <Corners x={114} y={46} w={114} h={109} len={12} />
  </Frame>
);

const GiftCropped = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <rect y="108" width="160" height="12" fill={TABLE} />
    <path d="M0 108 H160" stroke={GREY} strokeWidth="1.5" />
    <g transform="translate(-30 -22) scale(1.3)">
      <GiftBox />
    </g>
  </Frame>
);

// Seen from high up: mostly the lid (far edge narrower), with a thin strip of the front showing.
const GiftAbove = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <rect width="160" height="120" fill={TABLE} />
    <g stroke={INK} strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx="84" cy="112" rx="46" ry="5" fill={TABLE_SHADOW} stroke="none" />
      <rect x="47" y="103" width="70" height="8" fill="#fff" strokeWidth="2.5" />
      <rect x="43" y="96" width="78" height="8" fill="#fff" strokeWidth="2.5" />
      <path d="M49 43 H115 L121 96 H43 Z" fill="#fff" strokeWidth="2.5" />
      <path d="M46.6 64 H117.4 L118.7 76 H45.3 Z M77 43 H87 L88 96 H76 Z M76 96 H88 V104 H76 Z M76 103 H88 V111 H76 Z" fill={AMBER} strokeWidth="1.8" />
      <path d="M82 70 C70 55 55 61 61 73 C65 81 76 77 82 70 Z M82 70 C94 55 109 61 103 73 C99 81 88 77 82 70 Z" fill={AMBER} strokeWidth="2" />
      <ellipse cx="82" cy="70" rx="5" ry="4" fill={AMBER} strokeWidth="2" />
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
        <rect key={x} x={x as number} y={40 - (h as number)} width="7" height={h as number} fill={c as string} stroke={GREY} strokeWidth="1" />
      ))}
      <path d="M0 40 H160" stroke={GREY} strokeWidth="3" />
      {/* Plant shifted left so the ✕ badge sits on empty wall. */}
      <g transform="translate(-34 0)">
        <path d="M108 40 L111 30 H125 L128 40 Z" fill="#fff" stroke={GREY} strokeWidth="1.5" />
        <g stroke={GREEN} strokeWidth="1.8" fill="#cfe6d5">
          <path d="M118 30 Q112 18 104 14 Q114 14 118 30 Z M118 30 Q122 16 130 12 Q128 24 118 30 Z" />
        </g>
      </g>
    </g>
    <g transform="translate(44 38) scale(0.72)">
      <GiftBox />
    </g>
    <g stroke={INK} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="#fff">
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
    <path d="M27 100 H300" stroke={AMBER} strokeWidth="2" strokeDasharray="5 5" />
    <g transform="translate(146.5 37) scale(1.1)">
      <Serum />
    </g>
    <Phone x={10} y={89} />
    <Corners x={130} y={28} w={88} h={127} len={12} />
  </Frame>
);

const SkinCropped = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <rect y="100" width="160" height="20" fill={TABLE} />
    <path d="M0 100 H160" stroke={GREY} strokeWidth="1.5" />
    <g transform="translate(36 -22) scale(1.5)">
      <Serum />
    </g>
  </Frame>
);

// Seen from above: the tops of the shoulders and collar show as rings, the body narrows away.
const SkinAbove = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <rect width="160" height="120" fill={TABLE} />
    <g stroke={INK} strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx="86" cy="113" rx="30" ry="5" fill={TABLE_SHADOW} stroke="none" />
      <path d="M54 74 L60 104 Q62 113 82 113 Q102 113 104 104 L110 74 Z" fill={TONES.ink.glass} strokeWidth="2.5" />
      <path d="M57.5 89 Q82 98 106.5 89 L103.5 103 Q82 111 60.5 103 Z" fill="#fff" strokeWidth="1.8" />
      <path d="M58.6 94.5 Q82 103 105.4 94.5" fill="none" stroke={AMBER} strokeWidth="4" strokeLinecap="butt" />
      <ellipse cx="82" cy="74" rx="28" ry="14" fill={TONES.ink.glass} strokeWidth="2.5" />
      <path d="M69 66 V73 Q82 80 95 73 V66" fill="#fff" strokeWidth="2" />
      <ellipse cx="82" cy="66" rx="13" ry="6.5" fill="#fff" strokeWidth="2" />
      <path d="M74 66 Q74 51 82 51 Q90 51 90 66 Q82 70 74 66 Z" fill={INK} strokeWidth="2" />
    </g>
    <PhoneDown cx={82} />
  </Frame>
);

// A hand gripping the bottle, with a tube and a jar crowding it.
const SkinCluttered = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <rect y="100" width="160" height="20" fill={TABLE} />
    <path d="M0 100 H160" stroke={GREY} strokeWidth="1.5" />
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
    <g stroke={INK} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="#fff">
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

function Badge({ ok }: { ok?: boolean }) {
  const size = ok ? 30 : 24;
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute", top: 6, right: 6, width: size, height: size, borderRadius: "50%",
        background: ok ? GREEN : RED, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: ok ? 17 : 13, fontWeight: 800, lineHeight: 1, boxShadow: "0 0 0 2px #fff",
      }}
    >
      {ok ? "✓" : "✕"}
    </span>
  );
}

export default function PhotoGuide({ industry, defaultOpen }: { industry: IndustryKey; defaultOpen: boolean }) {
  const copy = INDUSTRIES[industry];
  const art = ART[industry];
  const [open, setOpen] = useState(defaultOpen);
  const Good = art.good;

  return (
    <details
      className="mmv-photo-guide"
      open={defaultOpen}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      style={{ border: "1px solid #e3e6eb", borderRadius: 12, background: "#fff", margin: "8px 0 12px" }}
    >
      <summary style={{ listStyle: "none", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", minHeight: 48, boxSizing: "border-box", cursor: "pointer" }}>
        <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 9, background: INK, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <b style={{ display: "block", fontSize: 16, color: INK }}>How to take a great photo</b>
          <span style={{ display: "block", fontSize: 14, color: MUTED }}>
            {open ? "Good photos make good ads." : "See what works, with pictures."}
          </span>
        </span>
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
          <path d="M5 8l5 5 5-5" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <style>{".mmv-photo-guide>summary::-webkit-details-marker{display:none}"}</style>

      <div style={{ padding: "0 14px 16px" }}>
        <figure style={{ margin: 0 }}>
          <div style={{ position: "relative" }}>
            <Good label={`Drawing of a good photo. ${art.alt}`} />
            <Badge ok />
          </div>
          <figcaption style={{ fontSize: 14, color: MUTED, marginTop: 8, lineHeight: 1.4 }}>
            <b style={{ color: GREEN_TEXT }}>Like this:</b> {art.caption}
          </figcaption>
        </figure>

        <ol style={{ listStyle: "none", padding: 0, margin: "14px 0 0" }}>
          {copy.photoTips.map((tip, i) => (
            <li key={tip.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, fontSize: 15, lineHeight: 1.4 }}>
              <span aria-hidden="true" style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: AMBER, color: INK, fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                {i + 1}
              </span>
              <span>
                <b style={{ color: INK }}>{tip.title}.</b> <span style={{ color: MUTED }}>{tip.detail}</span>
              </span>
            </li>
          ))}
        </ol>

        <p style={{ margin: "16px 0 8px", fontSize: 15, fontWeight: 700, color: INK }}>Avoid these</p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          {copy.photoAvoid.map((avoid) => {
            const Thumb = art.avoid[avoid.id];
            return (
              <li key={avoid.id} style={{ border: "1px solid #eceef2", borderRadius: 10, padding: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ position: "relative", marginBottom: 4 }}>
                  <Thumb label={`Drawing of a photo to avoid: ${art.avoidAlt[avoid.id]}`} />
                  <Badge />
                </div>
                <b style={{ fontSize: 14, color: INK }}>{avoid.title}</b>
                <span style={{ fontSize: 13, color: MUTED, lineHeight: 1.35 }}>{avoid.detail}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
