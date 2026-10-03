// In-browser car cutout. The photo never leaves the device; only the model
// files are downloaded (once) from IMG.LY's CDN. AGPL-3.0: see IDEA_SCOPE.md
// decision log — swap to BiRefNet (MIT) before making the code private.
import { removeBackground } from "@imgly/background-removal";

export async function cutOutCar(photoUrl: string, onProgress?: (fraction: number) => void): Promise<Blob> {
  return await removeBackground(photoUrl, {
    output: { format: "image/png" },
    progress: (key, current, total) => {
      if (onProgress && key.startsWith("fetch") && total > 0) onProgress(current / total);
    },
  });
}

// Crops the cutout to its visible pixels and rejects results that are
// clearly wrong (almost nothing kept, or almost everything kept).
export function trimCutout(img: HTMLImageElement): HTMLCanvasElement | null {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const src = document.createElement("canvas");
  src.width = w;
  src.height = h;
  const ctx = src.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, w, h);
  let minX = w, minY = h, maxX = -1, maxY = -1, kept = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 24) {
        kept++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const share = kept / (w * h);
  if (maxX < 0 || share < 0.03 || share > 0.92) return null;
  const out = document.createElement("canvas");
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  out.getContext("2d")!.drawImage(src, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}
