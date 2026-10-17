import type { ContactKind } from "../convex/industries";

// Shared by the business forms and the renderer: what kind of contact a text is, and how it is shown.

export const CONTACT_LABEL: Record<ContactKind, string> = { instagram: "Instagram", whatsapp: "WhatsApp", website: "Website" };

// Each kind's icon on a 24×24 grid, in the text's colour with round ends: lines stroked 2 wide, bold
// stroked 3.4 wide, dots filled. It covers 2.5 to 21.5 both ways. The form draws it as SVG, the visuals
// on canvas, so the two match. Plain generic shapes, no brand colours.
export const ICON_EDGE = 2.5;
export const ICON_SPAN = 19;
export const CONTACT_ICON: Record<ContactKind, { lines: string; bold?: string; dots?: string }> = {
  // Rounded square, lens, and a dot at the top right.
  instagram: {
    lines: "M8.5 3.5h7a5 5 0 0 1 5 5v7a5 5 0 0 1-5 5h-7a5 5 0 0 1-5-5v-7a5 5 0 0 1 5-5z M16 12a4 4 0 1 1-8 0a4 4 0 1 1 8 0z",
    dots: "M18.3 6.9a1.2 1.2 0 1 1-2.4 0a1.2 1.2 0 1 1 2.4 0z",
  },
  // Round speech bubble with its tail at the bottom left, and a phone handset inside.
  whatsapp: {
    lines: "M4.1 15.13A8.5 8.5 0 1 1 8.87 19.9L3.5 20.5z M9.15 10.3v0.75a3.8 3.8 0 0 0 3.8 3.8h0.75",
    bold: "M9.15 8.9v1.4 M13.7 14.85h1.4",
  },
  // Globe: circle, one upright oval, one line across.
  website: {
    lines: "M20.5 12a8.5 8.5 0 1 1-17 0a8.5 8.5 0 1 1 17 0z M12 3.5a3.8 8.5 0 1 0 0 17a3.8 8.5 0 1 0 0-17z M3.5 12h17",
  },
};

// "@shop" or an Instagram link → Instagram; a number with 7+ digits (or a wa.me link) → WhatsApp;
// "shop.in" or a link → website. null when it can't tell (say, "shop" with no @, or an email).
export function guessContactKind(text: string): ContactKind | null {
  const t = text.trim();
  if (!t) return null;
  if (t.startsWith("@") || /^(https?:\/\/)?(www\.)?instagram\.com(\/|$)/i.test(t)) return "instagram";
  if (/^(https?:\/\/)?(wa\.me|api\.whatsapp\.com)\//i.test(t)) return "whatsapp";
  if (/^[\d\s+\-().]+$/.test(t) && (t.match(/\d/g)?.length ?? 0) >= 7) return "whatsapp";
  if (/^(https?:\/\/|www\.)/i.test(t) || (t.includes(".") && !/\s/.test(t) && !/.@/.test(t))) return "website";
  return null;
}

// How the contact reads on a visual: Instagram as one "@handle" (from a pasted profile link too),
// a website without "https://", "www." or a trailing "/", a WhatsApp number as typed. Never empties a value.
export function formatContact(text: string, kind: ContactKind): string {
  const t = text.trim();
  let out = t;
  if (kind === "instagram") {
    out = t
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/^instagram\.com\//i, "")
      .replace(/[?#].*$/, "")
      .replace(/\/+$/, "")
      .replace(/^@+/, "");
    out = out ? "@" + out : "";
  } else if (kind === "website") {
    out = t.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "");
  }
  return out || t;
}

// The contact as drawn: the given kind, else a guess (older profiles have none). No kind = no icon, text as typed.
export function shownContact(text: string | undefined, kind?: ContactKind): { text: string; kind: ContactKind | null } | null {
  const t = text?.trim();
  if (!t) return null;
  const k = kind ?? guessContactKind(t);
  return { text: k ? formatContact(t, k) : t, kind: k };
}
