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

type Tone = "ink" | "muted" | "dim";
const TONES: Record<Tone, { line: string; soft: string; fill: string; glass: string; lamp: string; shadow: string }> = {
  ink: { line: INK, soft: GREY, fill: "#fff", glass: "#e6e9ee", lamp: AMBER, shadow: "#e2e5ea" },
  muted: { line: "#b4b8c0", soft: "#c9ccd2", fill: "#fbfbfc", glass: "#f0f1f4", lamp: "#e3e5e9", shadow: "transparent" },
  dim: { line: "#4d525c", soft: "#3b3f47", fill: "#262a30", glass: "#2e3238", lamp: "#5a5032", shadow: "#16181c" },
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

const D2cGood = ({ label }: ArtProps) => (
  <Frame label={label} w={320} h={200}>
    <path d="M0 184 H320" stroke={GREY} strokeWidth="1.5" />
    <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
      <path d="M176 133 V176" stroke={GREY} />
      <path d="M44 147 V184 M150 147 V184" />
      <path d="M34 140 L58 126 H182 L158 140 Z" fill={TABLE} />
      <path d="M34 140 H158 V147 H34 Z M158 140 L182 126 V133 L158 147 Z" fill="#fff" />
    </g>
    <path d="M27 108 H300" stroke={AMBER} strokeWidth="2" strokeDasharray="5 5" />
    <g transform="translate(62 61) scale(0.75)">
      <GiftBox />
    </g>
    <g transform="translate(196 60) scale(0.72)">
      <HangingShirt />
    </g>
    <Phone x={10} y={97} />
    <Corners x={48} y={56} w={100} h={100} len={12} />
    <Corners x={186} y={50} w={92} h={104} len={12} />
    <circle cx="167" cy="108" r="11" fill="#fff" stroke={GREY} strokeWidth="1.5" />
    <text x="167" y="112" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="12" fontWeight="700" fill={MUTED}>
      or
    </text>
  </Frame>
);

const D2cCropped = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <rect y="108" width="160" height="12" fill={TABLE} />
    <path d="M0 108 H160" stroke={GREY} strokeWidth="1.5" />
    <g transform="translate(-30 -22) scale(1.3)">
      <GiftBox />
    </g>
  </Frame>
);

const D2cAbove = ({ label }: ArtProps) => (
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
    <g transform="translate(80 4) rotate(90 6.5 11)">
      <Phone x={0} y={0} />
    </g>
    <path d="M86.5 24 V36 M81.5 31 L86.5 37 L91.5 31" fill="none" stroke={AMBER} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Frame>
);

const D2cCluttered = ({ label }: ArtProps) => (
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

const D2cDark = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120} dark>
    <g transform="translate(57 26) scale(0.62)">
      <path d={SHIRT} fill="#121418" />
    </g>
    <g transform="translate(48 20) scale(0.62)">
      <HangingShirt tone="dim" />
    </g>
    <circle cx="80" cy="52" r="6" fill="#fff" opacity="0.85" />
    <circle cx="80" cy="52" r="13" fill="#fff" opacity="0.15" />
  </Frame>
);

type Art = (p: ArtProps) => ReactNode;
// `alt` (optional) describes what a drawing shows, for screen readers. Without it the label uses the caption / avoid copy.
const ART: Record<IndustryKey, { good: Art; caption: string; alt?: string; avoid: Record<string, Art>; avoidAlt?: Record<string, string> }> = {
  automotive: {
    good: CarGood,
    caption: "Whole car in view, shot from the front corner, phone at headlight height.",
    avoid: { cropped: CarCropped, above: CarAbove, cluttered: CarCluttered, dark: CarDark },
  },
  d2c: {
    good: D2cGood,
    caption: "Gift box closed on a table, or clothes on a hanger. Whole product in view, phone level with it.",
    alt: "A closed gift box with a ribbon standing on a table, or a shirt on a hanger against a plain wall. Each has space around it and the phone is held level with its middle.",
    avoid: { cropped: D2cCropped, above: D2cAbove, cluttered: D2cCluttered, dark: D2cDark },
    avoidAlt: {
      cropped: "A gift box so close that its top and left side are cut off by the frame.",
      above: "A shirt laid flat on a bed, shot from above with the phone pointing down.",
      cluttered: "Hands holding a gift box in front of a busy shelf.",
      dark: "A shirt on a hanger in a dark room, with flash glare and a hard shadow behind it.",
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
            <Good label={`Drawing of a good photo. ${art.alt ?? art.caption}`} />
            <Badge ok />
          </div>
          <figcaption style={{ fontSize: 14, color: MUTED, marginTop: 8, lineHeight: 1.4 }}>
            <b style={{ color: GREEN }}>Like this:</b> {art.caption}
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
                  {Thumb && <Thumb label={`Drawing of a photo to avoid: ${art.avoidAlt?.[avoid.id] ?? avoid.detail}`} />}
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
