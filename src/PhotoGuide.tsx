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

// Drawn in an 80×140 box, base on y=140.
function Bottle({ tone = "ink" }: { tone?: Tone }) {
  const t = TONES[tone];
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx="40" cy="140" rx="42" ry="4.5" fill={t.shadow} />
      <rect x="27" y="1" width="26" height="20" rx="3" fill={t.line} stroke={t.line} strokeWidth="2.5" />
      <rect x="31" y="21" width="18" height="9" fill={t.fill} stroke={t.line} strokeWidth="2.2" />
      <path d="M31 30 C31 40 10 42 10 56 V131 Q10 139 18 139 H62 Q70 139 70 131 V56 C70 42 49 40 49 30 Z" fill={t.glass} stroke={t.line} strokeWidth="2.5" />
      <rect x="16" y="70" width="48" height="46" rx="3" fill={t.fill} stroke={t.line} strokeWidth="2" />
      <rect x="16" y="82" width="48" height="10" fill={t.lamp} />
      <path d="M24 101 H56 M28 108 H52" stroke={t.soft} strokeWidth="2" />
      <path d="M16 58 V64" stroke={t.fill} strokeWidth="3" />
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

const BottleGood = ({ label }: ArtProps) => (
  <Frame label={label} w={320} h={200}>
    <rect y="150" width="320" height="50" fill="#e9ecf0" />
    <path d="M0 150 H320" stroke={GREY} strokeWidth="1.5" />
    <path d="M27 115 H150" stroke={AMBER} strokeWidth="2" strokeDasharray="5 5" />
    <g transform="translate(126 40) scale(0.85)">
      <Bottle />
    </g>
    <Phone x={10} y={104} />
    <Corners x={98} y={24} w={124} h={152} len={12} />
  </Frame>
);

const BottleCropped = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <rect y="104" width="160" height="16" fill="#e9ecf0" />
    <path d="M0 104 H160" stroke={GREY} strokeWidth="1.5" />
    <g transform="translate(36 -26) scale(1.12)">
      <Bottle />
    </g>
  </Frame>
);

const BottleAbove = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <rect width="160" height="120" fill="#e9ecf0" />
    <g strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx="88" cy="104" rx="34" ry="10" fill={TONES.ink.shadow} />
      <path d="M50 60 L60 102 A22 7 0 0 0 104 102 L114 60 Z" fill={TONES.ink.glass} stroke={INK} strokeWidth="2.5" />
      <path d="M53 74 Q82 84 111 74 L109 84 Q82 94 55 84 Z" fill={AMBER} />
      <ellipse cx="82" cy="60" rx="32" ry="14" fill={TONES.ink.glass} stroke={INK} strokeWidth="2.5" />
      <path d="M70 46 V56 A12 5 0 0 0 94 56 V46" fill={INK} stroke={INK} strokeWidth="2" />
      <ellipse cx="82" cy="46" rx="12" ry="5" fill="#3a3e46" stroke={INK} strokeWidth="2" />
      <path d="M58 56 Q64 50 72 49" fill="none" stroke="#fff" strokeWidth="2.5" />
    </g>
    <g transform="translate(14 4) rotate(90 6.5 11)">
      <Phone x={0} y={0} />
    </g>
    <path d="M20 24 V36 M15 31 L20 37 L25 31" fill="none" stroke={AMBER} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Frame>
);

const BottleCluttered = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120}>
    <g stroke="#d3d6dc" strokeWidth="5">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <path key={i} d={`M${i * 24 - 40} 0 L${i * 24 + 40} 104`} />
      ))}
    </g>
    <rect y="104" width="160" height="16" fill="#e9ecf0" />
    <path d="M0 104 H160" stroke={GREY} strokeWidth="1.5" />
    <g strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" stroke={GREEN}>
      <path d="M24 104 Q16 80 26 58 M26 104 Q32 84 44 72" fill="none" />
      <path d="M26 58 Q14 52 12 40 Q26 44 26 58 Z M44 72 Q50 60 60 60 Q56 74 44 72 Z" fill="#cfe6d5" />
    </g>
    <g transform="translate(58 36) scale(0.48)">
      <Bottle />
    </g>
    <g stroke={INK} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="#fff">
      <path d="M160 58 H118 Q104 58 104 72 V86 Q104 98 118 98 H160" />
      {[64, 72, 80, 88].map((y) => (
        <rect key={y} x="80" y={y} width="34" height="8" rx="4" />
      ))}
    </g>
  </Frame>
);

const BottleDark = ({ label }: ArtProps) => (
  <Frame label={label} w={160} h={120} dark>
    <rect y="104" width="160" height="16" fill="#23262c" />
    <g transform="translate(60 36) scale(0.48)">
      <Bottle tone="dim" />
    </g>
    <circle cx="74" cy="64" r="9" fill="#fff" opacity="0.85" />
    <circle cx="74" cy="64" r="16" fill="#fff" opacity="0.15" />
  </Frame>
);

type Art = (p: ArtProps) => ReactNode;
const ART: Record<IndustryKey, { good: Art; caption: string; avoid: Record<string, Art> }> = {
  automotive: {
    good: CarGood,
    caption: "Whole car in view, shot from the front corner, phone at headlight height.",
    avoid: { cropped: CarCropped, above: CarAbove, cluttered: CarCluttered, dark: CarDark },
  },
  d2c: {
    good: BottleGood,
    caption: "Whole product in view, in front of a plain wall, phone at product height.",
    avoid: { cropped: BottleCropped, above: BottleAbove, cluttered: BottleCluttered, dark: BottleDark },
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
            <Good label={`Drawing of a good photo. ${art.caption}`} />
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
                  {Thumb && <Thumb label={`Drawing of a photo to avoid: ${avoid.detail}`} />}
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
