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

export default function Brand({ industry = DEFAULT_INDUSTRY, size = 28 }: { industry?: IndustryKey; size?: number }) {
  const suffix = INDUSTRIES[industry].brandSuffix;
  const [make, my, visual] = ["Make", "My", BRAND.slice("MakeMy".length)];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.4, flexWrap: "wrap" }} aria-label={`${BRAND} ${suffix}`}>
      <Mark size={size * 1.3} />
      <span style={{ fontSize: size, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, color: INK }}>
        {make}
        <span style={{ fontWeight: 500 }}>{my}</span>
        <span style={{ color: INK, background: AMBER, padding: "0 0.12em", marginLeft: "0.04em", borderRadius: 4 }}>{visual}</span>
      </span>
      <span style={{ fontSize: size * 0.5, fontWeight: 600, color: "#5b6170", letterSpacing: "0.02em", textTransform: "uppercase" }}>{suffix}</span>
    </span>
  );
}
