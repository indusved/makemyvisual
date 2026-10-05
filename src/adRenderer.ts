// Draws one offer ad (or Diwali greeting) per size on a canvas. The item (car, outfit, gift or
// product) is never altered or generated: either the original photo (scaled, cropped or fitted)
// or the user's own one cut out and placed on a backdrop. Offer text sits in a separate panel.
import { BRAND, INDUSTRIES } from "../convex/industries";

export type Offer = {
  headline: string;
  details?: string;
  validity?: string;
  finePrint?: string;
  message?: string;
  businessName?: string;
  contact?: string;
};

export type Greeting = { headline: string; message?: string; businessName?: string; contact?: string };

// Cut-out item on an AI backdrop. Without a scene, the original photo is used.
export type Scene = { background: HTMLImageElement; subject: HTMLCanvasElement };

// Share of the photo area the cut-out may fill. "floor": stands on the ground with a
// contact shadow. "hanging": hangs on the wall (clothes on a hanger) with a soft shadow behind.
export type Placement = { maxWidth: number; maxHeight: number; mode: "floor" | "hanging" };

export type AdSize = {
  key: string;
  label: string;
  width: number;
  height: number;
  // Instagram/WhatsApp stories cover the top and bottom with UI.
  safeTop?: number;
  safeBottom?: number;
  // Printed and trimmed, so everything keeps further from the edges.
  print?: boolean;
};

export const AD_SIZES: AdSize[] = [
  { key: "instagram-post", label: "Instagram post", width: 1080, height: 1080 },
  { key: "instagram-portrait", label: "Instagram portrait", width: 1080, height: 1350 },
  { key: "story", label: "Story / WhatsApp status", width: 1080, height: 1920, safeTop: 250, safeBottom: 250 },
  { key: "facebook", label: "Facebook link", width: 1200, height: 628 },
  { key: "google-banner", label: "Google banner", width: 300, height: 250 },
];

// WhatsApp chat first: it is where most greetings get sent.
export const GREETING_SIZES: AdSize[] = [
  { key: "whatsapp", label: "WhatsApp chat", width: 1080, height: 1080 },
  { key: "status", label: "WhatsApp / Instagram status", width: 1080, height: 1920, safeTop: 250, safeBottom: 250 },
  { key: "instagram", label: "Instagram post", width: 1080, height: 1350 },
  { key: "email", label: "Email / LinkedIn", width: 1200, height: 628 },
  { key: "card", label: "Gift box card (4×6 in, print)", width: 1200, height: 1800, print: true },
];

const COLORS = { panel: "#111317", text: "#FFFFFF", muted: "#B9BDC6", accent: "#F5B700", accentText: "#111317" };
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Noto Sans Devanagari", sans-serif';
// Letter spacing for the business name, as a share of its font size.
const TRACKING = 0.14;
const SINGLE_LINE = 1.2;

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the photo."));
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// The original photo filling x,y,w,h. If filling would hide more than 15% of the
// photo's top or bottom between top and bottom (a portrait phone photo in a wide
// strip, or under story UI), the whole photo is fitted there instead, over a
// blurred, dimmed copy of itself.
function drawPhoto(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, top = y, bottom = y + h) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const drawnH = ih * Math.max(w / iw, h / ih);
  const drawnTop = y + (h - drawnH) / 2;
  if ((top - drawnTop) / drawnH <= 0.15 && (bottom - drawnTop) / drawnH >= 0.85) return drawCover(ctx, img, x, y, w, h);

  const blur = Math.max(2, Math.round(Math.min(w, h) * 0.04));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.filter = `blur(${blur}px)`;
  drawCover(ctx, img, x - blur * 2, y - blur * 2, w + blur * 4, h + blur * 4);
  ctx.filter = "none";
  ctx.fillStyle = "rgba(17,19,23,0.35)";
  ctx.fillRect(x, y, w, h);
  const s = Math.min(w / iw, (bottom - top) / ih);
  ctx.drawImage(img, x + (w - iw * s) / 2, top + (bottom - top - ih * s) / 2, iw * s, ih * s);
  ctx.restore();
}

// Flattened, blurred copy of the subject's own outline, used as a ground shadow so
// it lines up with the wheels or base. squash = shadow height as a share of its height.
function drawSilhouetteShadow(ctx: CanvasRenderingContext2D, subject: HTMLCanvasElement, cx: number, floor: number, cw: number, ch: number, squash: number, blur: number, alpha: number) {
  const sil = document.createElement("canvas");
  sil.width = subject.width;
  sil.height = subject.height;
  const s = sil.getContext("2d")!;
  s.drawImage(subject, 0, 0);
  s.globalCompositeOperation = "source-in";
  s.fillStyle = "#000";
  s.fillRect(0, 0, sil.width, sil.height);

  const sh = Math.max(2, ch * squash);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.filter = `blur(${Math.max(1, blur)}px)`;
  ctx.drawImage(sil, cx - cw * 0.02, floor - sh * 0.75, cw * 1.04, sh);
  ctx.restore();
}

// The backdrop fills x,y,w,h; the subject stays between subjectTop and the floor line
// (floorRatio of the height), clear of story UI and the panel fade.
function drawScene(ctx: CanvasRenderingContext2D, scene: Scene, placement: Placement, x: number, y: number, w: number, h: number, subjectTop = y, floorRatio = 0.9) {
  drawCover(ctx, scene.background, x, y, w, h);
  const subject = scene.subject;
  const floor = y + h * floorRatio;
  const room = floor - subjectTop;

  if (placement.mode === "hanging") {
    // Hanger hook a tenth of the way down the clear area.
    const hook = subjectTop + room * 0.1;
    const scale = Math.min((w * placement.maxWidth) / subject.width, Math.min(room * placement.maxHeight, floor - hook) / subject.height);
    const cw = subject.width * scale;
    drawSubject(ctx, subject, "hanging", x + (w - cw) / 2, hook, cw, subject.height * scale);
    return;
  }

  const scale = Math.min((w * placement.maxWidth) / subject.width, (room * placement.maxHeight) / subject.height);
  const cw = subject.width * scale;
  drawSubject(ctx, subject, "floor", x + (w - cw) / 2, floor, cw, subject.height * scale);
}

// The cut-out at cw×ch with its left edge at left. "floor": base on the floor line y.
// "hanging": hanger hook at y. shade scales the shadows (lighter on pale surfaces).
function drawSubject(ctx: CanvasRenderingContext2D, subject: HTMLCanvasElement, mode: Placement["mode"], left: number, y: number, cw: number, ch: number, shade = 1) {
  if (mode === "hanging") {
    // The garment's own outline, blurred and nudged down-right, falls on the wall just behind it.
    ctx.save();
    ctx.shadowColor = `rgba(0,0,0,${0.26 * shade})`;
    ctx.shadowBlur = Math.max(2, ch * 0.04);
    ctx.shadowOffsetX = ch * 0.018;
    ctx.shadowOffsetY = ch * 0.03;
    ctx.drawImage(subject, left, y, cw, ch);
    ctx.restore();
    return;
  }
  // Wide, soft ambient shadow, then a tight dark contact shadow right underneath.
  drawSilhouetteShadow(ctx, subject, left, y, cw, ch, 0.22, cw * 0.035, 0.45 * shade);
  drawSilhouetteShadow(ctx, subject, left, y, cw, ch, 0.07, cw * 0.008, 0.8 * shade);
  // Sink it slightly into its shadow so it touches the ground.
  ctx.drawImage(subject, left, y - ch + ch * 0.012, cw, ch);
}

// weight may carry a style too ("italic 400").
function setFont(ctx: CanvasRenderingContext2D, weight: number | string, size: number, tracking = 0, family = FONT) {
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.letterSpacing = `${size * tracking}px`;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? line + " " + word : word;
    if (ctx.measureText(next).width <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

type Lines = { lines: string[]; size: number; lineHeight: number; widest: number };

// balance: same number of lines, but as even in length as possible (greetings).
function block(ctx: CanvasRenderingContext2D, text: string, weight: number | string, size: number, maxWidth: number, family = FONT, leading = 1.15, balance = false): Lines {
  setFont(ctx, weight, size, 0, family);
  let lines = wrap(ctx, text, maxWidth);
  if (balance && lines.length > 1) {
    let lo = maxWidth * 0.4;
    let hi = maxWidth;
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      if (wrap(ctx, text, mid).length === lines.length) hi = mid;
      else lo = mid;
    }
    lines = wrap(ctx, text, hi);
  }
  return { lines, size, lineHeight: size * leading, widest: Math.max(...lines.map((l) => ctx.measureText(l).width)) };
}

const tall = (b: Lines | null) => (b ? b.lines.length * b.lineHeight : 0);

// Largest font size (down to min) at which the text fits the box.
function fit(ctx: CanvasRenderingContext2D, text: string, weight: number | string, maxWidth: number, maxHeight: number, maxSize: number, minSize: number, family = FONT, leading = 1.15, balance = false): Lines {
  for (let size = maxSize; size >= minSize; size -= 1) {
    const b = block(ctx, text, weight, size, maxWidth, family, leading);
    if (tall(b) <= maxHeight && b.widest <= maxWidth) return balance ? block(ctx, text, weight, size, maxWidth, family, leading, true) : b;
  }
  return block(ctx, text, weight, minSize, maxWidth, family, leading, balance);
}

// Largest font size (down to min) at which the text fits on one line.
function fitLine(ctx: CanvasRenderingContext2D, text: string, weight: number | string, maxWidth: number, maxSize: number, minSize: number, tracking = 0, family = FONT) {
  let size = maxSize;
  for (; size > minSize; size -= 1) {
    setFont(ctx, weight, size, tracking, family);
    if (ctx.measureText(text).width <= maxWidth) break;
  }
  return Math.max(size, minSize);
}

// fillText's maxWidth squeezes a line that is still too wide instead of letting it clip.
function drawLines(ctx: CanvasRenderingContext2D, b: Lines, x: number, y: number, maxWidth: number) {
  b.lines.forEach((l, i) => ctx.fillText(l, x, y + i * b.lineHeight, maxWidth));
  return y + b.lines.length * b.lineHeight;
}

function clip(b: Lines, max: number): Lines {
  if (b.lines.length <= max) return b;
  const lines = b.lines.slice(0, Math.max(0, max));
  if (lines.length) lines[lines.length - 1] += "…";
  return { ...b, lines };
}

type Panel = {
  biz: { text: string; size: number } | null;
  head: Lines;
  det: Lines | null;
  pill: { text: string; size: number } | null;
  contact: { text: string; size: number } | null;
  fine: Lines | null;
  // Spacing unit; shrinks along with the smaller text.
  g: number;
  // Height left for the headline and details.
  room: number;
  fits: boolean;
};

// One layout attempt for the text panel. Business name (top), validity pill, contact
// and fine print (bottom) are sized and reserved first, scaled by k; the headline then
// takes the largest size that fits, with the details line at 60% of it.
function planPanel(ctx: CanvasRenderingContext2D, offer: Offer, w: number, h: number, unit: number, k: number, withContact: boolean): Panel {
  const pad = unit * 0.6;
  const innerW = w - pad * 2;
  const g = unit * k;

  const bizText = offer.businessName?.trim().toUpperCase();
  const biz = bizText ? { text: bizText, size: fitLine(ctx, bizText, 700, innerW, Math.max(8, g * 0.3), Math.max(7, unit * 0.2), TRACKING) } : null;
  const contactText = withContact ? offer.contact?.trim() : undefined;
  const contact = contactText ? { text: contactText, size: fitLine(ctx, contactText, 600, innerW, Math.max(9, g * 0.36), Math.max(8, unit * 0.26)) } : null;
  const fine = offer.finePrint ? fit(ctx, offer.finePrint, 400, innerW, h * 0.18, Math.max(9, g * 0.32), Math.max(7, unit * 0.18)) : null;
  const pill = offer.validity?.trim() ? { text: offer.validity.trim().toUpperCase(), size: Math.max(10, g * 0.42) } : null;

  const reserved =
    (biz ? biz.size * SINGLE_LINE + g * 0.25 : 0) +
    (pill ? g * 0.2 + pill.size * 1.7 : 0) +
    (contact || fine ? g * 0.3 : 0) +
    (contact ? contact.size * SINGLE_LINE : 0) +
    (contact && fine ? g * 0.12 : 0) +
    tall(fine);
  const room = h - pad * 2 - reserved;

  const headMin = Math.max(12, unit * 0.5);
  const detMin = Math.max(10, unit * 0.35);
  for (let size = unit * 1.6; ; size -= 1) {
    const last = size <= headMin;
    if (last) size = headMin;
    const head = block(ctx, offer.headline, 800, size, innerW);
    const det = offer.details ? block(ctx, offer.details, 600, Math.min(unit * 0.8, Math.max(detMin, size * 0.6)), innerW) : null;
    const used = tall(head) + (det ? g * 0.15 + tall(det) : 0);
    const fits = used <= room;
    // A single word wider than the panel at the smallest size gets squeezed when drawn.
    if ((fits && (head.widest <= innerW || last)) || last) return { biz, head, det, pill, contact, fine, g, room, fits };
  }
}

// Shrinks the smaller text step by step until the headline fits, drops the contact
// line only if that is not enough, and as a last resort shortens the headline and
// details with "…" so nothing overlaps. The headline and fine print always stay.
function solvePanel(ctx: CanvasRenderingContext2D, offer: Offer, w: number, h: number, unit: number): Panel {
  for (const withContact of offer.contact ? [true, false] : [false]) {
    for (const k of [1, 0.9, 0.8, 0.7, 0.6]) {
      const p = planPanel(ctx, offer, w, h, unit, k, withContact);
      if (p.fits) return p;
    }
  }
  const p = planPanel(ctx, offer, w, h, unit, 0.6, false);
  const detGap = p.g * 0.15;
  const head = clip(p.head, Math.max(1, Math.floor((p.room - (p.det ? detGap + p.det.lineHeight : 0)) / p.head.lineHeight)));
  const det = p.det ? clip(p.det, Math.floor((p.room - tall(head) - detGap) / p.det.lineHeight)) : null;
  return { ...p, head, det: det && det.lines.length > 0 ? det : null };
}

function drawPanel(ctx: CanvasRenderingContext2D, p: Panel, x: number, y: number, w: number, h: number, unit: number) {
  const pad = unit * 0.6;
  const innerW = w - pad * 2;
  const left = x + pad;
  const bottom = y + h - pad;
  let cursor = y + pad;
  ctx.textBaseline = "top";

  if (p.biz) {
    ctx.fillStyle = COLORS.muted;
    setFont(ctx, 700, p.biz.size, TRACKING);
    ctx.fillText(p.biz.text, left, cursor, innerW);
    cursor += p.biz.size * SINGLE_LINE + p.g * 0.25;
  }

  ctx.fillStyle = COLORS.text;
  setFont(ctx, 800, p.head.size);
  cursor = drawLines(ctx, p.head, left, cursor, innerW);

  if (p.det) {
    ctx.fillStyle = COLORS.muted;
    setFont(ctx, 600, p.det.size);
    cursor = drawLines(ctx, p.det, left, cursor + p.g * 0.15, innerW);
  }

  if (p.pill) {
    cursor += p.g * 0.2;
    const { text, size } = p.pill;
    setFont(ctx, 700, size);
    const tw = Math.min(ctx.measureText(text).width, innerW - size);
    const ph = size * 1.7;
    ctx.fillStyle = COLORS.accent;
    ctx.beginPath();
    ctx.roundRect(left, cursor, tw + size, ph, ph / 2);
    ctx.fill();
    ctx.fillStyle = COLORS.accentText;
    ctx.fillText(text, left + size / 2, cursor + (ph - size) / 2, innerW - size);
  }

  let base = bottom;
  if (p.fine) {
    base -= tall(p.fine);
    ctx.fillStyle = COLORS.muted;
    setFont(ctx, 400, p.fine.size);
    drawLines(ctx, p.fine, left, base, innerW);
    base -= p.g * 0.12;
  }
  if (p.contact) {
    ctx.fillStyle = COLORS.text;
    setFont(ctx, 600, p.contact.size);
    ctx.fillText(p.contact.text, left, base - p.contact.size * SINGLE_LINE, innerW);
  }
}

export function renderAd(img: HTMLImageElement, offer: Offer, size: AdSize, scene?: Scene, placement: Placement = INDUSTRIES.automotive.placement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d")!;
  const { width: W, height: H } = size;
  const unit = Math.min(W, H) / 12;

  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(0, 0, W, H);

  if (W / H > 1.5) {
    // Wide: photo left, panel right.
    const photoW = Math.round(W * 0.58);
    if (scene) drawScene(ctx, scene, placement, 0, 0, photoW, H);
    else drawPhoto(ctx, img, 0, 0, photoW, H);
    const grad = ctx.createLinearGradient(photoW - unit * 1.5, 0, photoW, 0);
    grad.addColorStop(0, "rgba(17,19,23,0)");
    grad.addColorStop(1, COLORS.panel);
    ctx.fillStyle = grad;
    ctx.fillRect(photoW - unit * 1.5, 0, unit * 1.5, H);
    drawPanel(ctx, solvePanel(ctx, offer, W - photoW, H, unit), photoW, 0, W - photoW, H, unit);
  } else {
    // Square / tall: photo top, panel bottom, inside story safe zones.
    const top = size.safeTop ?? 0;
    const usableBottom = H - (size.safeBottom ?? 0);
    const usable = usableBottom - top;
    const share = W === 300 ? 0.5 : 0.42;
    // Busy offers get up to 8% more of the height before any text is shrunk.
    const roomy = (p: Panel) => p.fits && p.head.size >= unit * 0.75;
    let panelH = Math.round(usable * share);
    let panel = planPanel(ctx, offer, W, panelH, unit, 1, true);
    for (const extra of [0.02, 0.04, 0.06, 0.08]) {
      if (roomy(panel)) break;
      panelH = Math.round(usable * (share + extra));
      panel = planPanel(ctx, offer, W, panelH, unit, 1, true);
    }
    if (!panel.fits) panel = solvePanel(ctx, offer, W, panelH, unit);
    const panelY = usableBottom - panelH;
    if (scene) drawScene(ctx, scene, placement, 0, 0, W, panelY, top, 0.84);
    else drawPhoto(ctx, img, 0, 0, W, panelY, top);
    const fade = unit * 1.2;
    const grad = ctx.createLinearGradient(0, panelY - fade, 0, panelY);
    grad.addColorStop(0, "rgba(17,19,23,0)");
    grad.addColorStop(1, COLORS.panel);
    ctx.fillStyle = grad;
    ctx.fillRect(0, panelY - fade, W, fade);
    drawPanel(ctx, panel, 0, panelY, W, panelH, unit);
  }
  return canvas;
}

// ── Diwali greetings ────────────────────────────────────────────────────────

// Georgia on most devices; the Devanagari fonts cover Hindi greetings on Mac, Windows and Android.
const SERIF =
  '"Playfair Display", Georgia, "Times New Roman", "Noto Serif", "Noto Serif Devanagari", "Shree Devanagari 714", ' +
  '"Devanagari Sangam MN", "Kohinoor Devanagari", "Nirmala UI", Mangal, "Noto Sans Devanagari", serif';
const DEVANAGARI = /[ऀ-ॿ]/;
// Every greeting backdrop has its table or ledge at about this share of its height.
const SURFACE = 0.885;
// The item is drawn at 80% of its offer size, leaving room for the words.
const GREETING_ITEM = 0.8;

// Gold on dark backdrops; maroon on light ones (the marigold wall).
type Tone = {
  head: [string, string, string];
  glow: string;
  lift: string;
  text: string;
  soft: string;
  // "r,g,b" so they can fade.
  line: string;
  veil: string;
  veilAlpha: number;
  edge: string;
  edgeAlpha: number;
  shade: number;
};
const DARK: Tone = {
  head: ["#FCE7AE", "#F2C46D", "#C98D34"], glow: "rgba(242,196,109,0.4)", lift: "rgba(0,0,0,0.6)", text: "#F8EEDC", soft: "#E3CFAE",
  line: "233,180,76", veil: "20,5,9", veilAlpha: 0.55, edge: "0,0,0", edgeAlpha: 0.42, shade: 0.9,
};
const LIGHT: Tone = {
  head: ["#93203A", "#6B1020", "#4A0915"], glow: "rgba(255,250,240,0.85)", lift: "rgba(255,248,236,0.9)", text: "#3B2318", soft: "#5E3E2A",
  line: "168,118,42", veil: "255,248,234", veilAlpha: 0.5, edge: "90,45,10", edgeAlpha: 0.14, shade: 0.45,
};

// Share of a backdrop's width, at each side, that holds its decorations (lamps, lights).
const SIDE = 0.26;
const sideDecor = new WeakMap<HTMLImageElement, boolean>();

// True when the backdrop's detail sits at its far left and right, around a plain middle.
function decoratedSides(bg: HTMLImageElement) {
  let found = sideDecor.get(bg);
  if (found !== undefined) return found;
  const sw = 96;
  const sh = 64;
  const c = document.createElement("canvas");
  c.width = sw;
  c.height = sh;
  const small = c.getContext("2d", { willReadFrequently: true })!;
  small.drawImage(bg, 0, 0, sw, sh);
  const d = small.getImageData(0, 0, sw, sh).data;
  const lum = (i: number) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  const sum = { sides: 0, middle: 0, ns: 0, nm: 0 };
  for (let col = 0; col < sw - 1; col++) {
    const side = col < sw * SIDE || col >= sw * (1 - SIDE);
    if (!side && (col < sw * 0.3 || col >= sw * 0.7)) continue;
    for (let r = 0; r < sh - 1; r++) {
      const i = (r * sw + col) * 4;
      const v = Math.abs(lum(i + 4) - lum(i)) + Math.abs(lum(i + sw * 4) - lum(i));
      if (side) sum.sides += v;
      else sum.middle += v;
    }
    if (side) sum.ns++;
    else sum.nm++;
  }
  found = sum.sides / sum.ns > (sum.middle / sum.nm) * 2;
  sideDecor.set(bg, found);
  return found;
}

// Cover-fits the backdrop, zooming in (up to 25%) and shifting it so its own table or ledge
// lands on wantFloor where possible. Returns where the surface ended up.
// On tall sizes a wide backdrop decorated only at its sides would lose them to the crop: it is
// drawn smaller instead, its two sides meeting over the plain middle, with its ledge on
// sidesFloor and a blurred copy filling above and below.
function drawBackdrop(ctx: CanvasRenderingContext2D, bg: HTMLImageElement, W: number, H: number, wantFloor: number, sidesFloor = wantFloor) {
  const iw = bg.naturalWidth;
  const ih = bg.naturalHeight;
  const cover = Math.max(W / iw, H / ih);
  const blend = W * 0.16;
  const sides = (W / 2 - blend / 2) / (SIDE * iw);
  if (sides < cover * 0.95 && decoratedSides(bg)) {
    const blur = Math.round(W * 0.03);
    ctx.save();
    ctx.filter = `blur(${blur}px)`;
    drawCover(ctx, bg, -blur * 2, -blur * 2, W + blur * 4, H + blur * 4);
    ctx.restore();

    const dh = ih * sides;
    const half = W / 2 + blend / 2;
    const part = half / sides;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = Math.ceil(dh);
    const o = c.getContext("2d")!;
    o.drawImage(bg, iw - part, 0, part, ih, W - half, 0, half, dh);
    // The left side fades out across the blend, over the right one.
    const l = document.createElement("canvas");
    l.width = Math.ceil(half);
    l.height = c.height;
    const lo = l.getContext("2d")!;
    lo.drawImage(bg, 0, 0, part, ih, 0, 0, half, dh);
    lo.globalCompositeOperation = "destination-in";
    const across = lo.createLinearGradient(W / 2 - blend / 2, 0, half, 0);
    across.addColorStop(0, "#000");
    across.addColorStop(1, "rgba(0,0,0,0)");
    lo.fillStyle = across;
    lo.fillRect(0, 0, l.width, l.height);
    o.drawImage(l, 0, 0);
    // Its top and bottom edges fade into the blurred fill.
    o.globalCompositeOperation = "destination-in";
    const down = o.createLinearGradient(0, 0, 0, dh);
    down.addColorStop(0, "rgba(0,0,0,0)");
    down.addColorStop(0.1, "#000");
    down.addColorStop(0.96, "#000");
    down.addColorStop(1, "rgba(0,0,0,0)");
    o.fillStyle = down;
    o.fillRect(0, 0, c.width, c.height);
    const top = sidesFloor - SURFACE * dh;
    ctx.drawImage(c, 0, top);
    return sidesFloor;
  }
  const scale = Math.min(cover * 1.25, Math.max(cover, (H - wantFloor) / (1 - SURFACE) / ih));
  const dw = iw * scale;
  const dh = ih * scale;
  const top = Math.min(0, Math.max(H - dh, wantFloor - SURFACE * dh));
  ctx.drawImage(bg, (W - dw) / 2, top, dw, dh);
  return top + SURFACE * dh;
}

// Mean brightness (0–1) of a region of what is drawn so far.
function brightness(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const d = ctx.getImageData(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))).data;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < d.length; i += 4 * 13) {
    sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    n++;
  }
  return sum / Math.max(1, n) / 255;
}

// How much detail (edges) each row of a region has, sampled small; 0 = flat wall.
function rowDetail(source: HTMLCanvasElement, x: number, y: number, w: number, h: number) {
  const sw = 48;
  const scale = w / sw;
  const sh = Math.max(1, Math.round(h / scale));
  const c = document.createElement("canvas");
  c.width = sw;
  c.height = sh;
  const small = c.getContext("2d", { willReadFrequently: true })!;
  small.drawImage(source, x, y, w, h, 0, 0, sw, sh);
  const d = small.getImageData(0, 0, sw, sh).data;
  const lum = (i: number) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  const rows: number[] = [];
  for (let r = 0; r < sh; r++) {
    let sum = 0;
    for (let col = 0; col < sw - 1; col++) {
      const i = (r * sw + col) * 4;
      sum += Math.abs(lum(i + 4) - lum(i)) + (r < sh - 1 ? Math.abs(lum(i + sw * 4) - lum(i)) : 0);
    }
    rows.push(sum / (sw - 1));
  }
  return { rows, scale };
}

type Detail = { rows: number[]; scale: number };

// The longest stretch of calm rows, as [start, end) offsets in px.
function calmRun({ rows, scale }: Detail, limit = 6): [number, number] {
  let best: [number, number] = [0, 0];
  let start = -1;
  rows.forEach((v, i) => {
    if (v < limit && start < 0) start = i;
    if ((v >= limit || i === rows.length - 1) && start >= 0) {
      const end = v < limit ? i + 1 : i;
      if (end - start > best[1] - best[0]) best = [start, end];
      start = -1;
    }
  });
  return [best[0] * scale, best[1] * scale];
}

// Offset (from..to) for a block of the given height where the backdrop is calmest, gently
// pulled towards prefer; and how busy it is there.
function calmest(detail: Detail, height: number, from: number, to: number, prefer: number) {
  const { rows, scale } = detail;
  const win = Math.max(1, Math.round(height / scale));
  const busy = (off: number) => {
    const start = Math.round(off / scale);
    const end = Math.min(rows.length, start + win);
    let sum = 0;
    for (let r = start; r < end; r++) sum += rows[r];
    return sum / Math.max(1, end - start);
  };
  let best = prefer;
  let bestCost = Infinity;
  for (let off = from; off <= to + 0.5; off += scale) {
    const cost = busy(off) + (Math.abs(off - prefer) / Math.max(1, to - from)) * 3;
    if (cost < bestCost) {
      bestCost = cost;
      best = Math.min(off, to);
    }
  }
  return { offset: best, busy: busy(best) };
}

// Soft oval veil behind a block of text, so it reads on any backdrop.
function veil(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, tone: Tone) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(rx / ry, 1);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
  grad.addColorStop(0, `rgba(${tone.veil},${tone.veilAlpha})`);
  grad.addColorStop(0.6, `rgba(${tone.veil},${tone.veilAlpha * 0.7})`);
  grad.addColorStop(1, `rgba(${tone.veil},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(-ry, -ry, ry * 2, ry * 2);
  ctx.restore();
}

// On busy spots of light backdrops: a solid cream card with a fine gold border behind the words, like a card insert.
function insert(ctx: CanvasRenderingContext2D, cx: number, y: number, w: number, h: number, unit: number, tone: Tone) {
  const x = cx - w / 2;
  ctx.save();
  ctx.shadowColor = "rgba(90,45,10,0.22)";
  ctx.shadowBlur = unit * 0.5;
  ctx.shadowOffsetY = unit * 0.08;
  ctx.fillStyle = "#FFF9EE";
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, unit * 0.12);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = `rgba(${tone.line},0.85)`;
  ctx.lineWidth = Math.max(1, unit * 0.018);
  const i = unit * 0.1;
  ctx.beginPath();
  ctx.roundRect(x + i, y + i, w - i * 2, h - i * 2, unit * 0.06);
  ctx.stroke();
  ctx.restore();
}

function vignette(ctx: CanvasRenderingContext2D, W: number, H: number, tone: Tone) {
  const r = Math.hypot(W, H) / 2;
  const grad = ctx.createRadialGradient(W / 2, H / 2, r * 0.45, W / 2, H / 2, r);
  grad.addColorStop(0, `rgba(${tone.edge},0)`);
  grad.addColorStop(1, `rgba(${tone.edge},${tone.edgeAlpha})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// Thin gold double frame; the inner line has scooped corners with a small diamond in each.
function drawFrame(ctx: CanvasRenderingContext2D, W: number, H: number, m: number, g: number, unit: number, tone: Tone) {
  const lw = Math.max(1.5, unit * 0.026);
  const x0 = m + g;
  const y0 = m + g;
  const x1 = W - m - g;
  const y1 = H - m - g;
  const r = unit * 0.36;
  const d = unit * 0.085;
  ctx.save();
  ctx.strokeStyle = `rgba(${tone.line},0.95)`;
  ctx.lineWidth = lw;
  ctx.strokeRect(m, m, W - m * 2, H - m * 2);
  ctx.strokeStyle = `rgba(${tone.line},0.7)`;
  ctx.lineWidth = lw * 0.6;
  ctx.beginPath();
  ctx.moveTo(x0 + r, y0);
  ctx.lineTo(x1 - r, y0);
  ctx.arc(x1, y0, r, Math.PI, Math.PI / 2, true);
  ctx.lineTo(x1, y1 - r);
  ctx.arc(x1, y1, r, -Math.PI / 2, -Math.PI, true);
  ctx.lineTo(x0 + r, y1);
  ctx.arc(x0, y1, r, 0, -Math.PI / 2, true);
  ctx.lineTo(x0, y0 + r);
  ctx.arc(x0, y0, r, Math.PI / 2, 0, true);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = `rgba(${tone.line},0.95)`;
  for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) {
    ctx.beginPath();
    ctx.moveTo(x, y - d);
    ctx.lineTo(x + d, y);
    ctx.lineTo(x, y + d);
    ctx.lineTo(x - d, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// ──•◆•── centred on cx, vertically centred on y.
function drawDivider(ctx: CanvasRenderingContext2D, cx: number, y: number, half: number, unit: number, tone: Tone) {
  const s = unit * 0.1;
  ctx.save();
  ctx.fillStyle = `rgb(${tone.line})`;
  ctx.lineWidth = Math.max(1, unit * 0.022);
  for (const dir of [-1, 1]) {
    const from = cx + dir * s * 2.4;
    const to = cx + dir * half;
    const grad = ctx.createLinearGradient(from, 0, to, 0);
    grad.addColorStop(0, `rgba(${tone.line},0.95)`);
    grad.addColorStop(1, `rgba(${tone.line},0)`);
    ctx.strokeStyle = grad;
    ctx.beginPath();
    ctx.moveTo(from, y);
    ctx.lineTo(to, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + dir * s * 1.6, y, s * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(cx, y - s);
  ctx.lineTo(cx + s * 0.75, y);
  ctx.lineTo(cx, y + s);
  ctx.lineTo(cx - s * 0.75, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// The same clay lamp as the form's icon (a 40×40 drawing), s px wide with its top-left at x,y.
const DIYA = {
  flame: "M20 3.5c3.4 4.6 5 7.8 5 10.4a5 5 0 0 1-10 0c0-2.6 1.6-5.8 5-10.4z",
  core: "M20 9.5c1.5 2.2 2.2 3.6 2.2 4.8a2.2 2.2 0 0 1-4.4 0c0-1.2.7-2.6 2.2-4.8z",
  bowl: "M3 22.5c5.5-1.6 28.5-1.6 34 0-1.2 7.4-7.6 12-17 12s-15.8-4.6-17-12z",
  rim: "M3 22.5c5.5 1.4 28.5 1.4 34 0",
};
// Share of the 40-unit box the lamp actually covers (3.5 to 34.5).
const DIYA_TOP = 3.5 / 40;
const DIYA_TALL = 31 / 40;

function drawDiya(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const k = s / 40;
  const fx = x + 20 * k;
  const fy = y + 14 * k;
  ctx.save();
  const halo = ctx.createRadialGradient(fx, fy, 0, fx, fy, s * 0.8);
  halo.addColorStop(0, "rgba(255,196,96,0.55)");
  halo.addColorStop(0.35, "rgba(255,170,60,0.2)");
  halo.addColorStop(1, "rgba(255,170,60,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(fx - s * 0.8, fy - s * 0.8, s * 1.6, s * 1.6);
  ctx.translate(x, y);
  ctx.scale(k, k);
  const flame = ctx.createLinearGradient(0, 3.5, 0, 19);
  flame.addColorStop(0, "#F08A24");
  flame.addColorStop(0.55, "#FFC94A");
  flame.addColorStop(1, "#FFDC7A");
  ctx.shadowColor = "rgba(255,180,70,0.9)";
  ctx.shadowBlur = s * 0.15;
  ctx.fillStyle = flame;
  ctx.fill(new Path2D(DIYA.flame));
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#FFF4D6";
  ctx.fill(new Path2D(DIYA.core));
  const bowl = ctx.createLinearGradient(0, 21, 0, 34.5);
  bowl.addColorStop(0, "#F7D68C");
  bowl.addColorStop(0.5, "#E9B44C");
  bowl.addColorStop(1, "#A8742A");
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = s * 0.06;
  ctx.shadowOffsetY = s * 0.03;
  ctx.fillStyle = bowl;
  ctx.fill(new Path2D(DIYA.bowl));
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "#B5832A";
  ctx.lineWidth = 1.4;
  ctx.stroke(new Path2D(DIYA.rim));
  ctx.fillStyle = "#6B1020";
  for (const [cx, cy] of [[12, 28], [20, 29.5], [28, 28]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// The original photo as a small framed print standing on the surface (used when the cut-out failed).
function drawFramedPhoto(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, floor: number, w: number, h: number, unit: number, tone: Tone) {
  const border = Math.max(4, unit * 0.1);
  const x = cx - w / 2;
  const y = floor - h - border;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = unit * 0.4;
  ctx.shadowOffsetY = unit * 0.1;
  ctx.fillStyle = "#FBF5EA";
  ctx.beginPath();
  ctx.roundRect(x - border, y - border, w + border * 2, h + border * 2, unit * 0.08);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  drawCover(ctx, img, x, y, w, h);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = `rgba(${tone.line},0.9)`;
  ctx.lineWidth = Math.max(1, unit * 0.02);
  ctx.strokeRect(x - border * 0.5, y - border * 0.5, w + border, h + border);
  ctx.restore();
}

type Biz = { name: Lines | null; tracking: number; contact: { text: string; size: number } | null; rule: number; height: number };

// Business name (bold; short Latin names in spaced capitals) above the contact, under a short
// gold rule. A name too long for one readable line wraps onto two.
function planBiz(ctx: CanvasRenderingContext2D, greeting: Greeting, maxW: number, unit: number, k: number): Biz | null {
  const raw = greeting.businessName?.trim();
  const contactText = greeting.contact?.trim();
  if (!raw && !contactText) return null;
  const caps = !!raw && !DEVANAGARI.test(raw) && raw.length <= 24;
  const tracking = caps ? 0.12 : 0;
  let name: Lines | null = null;
  if (raw) {
    const text = caps ? raw.toUpperCase() : raw;
    const min = unit * 0.26;
    const size = fitLine(ctx, text, 700, maxW, unit * 0.38 * k, min, tracking);
    const width = ctx.measureText(text).width;
    name = width <= maxW ? { lines: [text], size, lineHeight: size * 1.3, widest: width } : clip(block(ctx, text, 700, min, maxW, FONT, 1.3), 2);
  }
  const contact = contactText ? { text: contactText, size: fitLine(ctx, contactText, 500, maxW, unit * 0.31 * k, unit * 0.18) } : null;
  const rule = unit * 0.36 * k;
  return { name, tracking, contact, rule, height: rule + tall(name) + (contact ? contact.size * 1.3 : 0) };
}

function drawBiz(ctx: CanvasRenderingContext2D, b: Biz, cx: number, y: number, maxW: number, unit: number, tone: Tone) {
  ctx.save();
  ctx.strokeStyle = `rgba(${tone.line},0.9)`;
  ctx.lineWidth = Math.max(1, unit * 0.02);
  ctx.beginPath();
  ctx.moveTo(cx - unit * 0.45, y + b.rule * 0.3);
  ctx.lineTo(cx + unit * 0.45, y + b.rule * 0.3);
  ctx.stroke();
  let cursor = y + b.rule;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.shadowColor = tone.lift;
  ctx.shadowBlur = unit * 0.12;
  if (b.name) {
    ctx.fillStyle = tone.text;
    setFont(ctx, 700, b.name.size, b.tracking);
    // Letter spacing also trails the last letter; shift back to stay centred.
    cursor = drawLines(ctx, b.name, cx + (b.name.size * b.tracking) / 2, cursor, maxW);
  }
  if (b.contact) {
    ctx.fillStyle = tone.soft;
    setFont(ctx, 500, b.contact.size);
    ctx.fillText(b.contact.text, cx, cursor, maxW);
  }
  ctx.restore();
}

// lamp: drawn width of the diya (0 = none); diya: height it takes, gap included.
// clipped: the message had to be shortened with "…".
type GreetPlan = { head: Lines; face: string; msg: Lines | null; div: number; biz: Biz | null; bizGap: number; lamp: number; diya: number; height: number; clipped?: boolean };

// Like fit, but lines stay about 44 characters long, which reads better centred; rather than
// shrink below 85% that way, they widen to the full width.
function fitMessage(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxHeight: number, maxSize: number, minSize: number): Lines {
  const narrowMin = Math.max(minSize, maxSize * 0.85);
  for (const [width, low] of [[(size: number) => Math.min(maxWidth, size * 22), narrowMin], [() => maxWidth, minSize]] as const) {
    for (let size = maxSize; size >= low; size -= 1) {
      const b = block(ctx, text, 400, size, width(size), SERIF, 1.45, true);
      if (tall(b) <= maxHeight && b.widest <= maxWidth) return b;
    }
  }
  return block(ctx, text, 400, minSize, maxWidth, SERIF, 1.45, true);
}

// Lamp (if any), greeting, divider, message and (if biz) the business sign-off, fitted into w×h.
// Everything shrinks together; as a last resort the message is shortened with "…".
function planGreeting(ctx: CanvasRenderingContext2D, greeting: Greeting, w: number, h: number, unit: number, headMax: number, diyaSize: number, withBiz: boolean, stretch: number): GreetPlan {
  const headline = greeting.headline.trim();
  // Devanagari has no italic (the browser would slant it artificially) and looks smaller at the same size.
  const hindi = DEVANAGARI.test(headline);
  const face = hindi ? "600" : "italic 400";
  const message = greeting.message?.trim() ?? "";
  let plan: GreetPlan | null = null;
  for (const k of [1, 0.92, 0.84, 0.76, 0.68, 0.6, 0.52]) {
    const biz = withBiz ? planBiz(ctx, greeting, w, unit, k) : null;
    const bizGap = biz ? unit * 0.3 * k : 0;
    const lamp = diyaSize * k;
    const diya = lamp ? lamp * DIYA_TALL + unit * 0.35 * k : 0;
    const div = message ? unit * 0.75 * k : 0;
    const room = h - diya - (biz ? bizGap + biz.height : 0);
    const head = fit(ctx, headline, face, w, Math.max(unit * 0.7, room * 0.5), unit * headMax * stretch * k * (hindi ? 1.15 : 1), unit * 0.5, SERIF, 1.25, true);
    const msgMax = Math.min(unit * 0.48 * stretch * Math.max(k, 0.8), head.size * 0.6);
    const msg = message ? fitMessage(ctx, message, w * 0.94, room - tall(head) - div, msgMax, Math.max(12, unit * 0.26)) : null;
    plan = { head, face, msg, div, biz, bizGap, lamp, diya, height: diya + tall(head) + (msg ? div + tall(msg) : 0) + (biz ? bizGap + biz.height : 0) };
    // Shrink the greeting rather than squeeze the message.
    if (plan.height <= h && (!msg || msg.size >= msgMax * 0.85)) return plan;
  }
  const p = plan!;
  if (!p.msg || p.height <= h) return p;
  const keep = Math.max(1, p.msg.lines.length - Math.ceil((p.height - h) / p.msg.lineHeight));
  const msg = clip(p.msg, keep);
  return { ...p, msg, height: p.height - tall(p.msg) + tall(msg), clipped: true };
}

function drawGreetingText(ctx: CanvasRenderingContext2D, p: GreetPlan, cx: number, y: number, w: number, unit: number, tone: Tone) {
  let cursor = y;
  if (p.lamp) {
    drawDiya(ctx, cx - p.lamp / 2, cursor - p.lamp * DIYA_TOP, p.lamp);
    cursor += p.diya;
  }

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  setFont(ctx, p.face, p.head.size, 0, SERIF);
  p.head.lines.forEach((line, i) => {
    const ly = cursor + i * p.head.lineHeight + (p.head.lineHeight - p.head.size) / 2;
    const grad = ctx.createLinearGradient(0, ly, 0, ly + p.head.size);
    grad.addColorStop(0, tone.head[0]);
    grad.addColorStop(0.55, tone.head[1]);
    grad.addColorStop(1, tone.head[2]);
    ctx.fillStyle = grad;
    ctx.shadowColor = tone.lift;
    ctx.shadowBlur = p.head.size * 0.1;
    ctx.shadowOffsetY = p.head.size * 0.03;
    ctx.fillText(line, cx, ly, w);
    ctx.shadowColor = tone.glow;
    ctx.shadowBlur = p.head.size * 0.35;
    ctx.shadowOffsetY = 0;
    ctx.fillText(line, cx, ly, w);
  });
  cursor += tall(p.head);

  if (p.msg) {
    drawDivider(ctx, cx, cursor + p.div / 2, Math.min(w / 2, unit * 2.2), unit, tone);
    cursor += p.div;
    ctx.fillStyle = tone.text;
    ctx.shadowColor = tone.lift;
    ctx.shadowBlur = p.msg.size * 0.3;
    ctx.shadowOffsetY = 0;
    setFont(ctx, 400, p.msg.size, 0, SERIF);
    p.msg.lines.forEach((line, i) => ctx.fillText(line, cx, cursor + i * p.msg!.lineHeight + (p.msg!.lineHeight - p.msg!.size) / 2, w));
    cursor += tall(p.msg);
  }
  ctx.restore();

  if (p.biz) drawBiz(ctx, p.biz, cx, cursor + p.bizGap, w, unit, tone);
}

// A finished Diwali greeting: festive backdrop, gold frame, greeting and message, the business
// name and contact, and (optionally) the user's own item cut out and standing on the backdrop's
// table. Without a photo the greeting is centred and larger under a lit diya.
export function renderGreeting(
  photo: HTMLImageElement | null,
  greeting: Greeting,
  size: AdSize,
  background: HTMLImageElement,
  cutout: HTMLCanvasElement | null = null,
  placement: Placement = INDUSTRIES.gifting.placement,
  options: { credit?: boolean } = {},
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d")!;
  const { width: W, height: H } = size;
  const unit = Math.min(W, H) / 12;
  const wide = W / H > 1.5;
  const credit = options.credit !== false;

  // Frame lines, then the area clear of the frame and story UI.
  const m = unit * (size.print ? 0.6 : 0.4);
  const g = unit * 0.14;
  const inner = m + g;
  const safeTop = Math.max(size.safeTop ?? 0, inner);
  const safeBottom = H - Math.max(size.safeBottom ?? 0, inner);
  const top = safeTop + unit * 0.6;
  const creditSize = Math.max(10, unit * 0.17);
  const creditBottom = safeBottom - unit * 0.18;
  const bottom = credit ? creditBottom - creditSize - unit * 0.3 : safeBottom - unit * 0.4;
  const padX = inner + unit * 0.65;

  // Story and print are tall, email is short and wide (sized by its height): the words,
  // lamp and item may grow a little to fill them.
  const stretch = wide ? 1.15 : Math.min(1.25, 1 + Math.max(0, H / W - 1) * 0.4);
  const item = cutout ?? photo;
  // Wide with an item: words on the left, item on the right.
  const split = wide && !!item;
  const textL = padX;
  const textR = split ? W * 0.53 : W - padX;
  const textW = textR - textL;
  const textCx = (textL + textR) / 2;
  const itemL = split ? W * 0.55 : padX;
  const itemR = W - padX;
  const itemCx = (itemL + itemR) / 2;

  const surface = drawBackdrop(ctx, background, W, H, item ? bottom : H, bottom);
  const floor = Math.min(surface, bottom);

  // Item size and top edge.
  let itemTop = bottom;
  let itemBox: { w: number; h: number } | null = null;
  if (item) {
    const ref = split ? floor - top : (H - (size.safeTop ?? 0) - (size.safeBottom ?? 0)) * 0.49;
    const maxW = split ? (itemR - itemL) * Math.min(1, placement.maxWidth * 1.3) : W * placement.maxWidth * GREETING_ITEM;
    const maxH = ref * placement.maxHeight * (split ? 0.9 : GREETING_ITEM * stretch);
    const iw = cutout ? cutout.width : photo!.naturalWidth;
    const ih = cutout ? cutout.height : photo!.naturalHeight;
    // A framed photo keeps a print-like shape.
    const ratio = cutout ? iw / ih : Math.min(1.25, Math.max(0.8, iw / ih));
    const h = Math.min(maxH, maxW / ratio);
    itemBox = { w: h * ratio, h };
    itemTop = cutout && placement.mode === "hanging" ? floor - unit * 0.35 - h : floor - h - (cutout ? 0 : unit * 0.2);
  }

  // Words: above the item (business signs off under the message), or centred with the
  // business as a footer.
  const signOff = !!item && !split;
  const diyaSize = item ? 0 : unit * 1.75 * stretch;
  const footer = signOff ? null : planBiz(ctx, greeting, textW, unit, 1);
  // A framed print's border reaches above the photo.
  const itemEdge = item && !cutout ? itemTop - Math.max(4, unit * 0.1) * 2 : itemTop;
  const areaTop = top;
  const areaBottom = signOff ? itemEdge - unit * 0.5 : bottom - (footer ? footer.height + unit * 0.45 : 0);
  const headMax = signOff ? 1.3 : wide ? 1.7 : 1.6;
  const areaH = areaBottom - areaTop;
  const detail = rowDetail(canvas, textL, areaTop, textW, areaH);
  const place = (from: number, to: number, lamp = diyaSize) => {
    const p = planGreeting(ctx, greeting, textW, to - from, unit, headMax, lamp, signOff, stretch);
    const slack = Math.max(0, to - from - p.height);
    return { plan: p, spot: calmest(detail, p.height, from, from + slack, from + slack * 0.45) };
  };
  let { plan, spot } = place(0, areaH);
  // Words go over the calm part of the backdrop (below a garland, under the lanterns) if they
  // barely shrink there. On a busy spot of a light backdrop (which would need a card behind the
  // words) they may shrink to 70%, no further; and if the lamp leaves too little room under the
  // garland, it gives way to them.
  const run = calmRun(detail);
  const runH = run[1] - run[0];
  if (runH >= areaH * 0.25 && runH < areaH * 0.97) {
    const light = brightness(ctx, textL, areaTop, textW, areaH) > 0.55;
    const min = light && spot.busy > 6 ? 0.7 : 0.85;
    const ok = (t: ReturnType<typeof place>) => !t.plan.clipped && t.plan.height <= runH + 1 && t.plan.head.size >= plan.head.size * min;
    const lit = place(run[0], run[1]);
    const plain = !ok(lit) && light && diyaSize ? place(run[0], run[1], 0) : null;
    const calm = ok(lit) ? lit : plain && ok(plain) ? plain : null;
    if (calm) ({ plan, spot } = calm);
  }
  const groupY = areaTop + spot.offset;

  const tone = brightness(ctx, textL, groupY, textW, plan.height) > 0.55 ? LIGHT : DARK;
  vignette(ctx, W, H, tone);
  const groupW = Math.min(textW, Math.max(plan.head.widest, plan.msg?.widest ?? 0, plan.lamp));
  if (tone === LIGHT && spot.busy > 6) {
    // A solid card behind the lamp and words, kept clear of the item or footer below.
    const padY = unit * 0.45;
    const cardTop = groupY - padY;
    const limit = signOff ? itemEdge - unit * 0.25 : footer ? bottom - footer.height - unit * 0.1 : bottom;
    const cardBottom = Math.min(groupY + plan.height + padY, limit);
    insert(ctx, textCx, cardTop, Math.min(W - inner * 2 - unit * 0.6, groupW + unit * 1.4), cardBottom - cardTop, unit, tone);
  } else veil(ctx, textCx, groupY + plan.height / 2, groupW / 2 + unit * 1.3, plan.height / 2 + unit * 1.1, tone);
  if (footer) veil(ctx, textCx, bottom - footer.height / 2, Math.min(textW / 2, unit * 3.5), footer.height / 2 + unit * 0.7, tone);

  if (item && itemBox) {
    const { w, h } = itemBox;
    if (cutout) drawSubject(ctx, cutout, placement.mode, itemCx - w / 2, placement.mode === "hanging" ? itemTop : floor, w, h, tone.shade);
    else drawFramedPhoto(ctx, photo!, itemCx, floor - unit * 0.2, w, h, unit, tone);
  }

  drawFrame(ctx, W, H, m, g, unit, tone);
  drawGreetingText(ctx, plan, textCx, groupY, textW, unit, tone);
  if (footer) drawBiz(ctx, footer, textCx, bottom - footer.height, textW, unit, tone);

  if (credit) {
    ctx.save();
    setFont(ctx, 500, creditSize, 0.02);
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = tone.soft;
    ctx.shadowColor = tone.lift;
    ctx.shadowBlur = creditSize * 0.4;
    ctx.fillText(`Made with ${BRAND}`, W - inner - unit * 0.6, creditBottom);
    ctx.restore();
  }
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create the image."))), "image/png"),
  );
}
