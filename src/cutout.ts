// In-browser cut-out of the car, outfit, gift or product. The photo never leaves
// the device; only the model files are downloaded (once) from IMG.LY's CDN.
// AGPL-3.0: see IDEA_SCOPE.md decision log — swap to BiRefNet (MIT) before making
// the code private.
import { useSyncExternalStore } from "react";
import { loadImage } from "./adRenderer";

export type Trimmed = { canvas: HTMLCanvasElement; touchesEdge: boolean };

export type CutoutState =
  | { stage: "loading" }
  | { stage: "download"; fraction: number } // all model files together, 0–0.99, never goes down
  | { stage: "cutting"; startedAt: number } // Date.now() when the cut-out itself began
  | { stage: "done"; cut: Trimmed; blob: Blob | null } // blob: untrimmed PNG to save; null when it came from a saved cut-out
  | { stage: "bad" } // trimCutout rejected it: the photo is the problem
  | { stage: "failed" }; // download or library error: trying again may work

// One cut-out of one photo. done never rejects.
export type CutoutRun = { getState(): CutoutState; subscribe(listener: () => void): () => void; done: Promise<Trimmed | null> };

// dropped: someone watched the run and nobody does any more (its photo was replaced or removed).
type Handle = { run: CutoutRun; set: (next: CutoutState) => void; dropped: () => boolean };

function makeRun(initial: CutoutState): Handle {
  let state = initial;
  let watched = false;
  const listeners = new Set<() => void>();
  const run: CutoutRun = {
    getState: () => state,
    subscribe: (listener) => {
      watched = true;
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    done: Promise.resolve(null),
  };
  const set = (next: CutoutState) => {
    state = next;
    listeners.forEach((l) => l());
  };
  return { run, set, dropped: () => watched && listeners.size === 0 };
}

// The library is large (and pulls in ~100 MB of model files), so it loads on demand and
// pages that import this file stay small. A failed load is forgotten so Try again can retry.
let libPromise: Promise<typeof import("@imgly/background-removal")> | null = null;
const lib = () =>
  (libPromise ??= import("@imgly/background-removal").catch((e) => {
    libPromise = null;
    throw e;
  }));

// IMG.LY sets itself up once per JSON.stringify(config): it keeps the first call's progress
// function, and it also keeps a failed setup. So preload and every cut-out use the same config
// with one stable progress function, and each failure bumps `attempt` so the next try gets a
// fresh setup (fetch ignores the extra field).
let attempt = 0;
const config = () => ({ output: { format: "image/png" as const }, progress: dispatch, fetchArgs: { mmvAttempt: attempt } });

// Download progress across all model files; null when nothing is downloading.
const files = new Map<string, { current: number; total: number }>();
let downloaded: number | null = null;
// Runs that have not started cutting yet see the download; only the active one cuts.
const waiting = new Set<Handle>();
let active: Handle | null = null;

function dispatch(key: string, current: number, total: number) {
  if (key.startsWith("fetch:")) {
    files.set(key, { current, total });
    let sum = 0;
    let size = 0;
    for (const f of files.values()) {
      sum += f.current;
      size += f.total;
    }
    // The default model set is about 100 MB; files not started yet count towards that.
    const fraction = Math.min(0.99, Math.max(downloaded ?? 0, sum / Math.max(size, 100_000_000)));
    downloaded = fraction;
    for (const h of waiting) {
      const s = h.run.getState();
      if (s.stage === "loading" || (s.stage === "download" && fraction > s.fraction)) h.set({ stage: "download", fraction });
    }
  } else if (key.startsWith("compute:")) {
    downloadEnded();
    if (active && waiting.delete(active)) active.set({ stage: "cutting", startedAt: Date.now() });
  }
}

// Runs still queued behind another one go back to "getting ready" once the files are in.
function downloadEnded() {
  downloaded = null;
  files.clear();
  for (const h of waiting) if (h !== active && h.run.getState().stage === "download") h.set({ stage: "loading" });
}

// One cut-out at a time: each run waits for the one before it.
let queue: Promise<unknown> = Promise.resolve();

// Nobody sees a skipped run; "failed" only keeps done's null meaningful.
function skip(handle: Handle): null {
  handle.set({ stage: "failed" });
  return null;
}

// Never throws; the result arrives through the run's state and done.
export function startCutout(photo: Blob | string): CutoutRun {
  const handle = makeRun(downloaded === null ? { stage: "loading" } : { stage: "download", fraction: downloaded });
  const { run, set } = handle;
  waiting.add(handle);
  run.done = queue.then(async () => {
    let src: string | null = null;
    try {
      // A photo that was replaced or removed is skipped, so the next one doesn't wait behind it.
      // Checked before the download and again before the cut-out (a cut-out can't be stopped once begun).
      if (handle.dropped()) return skip(handle);
      active = handle;
      const m = await lib();
      await m.preload(config());
      if (handle.dropped()) return skip(handle);
      const blob = await m.removeBackground(photo, config());
      src = URL.createObjectURL(blob);
      const cut = trimCutout(await loadImage(src));
      set(cut ? { stage: "done", cut, blob } : { stage: "bad" });
      return cut;
    } catch {
      attempt += 1;
      // The next try downloads afresh, so its percentage starts again from 0.
      downloadEnded();
      set({ stage: "failed" });
      return null;
    } finally {
      if (src) URL.revokeObjectURL(src);
      waiting.delete(handle);
      if (active === handle) active = null;
    }
  });
  queue = run.done;
  return run;
}

// A cut-out saved earlier: no library and no download, just the trim.
export function cutoutFromUrl(cutoutUrl: string): CutoutRun {
  const { run, set } = makeRun({ stage: "loading" });
  run.done = (async () => {
    try {
      const cut = trimCutout(await loadImage(cutoutUrl));
      set(cut ? { stage: "done", cut, blob: null } : { stage: "bad" });
      return cut;
    } catch {
      set({ stage: "failed" });
      return null;
    }
  })();
  return run;
}

// Starts the download early (when a photo button is tapped). Once per page, unless it failed.
let preloaded = -1;
export function preloadCutout(): void {
  if (preloaded === attempt) return;
  preloaded = attempt;
  lib()
    .then((m) => m.preload(config()))
    .then(downloadEnded, () => {
      attempt += 1;
      downloadEnded();
    });
}

const noSubscribe = () => () => {};
const noState = () => null;

export function useCutoutState(run: CutoutRun | null): CutoutState | null {
  return useSyncExternalStore(run ? run.subscribe : noSubscribe, run ? run.getState : noState);
}


// Crops the cutout to its visible pixels and rejects results that are
// clearly wrong (almost nothing kept, or almost everything kept).
// touchesEdge: solid pixels run along a border of the photo, which usually
// means part of the item was outside the frame when it was taken.
export function trimCutout(img: HTMLImageElement): Trimmed | null {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const src = document.createElement("canvas");
  src.width = w;
  src.height = h;
  const ctx = src.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, w, h);
  const EDGE = 2;
  const left = new Uint8Array(h), right = new Uint8Array(h), top = new Uint8Array(w), bottom = new Uint8Array(w);
  let minX = w, minY = h, maxX = -1, maxY = -1, kept = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > 24) {
        kept++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (alpha > 160) {
          if (x <= EDGE) left[y] = 1;
          if (x >= w - 1 - EDGE) right[y] = 1;
          if (y <= EDGE) top[x] = 1;
          if (y >= h - 1 - EDGE) bottom[x] = 1;
        }
      }
    }
  }
  const share = kept / (w * h);
  if (maxX < 0 || share < 0.03 || share > 0.92) return null;
  const out = document.createElement("canvas");
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  out.getContext("2d")!.drawImage(src, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  // Share of a border the subject runs along; a few stray pixels don't count.
  const along = (edge: Uint8Array) => edge.reduce((n, v) => n + v, 0) / edge.length;
  const touchesEdge = [left, right, top, bottom].some((edge) => along(edge) > 0.02);
  return { canvas: out, touchesEdge };
}
