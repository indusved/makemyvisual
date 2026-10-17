import type { CSSProperties, ReactNode } from "react";
import { color } from "./theme";

// Interface icons: line drawings on a 24px grid in the text colour around them, so a parent's
// `color` (or a class such as .mmv-note--error) tints them. Always decorative: the words beside
// them carry the meaning, so they are hidden from screen readers.
const PATHS = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  chevronLeft: <path d="M14.5 5.5L8 12l6.5 6.5" />,
  chevronDown: <path d="M6 9.5l6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  alert: <path d="M12 3.8L2.8 19.5h18.4L12 3.8z M12 10v4 M12 16.8v.2" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5 M12 7.8v.2" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 16l5-5 4 4 3-3 6 6" />
      <circle cx="16" cy="9" r="1.5" />
    </>
  ),
  play: <path d="M8 5.8v12.4L18 12 8 5.8z" fill="currentColor" />,
  pause: <path d="M9 6v12M15 6v12" />,
  replay: <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3 M4.5 4.5v4h4" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

// className and style are for placement only (margins, absolute position); colour comes from the parent.
type Placement = { className?: string; style?: CSSProperties };

export function Icon({ name, size = 20, className, style }: { name: IconName; size?: number } & Placement) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ flexShrink: 0, ...style }}
    >
      {PATHS[name]}
    </svg>
  );
}

// The gold check disc on a chosen card or background tile. The ink ring is the real "chosen" cue;
// this only adds to it, so gold is never the only sign. The check stays 2.2px at any size.
export function CheckDisc({ size = 20, className, style }: { size?: number } & Placement) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={className} style={{ display: "block", flexShrink: 0, ...style }}>
      <circle cx="10" cy="10" r="10" fill={color.accent} />
      <path d="M6 10.4l2.8 2.8 5.4-5.8" fill="none" stroke={color.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// The guide's verdict mark: a white check on green for "Like this", a white x on red for "Avoid".
export function VerdictDot({ ok, size = 16, className, style }: { ok: boolean; size?: number } & Placement) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={className} style={{ display: "block", flexShrink: 0, ...style }}>
      <circle cx="8" cy="8" r="8" fill={ok ? color.success : color.danger} />
      <path
        d={ok ? "M4.6 8.3l2.3 2.3 4.5-4.8" : "M5.4 5.4l5.2 5.2M10.6 5.4l-5.2 5.2"}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
