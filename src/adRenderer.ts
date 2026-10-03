// Draws one offer ad per size on a canvas. The car is never altered or
// generated: either the original photo (scaled and cropped) or the dealer's
// own car cut out and placed on a backdrop. All text sits in a separate panel.

export type Offer = {
  headline: string;
  details?: string;
  validity?: string;
  finePrint?: string;
};

// Cut-out car on an AI backdrop. Without a scene, the original photo is used.
export type Scene = { background: HTMLImageElement; car: HTMLCanvasElement };

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

// Places the cut-out car on the backdrop, sitting on the floor with a soft shadow.
// Flattened, blurred copy of the car's own outline, used as a ground shadow so
// it lines up with the wheels. squash = shadow height as a share of car height.
function drawSilhouetteShadow(ctx: CanvasRenderingContext2D, car: HTMLCanvasElement, cx: number, floor: number, cw: number, ch: number, squash: number, blur: number, alpha: number) {
  const sil = document.createElement("canvas");
  sil.width = car.width;
  sil.height = car.height;
  const s = sil.getContext("2d")!;
  s.drawImage(car, 0, 0);
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

// The backdrop fills x,y,w,h; the car stays between carTop and the floor line
// (floorRatio of the height), clear of story UI and the panel fade.
function drawScene(ctx: CanvasRenderingContext2D, scene: Scene, x: number, y: number, w: number, h: number, carTop = y, floorRatio = 0.9) {
  drawCover(ctx, scene.background, x, y, w, h);
  const car = scene.car;
  const floor = y + h * floorRatio;
  const room = floor - carTop;
  const scale = Math.min((w * 0.9) / car.width, (room * 0.86) / car.height);
  const cw = car.width * scale;
  const ch = car.height * scale;
  const cx = x + (w - cw) / 2;

  // Wide, soft ambient shadow, then a tight dark contact shadow under the tyres.
  drawSilhouetteShadow(ctx, car, cx, floor, cw, ch, 0.22, cw * 0.035, 0.45);
  drawSilhouetteShadow(ctx, car, cx, floor, cw, ch, 0.07, cw * 0.008, 0.8);

  // Sink the car slightly into its shadow so the tyres touch the ground.
  ctx.drawImage(car, cx, floor - ch + ch * 0.012, cw, ch);
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

// Largest font size (down to min) at which the text fits the box.
function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, maxWidth: number, maxHeight: number, maxSize: number, minSize: number) {
  for (let size = maxSize; size >= minSize; size -= 1) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    const lines = wrap(ctx, text, maxWidth);
    const lineHeight = size * 1.15;
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (lines.length * lineHeight <= maxHeight && widest <= maxWidth) return { size, lines, lineHeight };
  }
  ctx.font = `${weight} ${minSize}px ${FONT}`;
  return { size: minSize, lines: wrap(ctx, text, maxWidth), lineHeight: minSize * 1.15 };
}

function drawLines(ctx: CanvasRenderingContext2D, lines: string[], x: number, y: number, lineHeight: number) {
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return y + lines.length * lineHeight;
}

// Text panel: headline, details, validity pill, fine print. Returns nothing; fills the box top-down.
function drawPanel(ctx: CanvasRenderingContext2D, offer: Offer, x: number, y: number, w: number, h: number, unit: number) {
  const pad = unit * 0.6;
  const innerW = w - pad * 2;
  let cursor = y + pad;
  const bottom = y + h - pad;
  ctx.textBaseline = "top";

  // Reserve space for fine print first so it is never dropped.
  let fine = null as ReturnType<typeof fit> | null;
  if (offer.finePrint) {
    fine = fit(ctx, offer.finePrint, 400, innerW, h * 0.18, Math.max(9, unit * 0.32), Math.max(7, unit * 0.18));
  }
  const fineHeight = fine ? fine.lines.length * fine.lineHeight + unit * 0.2 : 0;
  const pillHeight = offer.validity ? unit * 0.9 : 0;
  // Size the details line first, so the headline gets all the room that is left.
  const det = offer.details ? fit(ctx, offer.details, 600, innerW, h * 0.2, unit * 0.8, Math.max(10, unit * 0.35)) : null;
  const detailsHeight = det ? det.lines.length * det.lineHeight + unit * 0.2 : 0;
  const headlineMax = bottom - cursor - fineHeight - pillHeight - detailsHeight - unit * 0.3;

  const head = fit(ctx, offer.headline, 800, innerW, headlineMax, unit * 1.6, Math.max(12, unit * 0.5));
  ctx.fillStyle = COLORS.text;
  ctx.font = `800 ${head.size}px ${FONT}`;
  cursor = drawLines(ctx, head.lines, x + pad, cursor, head.lineHeight) + unit * 0.15;

  if (det) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = `600 ${det.size}px ${FONT}`;
    cursor = drawLines(ctx, det.lines, x + pad, cursor, det.lineHeight) + unit * 0.2;
  }

  if (offer.validity) {
    const size = Math.max(10, unit * 0.42);
    ctx.font = `700 ${size}px ${FONT}`;
    const text = offer.validity.toUpperCase();
    const tw = Math.min(ctx.measureText(text).width, innerW - size);
    const ph = size * 1.7;
    ctx.fillStyle = COLORS.accent;
    ctx.beginPath();
    ctx.roundRect(x + pad, cursor, tw + size, ph, ph / 2);
    ctx.fill();
    ctx.fillStyle = COLORS.accentText;
    ctx.fillText(text, x + pad + size / 2, cursor + (ph - size) / 2, innerW - size);
  }

  if (fine) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = `400 ${fine.size}px ${FONT}`;
    drawLines(ctx, fine.lines, x + pad, bottom - fine.lines.length * fine.lineHeight, fine.lineHeight);
  }
}

export function renderAd(img: HTMLImageElement, offer: Offer, size: AdSize, scene?: Scene): HTMLCanvasElement {
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
    if (scene) drawScene(ctx, scene, 0, 0, photoW, H);
    else drawCover(ctx, img, 0, 0, photoW, H);
    const grad = ctx.createLinearGradient(photoW - unit * 1.5, 0, photoW, 0);
    grad.addColorStop(0, "rgba(17,19,23,0)");
    grad.addColorStop(1, COLORS.panel);
    ctx.fillStyle = grad;
    ctx.fillRect(photoW - unit * 1.5, 0, unit * 1.5, H);
    drawPanel(ctx, offer, photoW, 0, W - photoW, H, unit);
  } else {
    // Square / tall: photo top, panel bottom, inside story safe zones.
    const top = size.safeTop ?? 0;
    const usableBottom = H - (size.safeBottom ?? 0);
    const panelH = Math.round((usableBottom - top) * (W === 300 ? 0.5 : 0.42));
    const panelY = usableBottom - panelH;
    if (scene) drawScene(ctx, scene, 0, 0, W, panelY, top, 0.84);
    else drawCover(ctx, img, 0, 0, W, panelY);
    const fade = unit * 1.2;
    const grad = ctx.createLinearGradient(0, panelY - fade, 0, panelY);
    grad.addColorStop(0, "rgba(17,19,23,0)");
    grad.addColorStop(1, COLORS.panel);
    ctx.fillStyle = grad;
    ctx.fillRect(0, panelY - fade, W, fade);
    drawPanel(ctx, offer, 0, panelY, W, panelH, unit);
  }
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create the image."))), "image/png"),
  );
}
