export type PhotoWarning = { id: string; message: string };

const SAMPLE_MAX = 256;
const MIN_SHORT_SIDE = 700;
const TOO_DARK = 70;
const TOO_BRIGHT = 235;
// Heuristic, not a measurement: variance of a 3×3 Laplacian on the ≤256px grey copy.
// Browser tests: sharp photos scored ~65–500, but a smooth, plain, in-focus scene scored 8,
// while heavy blur (about 1% of the photo's width) scored 3–4. Set low so normal photos pass.
const BLUR_VARIANCE = 6;
// Below this spread of grey levels (e.g. a white product on a white sheet) the score above
// says nothing about focus, so the blur check is skipped rather than guessing.
const MIN_CONTRAST = 12;

type Decoded = { source: CanvasImageSource; width: number; height: number; release: () => void };

async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // Some browsers can't decode every file this way; fall back to an <img>.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

// Quick checks on a freshly picked photo. Warnings only: never blocks, never throws.
export async function checkPhoto(file: File, productNoun: string): Promise<PhotoWarning[]> {
  try {
    const { source, width, height, release } = await decode(file);
    try {
      const warnings: PhotoWarning[] = [];
      if (!width || !height) return warnings;
      if (Math.min(width, height) < MIN_SHORT_SIDE) {
        warnings.push({ id: "small", message: "This photo is small, so ads may look blurry. Use your phone camera, not a screenshot or a forwarded image." });
      }

      const scale = Math.min(1, SAMPLE_MAX / Math.max(width, height));
      const w = Math.max(1, Math.round(width * scale));
      const h = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return warnings;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);

      const grey = new Float32Array(w * h);
      let total = 0;
      let totalSq = 0;
      for (let i = 0; i < grey.length; i++) {
        const y = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
        grey[i] = y;
        total += y;
        totalSq += y * y;
      }
      const brightness = total / grey.length;
      const contrast = Math.sqrt(Math.max(0, totalSq / grey.length - brightness * brightness));
      if (brightness < TOO_DARK) {
        warnings.push({ id: "dark", message: `This photo looks dark. Move the ${productNoun} into daylight or a brighter spot, and keep the flash off.` });
      } else if (brightness > TOO_BRIGHT) {
        warnings.push({ id: "bright", message: `This photo looks washed out. Move out of direct sun, or away from bright light behind the ${productNoun}.` });
      }

      // A dark or washed-out photo always scores low here, so only check sharpness when the light is fine.
      if (warnings.every((x) => x.id === "small") && contrast >= MIN_CONTRAST && w >= 3 && h >= 3) {
        let n = 0;
        let sum = 0;
        let sumSq = 0;
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const i = y * w + x;
            const lap = grey[i - w] + grey[i + w] + grey[i - 1] + grey[i + 1] - 4 * grey[i];
            sum += lap;
            sumSq += lap * lap;
            n++;
          }
        }
        const variance = sumSq / n - (sum / n) ** 2;
        if (variance < BLUR_VARIANCE) {
          warnings.push({ id: "blurry", message: `Looks blurry — hold steady and tap to focus on the ${productNoun}.` });
        }
      }
      return warnings;
    } finally {
      release();
    }
  } catch {
    return [];
  }
}
