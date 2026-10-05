// Draws one offer ad per size on a canvas. The item (car, outfit, gift or product) is
// never altered or generated: either the original photo (scaled, cropped or fitted) or
// the user's own one cut out and placed on a backdrop. All text sits in a separate panel.
import { INDUSTRIES } from "../convex/industries";

export type Offer = {
  headline: string;
  details?: string;
  validity?: string;
  finePrint?: string;
  businessName?: string;
  contact?: string;
};

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
};

export const AD_SIZES: AdSize[] = [
  { key: "instagram-post", label: "Instagram post", width: 1080, height: 1080 },
  { key: "instagram-portrait", label: "Instagram portrait", width: 1080, height: 1350 },
  { key: "story", label: "Story / WhatsApp status", width: 1080, height: 1920, safeTop: 250, safeBottom: 250 },
  { key: "facebook", label: "Facebook link", width: 1200, height: 628 },
  { key: "google-banner", label: "Google banner", width: 300, height: 250 },
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
    // Hanger hook a tenth of the way down the clear area; the garment's own outline,
    // blurred and nudged down-right, falls on the wall just behind it.
    const hook = subjectTop + room * 0.1;
    const scale = Math.min((w * placement.maxWidth) / subject.width, Math.min(room * placement.maxHeight, floor - hook) / subject.height);
    const cw = subject.width * scale;
    const ch = subject.height * scale;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.26)";
    ctx.shadowBlur = Math.max(2, ch * 0.04);
    ctx.shadowOffsetX = ch * 0.018;
    ctx.shadowOffsetY = ch * 0.03;
    ctx.drawImage(subject, x + (w - cw) / 2, hook, cw, ch);
    ctx.restore();
    return;
  }

  const scale = Math.min((w * placement.maxWidth) / subject.width, (room * placement.maxHeight) / subject.height);
  const cw = subject.width * scale;
  const ch = subject.height * scale;
  const cx = x + (w - cw) / 2;

  // Wide, soft ambient shadow, then a tight dark contact shadow right underneath.
  drawSilhouetteShadow(ctx, subject, cx, floor, cw, ch, 0.22, cw * 0.035, 0.45);
  drawSilhouetteShadow(ctx, subject, cx, floor, cw, ch, 0.07, cw * 0.008, 0.8);

  // Sink it slightly into its shadow so it touches the ground.
  ctx.drawImage(subject, cx, floor - ch + ch * 0.012, cw, ch);
}

function setFont(ctx: CanvasRenderingContext2D, weight: number, size: number, tracking = 0) {
  ctx.font = `${weight} ${size}px ${FONT}`;
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

function block(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, maxWidth: number): Lines {
  setFont(ctx, weight, size);
  const lines = wrap(ctx, text, maxWidth);
  return { lines, size, lineHeight: size * 1.15, widest: Math.max(...lines.map((l) => ctx.measureText(l).width)) };
}

const tall = (b: Lines | null) => (b ? b.lines.length * b.lineHeight : 0);

// Largest font size (down to min) at which the text fits the box.
function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, maxWidth: number, maxHeight: number, maxSize: number, minSize: number): Lines {
  for (let size = maxSize; size >= minSize; size -= 1) {
    const b = block(ctx, text, weight, size, maxWidth);
    if (tall(b) <= maxHeight && b.widest <= maxWidth) return b;
  }
  return block(ctx, text, weight, minSize, maxWidth);
}

// Largest font size (down to min) at which the text fits on one line.
function fitLine(ctx: CanvasRenderingContext2D, text: string, weight: number, maxWidth: number, maxSize: number, minSize: number, tracking = 0) {
  let size = maxSize;
  for (; size > minSize; size -= 1) {
    setFont(ctx, weight, size, tracking);
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

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create the image."))), "image/png"),
  );
}
