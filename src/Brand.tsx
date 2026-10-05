import type { ReactNode } from "react";
import { BRAND, DEFAULT_INDUSTRY, INDUSTRIES, type IndustryKey } from "../convex/industries";

const INK = "#111317";
const AMBER = "#F5B700";

// Viewfinder mark: four frame corners around a focus dot.
function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect width="32" height="32" rx="8" fill={INK} />
      <path d="M9 13V9h4M19 9h4v4M23 19v4h-4M13 23H9v-4" fill="none" stroke={AMBER} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="2.6" fill={AMBER} />
    </svg>
  );
}

// Line icons on a 24px grid, one per vertical. A vertical without one falls back to the viewfinder corners.
const VERTICAL_ICONS: Partial<Record<IndustryKey, ReactNode>> = {
  automotive: (
    <>
      <path d="M4.8 17H3.5a1 1 0 0 1-1-1v-2.6a2 2 0 0 1 1.4-1.9l2.1-.7 2.3-3.5A2 2 0 0 1 10 6.4h4.4a2 2 0 0 1 1.6.8l2.6 3.4 1.9.6a2 2 0 0 1 1.4 1.9V16a1 1 0 0 1-1 1h-1.7M9.2 17h5.6M6 10.8h12.6M12.3 6.4v4.4" />
      <circle cx="7" cy="17" r="2.2" />
      <circle cx="17" cy="17" r="2.2" />
    </>
  ),
  fashion: <path d="M9 3.5 4.5 5.5 2 10l3.2 1.6L7 9.8v10.7h10V9.8l1.8 1.8L22 10l-2.5-4.5L15 3.5a3 3 0 0 1-6 0Z" />,
  gifting: (
    <>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M4.5 12v7.5a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V12M12 8v12.5" />
      <path d="M12 8c-1-2.8-4.5-4.2-5.2-2.2C6.3 7.3 8.5 8 12 8Zm0 0c1-2.8 4.5-4.2 5.2-2.2.5 1.5-1.7 2.2-5.2 2.2Z" />
    </>
  ),
  skincare: (
    <>
      <rect x="10.2" y="2" width="3.6" height="4.5" rx="1.8" />
      <path d="M9 6.5h6V9H9Z" />
      <rect x="7" y="9" width="10" height="13" rx="2.5" />
      <path d="M7 13.5h10M7 18h10" />
    </>
  ),
};

export function VerticalIcon({ industry, size = 44 }: { industry: IndustryKey; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      <rect width="44" height="44" rx="11" fill={INK} />
      <g transform="translate(7 7) scale(1.25)" fill="none" stroke={AMBER} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {VERTICAL_ICONS[industry] ?? <path d="M5 9V5h4M15 5h4v4M19 15v4h-4M9 19H5v-4" />}
      </g>
    </svg>
  );
}

export default function Brand({
  industry = DEFAULT_INDUSTRY,
  size = 28,
  showSuffix = true,
}: {
  industry?: IndustryKey;
  size?: number;
  showSuffix?: boolean;
}) {
  const suffix = INDUSTRIES[industry].brandSuffix;
  const [make, my, visual] = ["Make", "My", BRAND.slice("MakeMy".length)];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.4, flexWrap: "wrap" }} aria-label={showSuffix ? `${BRAND} ${suffix}` : BRAND}>
      <Mark size={size * 1.3} />
      <span style={{ fontSize: size, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, color: INK }}>
        {make}
        <span style={{ fontWeight: 500 }}>{my}</span>
        <span style={{ color: INK, background: AMBER, padding: "0 0.12em", marginLeft: "0.04em", borderRadius: 4 }}>{visual}</span>
      </span>
      {showSuffix && (
        <span style={{ fontSize: size * 0.5, fontWeight: 600, color: "#5b6170", letterSpacing: "0.02em", textTransform: "uppercase" }}>{suffix}</span>
      )}
    </span>
  );
}
