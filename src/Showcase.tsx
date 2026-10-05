import { useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../convex/_generated/api";
import { INDUSTRIES, INDUSTRY_KEYS, SEASON, type IndustryKey } from "../convex/industries";

export type ShowcaseItem = FunctionReturnType<typeof api.showcase.list>[number];
export type MakeKind = ShowcaseItem["kind"];

const INK = "#111317";
const AMBER = "#F5B700";
const MUTED = "#5b6170";
const MAROON = "#6B1020";

const KIND_LABEL: Record<MakeKind, string> = { greeting: SEASON.label, offer: "Offer ad" };

const pill = (kind: MakeKind) => ({
  display: "inline-block",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.3,
  borderRadius: 999,
  padding: "2px 8px",
  color: kind === "greeting" ? "#FFE9B8" : AMBER,
  background: kind === "greeting" ? MAROON : INK,
});

// One example image per vertical for the "What do you sell?" cards: only that vertical's own examples, the wanted kind first.
export function exampleImages(items: ShowcaseItem[] | undefined, prefer: MakeKind) {
  const out: Partial<Record<IndustryKey, string>> = {};
  for (const k of INDUSTRY_KEYS) {
    const own = (items ?? []).filter((i) => i.industry === k && i.url);
    const pick = own.find((i) => i.kind === prefer) ?? own[0];
    if (pick?.url) out[k] = pick.url;
  }
  return out;
}

// A vertical page only ever shows its own examples plus season-wide ones (no vertical), the wanted kind first.
export function examplesFor(items: ShowcaseItem[] | undefined, industry: IndustryKey, prefer: MakeKind) {
  const rank = (i: ShowcaseItem) => (i.kind === prefer ? 0 : 2) + (i.industry === industry ? 0 : 1);
  return (items ?? []).filter((i) => i.industry === industry || i.industry === undefined).sort((a, b) => rank(a) - rank(b));
}

// Example outputs in a row that scrolls sideways and snaps to each image. Renders nothing when there are none.
export function ShowcaseRow({ items, label, height = 260, showIndustry = false }: { items: ShowcaseItem[]; label: string; height?: number; showIndustry?: boolean }) {
  // Width-to-height of each image once loaded, so every example shows whole, never cropped.
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const shown = items.filter((i) => i.url);
  if (shown.length === 0) return null;

  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        overflowX: "auto",
        scrollSnapType: "x mandatory",
        scrollPaddingInline: 16,
        overscrollBehaviorX: "contain",
        margin: "0 -16px",
        padding: "4px 16px 14px",
      }}
    >
      {shown.map((item, index) => {
        const ratio = ratios[item.key] ?? 0.8;
        return (
          <figure key={item.key} style={{ flex: "0 0 auto", width: `min(${Math.round(height * ratio)}px, 78vw)`, margin: 0, scrollSnapAlign: "start" }}>
            <img
              src={item.url ?? undefined}
              alt=""
              loading={index < 3 ? "eager" : "lazy"}
              decoding="async"
              onLoad={(e) => {
                const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                if (w && h) setRatios((r) => (r[item.key] ? r : { ...r, [item.key]: w / h }));
              }}
              style={{
                display: "block",
                width: "100%",
                aspectRatio: String(ratio),
                objectFit: "cover",
                borderRadius: 10,
                background: "#efedf0",
                boxShadow: "0 0 0 1px rgba(17,19,23,0.08)",
              }}
            />
            <figcaption style={{ marginTop: 8 }}>
              <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 8px" }}>
                <span style={pill(item.kind)}>{KIND_LABEL[item.kind]}</span>
                {showIndustry && item.industry && <span style={{ fontSize: 13, color: MUTED }}>{INDUSTRIES[item.industry].chooserLabel}</span>}
              </span>
              <span style={{ display: "block", fontSize: 14, lineHeight: 1.35, marginTop: 4, color: INK }}>{item.caption}</span>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
