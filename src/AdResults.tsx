import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { INDUSTRIES, SEASON, type IndustryKey } from "../convex/industries";
import { AD_SIZES, GREETING_SIZES, canvasToBlob, loadImage, renderAd, renderGreeting, type AdSize, type Offer } from "./adRenderer";
import { useCutoutState, type CutoutRun, type Trimmed } from "./cutout";
import { loadLook, saveLook } from "./draft";
import SignIn, { hasPendingCode } from "./SignIn";
import { color, prefersReducedMotion, text } from "./theme";
import { CheckDisc, Icon } from "./Icons";

// What NewAd made: the words, and the photo with its cut-out (null for a greeting without a photo).
export type Made = {
  kind: "offer" | "greeting";
  words: Offer;
  photoUrl: string | null;
  cutout: CutoutRun | null;
};
export type SaveState = "idle" | "saving" | "saved" | "error";

// pass: which drawing pass made it, so pictures from an older pass show as "Updating…".
type Rendered = AdSize & { url: string; blob: Blob; pass: number };

const ORIGINAL = "original";

// Where a printed card goes, per vertical.
const PRINT_USE: Record<IndustryKey, string> = {
  gifting: "tuck one into each gift box",
  fashion: "slip one into each order",
  skincare: "slip one into each order",
  automotive: "hand one over with every delivery",
};

// "Red & gold gifting" → "red-and-gold-gifting", for file names.
const slug = (text: string) => text.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Phones (and Safari/Chrome on most computers) can hand a picture straight to WhatsApp, Instagram, email…
function canShareFiles() {
  try {
    return !!navigator.canShare?.({ files: [new File([""], "test.png", { type: "image/png" })] });
  } catch {
    return false;
  }
}

// A phone or tablet that can share: the main button shares instead of downloading.
function isTouchSharer() {
  try {
    return matchMedia("(pointer: coarse)").matches && canShareFiles();
  } catch {
    return false;
  }
}

// The size's shape, at most 48×40, for the size switcher.
function thumbBox(size: AdSize) {
  const scale = Math.min(48 / size.width, 40 / size.height);
  return { width: Math.round(size.width * scale), height: Math.round(size.height * scale) };
}

// Words over the dark progress panel: white for the step, 80% white for the rest.
const onScrim = "#FFFFFF";
const onScrimSoft = "rgba(255,255,255,0.8)";

export default function AdResults({
  industry,
  made,
  signedIn,
  saveState,
  onDelivered,
  onRetrySave,
  onRetryCutout,
  onChangeWords,
  onMakeAnother,
  onPhotoChoice,
}: {
  industry: IndustryKey;
  made: Made;
  signedIn: boolean;
  saveState: SaveState;
  onDelivered: () => void;
  onRetrySave: () => void;
  onRetryCutout: () => void;
  // "photo": the person wants to retake the photo, not change the words.
  onChangeWords?: (to?: "photo") => void;
  onMakeAnother: () => void;
  // Greetings: told whether the photo is left out, so the saved greeting matches what was sent.
  onPhotoChoice?: (leftOut: boolean) => void;
}) {
  const greeting = made.kind === "greeting";
  const words = made.words;
  const backgrounds = useQuery(api.backgrounds.list, greeting ? { industry, kind: "greeting" } : { industry });
  const cutState = useCutoutState(made.cutout);

  const config = INDUSTRIES[industry];
  const noun = config.productNoun;
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);
  const sizes = greeting ? GREETING_SIZES : AD_SIZES;
  // Only the form's own visual (not a reopened saved item) remembers its look across a reload.
  const ownVisual = !!onChangeWords;
  const [kept] = useState(() => {
    const l = ownVisual ? loadLook(industry) : null;
    return l?.kind === made.kind ? l : null;
  });

  const [look, setLook] = useState<string | null>(null);
  // Greetings only: leave the photo out (if the cut-out looks wrong).
  const [skipPhoto, setSkipPhoto] = useState(false);
  const [selected, setSelected] = useState(() => (sizes.some((s) => s.key === kept?.size) ? kept!.size : sizes[0].key));
  // One picture per size. A new pass replaces them one by one; until then the old one stays.
  const [pics, setPics] = useState<Partial<Record<string, Rendered>>>({});
  const [pass, setPass] = useState(0);
  // The cut-out the size on screen was last drawn with.
  const [drawnCut, setDrawnCut] = useState<Trimmed | null>(null);
  const [doneNote, setDoneNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);
  // Guests: Share/Download open the email step here. Open again after a reload during the code step.
  const [gateOpen, setGateOpen] = useState(() => !signedIn && hasPendingCode());
  const [gateUsed, setGateUsed] = useState(gateOpen);
  const [sent, setSent] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [touch] = useState(isTouchSharer);

  const picsRef = useRef(pics);
  const passRef = useRef(0);
  const selectedRef = useRef(selected);
  const images = useRef(new Map<string, Promise<HTMLImageElement>>());
  // The quick version was on screen, so the cut-out arriving is worth a "Done" line.
  const quickShown = useRef(false);
  // The look fell back to the original photo because the cut-out failed (not picked).
  const fellBack = useRef(false);
  const lastBackdrop = useRef<string | null>(null);
  const shownCutout = useRef(made.cutout);
  const gateRef = useRef<HTMLDivElement>(null);
  // The look the person picked (or had picked before a reload); remembered with the size.
  const picked = useRef<string | null>(kept?.look ?? null);

  const backdrops = (backgrounds ?? []).filter((b) => b.url);
  const noBackdrops = greeting && backgrounds !== undefined && backdrops.length === 0;
  const looks = greeting ? backdrops : [...backdrops, { key: ORIGINAL, label: "Original photo", url: made.photoUrl }];
  const lookLabel = looks.find((l) => l.key === look)?.label ?? "";
  const bgUrl = look && look !== ORIGINAL ? (backdrops.find((b) => b.key === look)?.url ?? null) : null;

  const stage = cutState?.stage ?? null;
  const cut = cutState?.stage === "done" ? cutState.cut : null;
  const cutBroken = stage === "bad" || stage === "failed";
  const photoUsed = !!made.photoUrl && !(greeting && skipPhoto);
  const needsCut = !!made.photoUrl && (greeting ? !skipPhoto : look !== ORIGINAL);
  // How the pictures are drawn: with the cut-out, the quick version while it runs, the
  // fallback once it failed, or plain when the look doesn't use it.
  const mode = needsCut && cutState ? (cut ? "cut" : cutBroken ? "fallback" : "quick") : "plain";

  function load(src: string) {
    let image = images.current.get(src);
    if (!image) {
      image = loadImage(src);
      image.catch(() => images.current.delete(src));
      images.current.set(src, image);
    }
    return image;
  }

  // Default look: the one picked before a reload if it still exists, else the first AI backdrop,
  // else (offers) the original photo.
  useEffect(() => {
    if (look !== null || backgrounds === undefined) return;
    const keep = kept?.look;
    if (keep && (keep === ORIGINAL ? !greeting : backgrounds.some((b) => b.key === keep && b.url))) return setLook(keep);
    const first = backgrounds.find((b) => b.url)?.key;
    if (first) setLook(first);
    else if (!greeting) setLook(ORIGINAL);
  }, [backgrounds, look, greeting, kept]);

  useEffect(() => {
    if (look && look !== ORIGINAL) lastBackdrop.current = look;
  }, [look]);

  // Offers without a clean cut-out use the original photo.
  useEffect(() => {
    if (greeting || mode !== "fallback") return;
    fellBack.current = true;
    setLook(ORIGINAL);
  }, [greeting, mode]);

  // Try again gave a new cut-out run: go back to the backdrop the failure took away.
  useEffect(() => {
    if (shownCutout.current === made.cutout) return;
    shownCutout.current = made.cutout;
    if (!fellBack.current || !made.cutout) return;
    fellBack.current = false;
    const back = lastBackdrop.current ?? backdrops[0]?.key;
    if (back) setLook(back);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [made.cutout]);

  useEffect(() => {
    if (look === null || (mode === "fallback" && !greeting)) return;
    if (greeting ? !bgUrl : !made.photoUrl) return;
    let cancelled = false;
    const n = ++passRef.current;
    setPass(n);
    setError(null);
    const withCut = mode === "cut" ? cut : null;
    const photoUrl = photoUsed ? made.photoUrl : null;
    (async () => {
      try {
        // Backdrop and photo load together; neither waits for the cut-out. An offer's quick
        // version doesn't draw the backdrop, so it doesn't wait for it either.
        const backdrop = bgUrl ? load(bgUrl) : null;
        const [background, photo] = await Promise.all([greeting || withCut ? backdrop : null, photoUrl ? load(photoUrl) : null]);
        if (cancelled) return;
        let draw: (size: AdSize) => HTMLCanvasElement;
        if (greeting) {
          const lines = { headline: words.headline, message: words.message, businessName: words.businessName, contact: words.contact, contactKind: words.contactKind };
          // Without the cut-out the photo still appears, as a small framed print.
          draw = (size) => renderGreeting(photo, lines, size, background!, withCut?.canvas ?? null, config.placement);
        } else {
          const scene = withCut && background ? { background, subject: withCut.canvas } : undefined;
          draw = (size) => renderAd(photo!, words, size, scene, config.placement);
        }
        // The size on screen first, then the rest in list order.
        const first = selectedRef.current;
        const order = [...sizes.filter((s) => s.key === first), ...sizes.filter((s) => s.key !== first)];
        for (const size of order) {
          const blob = await canvasToBlob(draw(size));
          if (cancelled) return;
          const old = picsRef.current[size.key];
          picsRef.current = { ...picsRef.current, [size.key]: { ...size, url: URL.createObjectURL(blob), blob, pass: n } };
          setPics(picsRef.current);
          // Once the new picture is on screen.
          if (old) setTimeout(() => URL.revokeObjectURL(old.url), 1000);
          if (size.key !== first) continue;
          if (withCut) {
            setDrawnCut(withCut);
            if (quickShown.current) setDoneNote(`Done: your ${noun} is on ${lookLabel}.`);
            quickShown.current = false;
          } else quickShown.current = mode === "quick";
        }
      } catch {
        if (!cancelled) setError(greeting ? "We couldn't make your greeting. Please try another background or photo." : "We couldn't make the ads from this photo. Please try another photo.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [look, skipPhoto, made.photoUrl, made.kind, words.headline, words.message, words.details, words.validity, words.finePrint, words.businessName, words.contact, words.contactKind, mode, cut, bgUrl, lookLabel, industry]);

  useEffect(() => {
    if (!doneNote) return;
    const t = setTimeout(() => setDoneNote(null), 4000);
    return () => clearTimeout(t);
  }, [doneNote]);

  useEffect(() => {
    onPhotoChoice?.(skipPhoto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipPhoto]);

  // Bring the whole email step into view: focusing the email box alone scrolls only far enough
  // to show the box, which can leave "Send me a code" below the screen.
  useEffect(() => {
    if (signedIn || !gateOpen) return;
    const frame = requestAnimationFrame(() => gateRef.current?.scrollIntoView({ block: "center" }));
    return () => cancelAnimationFrame(frame);
  }, [gateOpen, signedIn]);

  // Seconds counter while cutting out.
  useEffect(() => {
    if (stage !== "cutting") return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [stage]);

  useEffect(
    () => () => {
      Object.values(picsRef.current).forEach((p) => p && URL.revokeObjectURL(p.url));
    },
    [],
  );

  function remember() {
    if (ownVisual) saveLook(industry, { kind: made.kind, look: picked.current, size: selectedRef.current });
  }

  function select(key: string) {
    selectedRef.current = key;
    setSelected(key);
    remember();
  }

  function pick(key: string) {
    fellBack.current = false;
    picked.current = key;
    setLook(key);
    remember();
  }

  // Named after the background people picked ("festive-glow", "original-photo"), not its internal key.
  const lookSlug = slug(lookLabel) || (greeting ? "greeting" : "ad");
  const fileName = (ad: Rendered) =>
    greeting
      ? `makemyvisual-${config.path}-${SEASON.key}-${lookSlug}-${ad.key}-${ad.width}x${ad.height}.png`
      : `makemyvisual-${config.path}-${lookSlug}-${ad.key}-${ad.width}x${ad.height}.png`;

  const size = sizes.find((s) => s.key === selected) ?? sizes[0];
  const shown = pics[size.key];
  const stale = !!shown && shown.pass !== pass && !error;
  const allReady = sizes.every((s) => pics[s.key]?.pass === pass);
  const guest = !signedIn;
  const primaryLabel = touch ? (greeting && (size.key === "whatsapp" || size.key === "status") ? "Share on WhatsApp" : "Share") : "Download this picture";

  function delivered() {
    setSent(true);
    onDelivered();
  }

  function openGate() {
    setGateOpen(true);
    setGateUsed(true);
  }

  function download(ad: Rendered) {
    const a = document.createElement("a");
    a.href = ad.url;
    a.download = fileName(ad);
    a.click();
    delivered();
  }

  // Opens the phone's share menu (WhatsApp, Instagram, email…) with this one picture.
  // Nothing may be awaited before navigator.share: it must run straight from the tap.
  function share(ad: Rendered) {
    setShareNote(null);
    const file = new File([ad.blob], fileName(ad), { type: "image/png" });
    if (!navigator.canShare?.({ files: [file] })) return download(ad);
    navigator.share({ files: [file] }).then(delivered, (e: unknown) => {
      // Closing the share menu without picking an app is fine.
      if ((e as Error)?.name === "AbortError") return;
      download(ad);
      setShareNote("Sharing didn't work here, so we saved the picture instead. Attach it from your photos or downloads.");
    });
  }

  async function zipAll(ads: Rendered[]) {
    setZipping(true);
    try {
      // Loaded on demand: only computers use the zip.
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      ads.forEach((ad) => zip.file(fileName(ad), ad.blob));
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = greeting ? `makemyvisual-${SEASON.key}-greetings.zip` : "makemyvisual-ads.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
      delivered();
    } catch {
      setShareNote("We couldn't make the zip. Download the pictures one at a time instead.");
    } finally {
      setZipping(false);
    }
  }

  function primary() {
    if (!shown) return;
    if (guest) return openGate();
    if (touch) share(shown);
    else download(shown);
  }

  function downloadOne() {
    if (!shown) return;
    if (guest) return openGate();
    download(shown);
  }

  // Phones: all 5 into the share sheet (Save Images keeps them). Otherwise one zip.
  function saveAll() {
    if (!allReady || zipping) return;
    if (guest) return openGate();
    setShareNote(null);
    const ads = sizes.map((s) => pics[s.key]!);
    const files = ads.map((ad) => new File([ad.blob], fileName(ad), { type: "image/png" }));
    if (touch && navigator.canShare?.({ files })) {
      navigator.share({ files }).then(delivered, (e: unknown) => {
        if ((e as Error)?.name === "AbortError") return;
        void zipAll(ads);
        setShareNote("Sharing didn't work here, so we saved a zip of all the pictures instead.");
      });
      return;
    }
    void zipAll(ads);
  }

  // Progress panel over the picture while the cut-out is on its way.
  const showStrip =
    needsCut && !error && (stage === "loading" || stage === "download" || stage === "cutting" || (stage === "done" && drawnCut !== cut));
  // One step, in four parts: "Step 2 of 3", what is happening, the % or seconds, and a detail line.
  let stepN: string | null = null;
  let stepText: string | null = null;
  let stepMeta: string | null = null;
  let stepDetail: string | null = null;
  if (cutState?.stage === "loading") {
    stepN = "Step 1 of 3";
    stepText = "Getting the cut-out tool ready";
    stepDetail = "Your photo as it is is shown for now. It updates by itself.";
  } else if (cutState?.stage === "download") {
    stepN = "Step 1 of 3";
    stepText = "Getting the cut-out tool ready";
    stepMeta = `${Math.min(99, Math.floor(cutState.fraction * 100))}%`;
    stepDetail = "First time only, about 100 MB. Wi-Fi is faster. Keep this screen open.";
  } else if (cutState?.stage === "cutting") {
    stepN = "Step 2 of 3";
    stepText = `Cutting out your ${noun}`;
    stepMeta = `${Math.max(0, Math.floor((now - cutState.startedAt) / 1000))} s`;
    stepDetail = "Usually 10 to 40 seconds. Your photo as it is is shown for now.";
  } else if (cutState?.stage === "done") {
    stepN = "Step 3 of 3";
    stepText = `Putting your ${noun} on ${lookLabel}`;
  }

  // Offers on the original photo: one tap back to the backdrop (keeps this row the same height).
  const backTo = !greeting && look === ORIGINAL && !cutBroken ? (backdrops.find((b) => b.key === lastBackdrop.current) ?? backdrops[0]) : undefined;
  const placeholder =
    backgrounds === undefined
      ? "Getting your backgrounds…"
      : noBackdrops
        ? "The Diwali backgrounds aren't ready yet. Please try again in a few minutes."
        : error
          ? null
          : `Making your ${greeting ? "greeting" : "ads"}…`;

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", columnGap: 16, minHeight: 44 }}>
        {onChangeWords && (
          <button type="button" onClick={() => onChangeWords()} className="mmv-link">
            <Icon name="chevronLeft" size={16} />
            Change the words
          </button>
        )}
        <button type="button" onClick={onMakeAnother} className="mmv-link mmv-link--muted" style={{ marginLeft: "auto" }}>
          Make another
        </button>
      </div>
      <h2 style={{ ...text.title, margin: "8px 0 16px" }}>{greeting ? "Your Diwali greeting" : "Your ads"}</h2>

      <div className="mmv-preview">
        {shown ? (
          <img
            src={shown.url}
            alt={`${shown.label} ${greeting ? "greeting" : "ad"}`}
            // Guests save through the email step, not a long-press.
            draggable={guest ? false : undefined}
            onContextMenu={guest ? (e) => e.preventDefault() : undefined}
            style={{ opacity: stale ? 0.55 : 1, ...(guest ? { WebkitTouchCallout: "none", userSelect: "none" } : {}) }}
          />
        ) : (
          placeholder && <p style={{ margin: 0, padding: 16, fontSize: 15, lineHeight: 1.45, color: color.muted, textAlign: "center" }}>{placeholder}</p>
        )}
        {stale && (
          <span style={{ position: "absolute", top: 12, left: 12, padding: "4px 10px", borderRadius: 999, background: "rgba(250,248,244,0.92)", color: color.ink, fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>
            Updating…
          </span>
        )}
        {showStrip && (
          <div
            role="status"
            aria-live="polite"
            style={{ position: "absolute", left: 12, right: 12, bottom: 12, overflow: "hidden", padding: "12px 12px 10px", borderRadius: 12, background: color.scrim, color: onScrim }}
          >
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 2, overflow: "hidden", background: "rgba(255,255,255,0.18)" }}>
              {cutState?.stage === "download" ? (
                <div
                  style={{ height: "100%", width: `${Math.min(99, Math.floor(cutState.fraction * 100))}%`, background: color.accent, transition: prefersReducedMotion() ? undefined : "width 0.3s" }}
                />
              ) : (
                <div className="mmv-slide" style={{ height: "100%", width: "35%", background: color.accent }} />
              )}
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.25, color: onScrimSoft }}>{stepN}</div>
            <div style={{ display: "flex", alignItems: "baseline", columnGap: 12, marginTop: 2 }}>
              <span style={{ flex: "1 1 auto", minWidth: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>{stepText}</span>
              {stepMeta && (
                <span aria-hidden="true" className="mmv-num" style={{ flex: "none", fontSize: 13, fontWeight: 500, lineHeight: 1.35, color: onScrimSoft }}>
                  {stepMeta}
                </span>
              )}
            </div>
            {stepDetail && <div style={{ marginTop: 2, fontSize: 13, lineHeight: 1.4, color: onScrimSoft }}>{stepDetail}</div>}
          </div>
        )}
      </div>

      {/* Lines kept free, so the print note and "Done" line don't push the buttons down.
          Greetings keep 3 lines, because their print note sits on its own line under the size. */}
      <div style={{ minHeight: greeting ? 62 : 44, margin: "8px 0 0", ...text.small, color: color.muted }}>
        {size.label}
        {size.print && <div>Print at 4×6 inches (photo size) and {PRINT_USE[industry]}.</div>}
        <div role="status">
          {doneNote && (
            <p className="mmv-status mmv-status--done">
              <Icon name="check" size={16} />
              <span>{doneNote}</span>
            </p>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="mmv-error" style={{ margin: "12px 0" }}>
          <Icon name="alert" size={18} />
          <span>{error}</span>
        </p>
      )}
      {photoUsed && cut?.touchesEdge && (
        <div className="mmv-note mmv-note--caution" style={{ margin: "12px 0" }}>
          <Icon name="alert" />
          <p style={{ margin: 0 }}>
            Part of your {noun} looks cut off in the photo. For the best {greeting ? "greeting" : "ads"}, retake it with the whole {noun} in frame.
          </p>
        </div>
      )}
      {photoUsed && stage === "bad" && (
        <div className="mmv-note mmv-note--caution" style={{ margin: "12px 0" }}>
          <Icon name="alert" />
          <div>
            <p style={{ margin: 0 }}>
              {greeting
                ? `We couldn't cleanly cut out the ${noun} from this photo, so it appears as a small framed photo. A photo with the whole ${noun} in view and a plain background works best.`
                : `We couldn't cleanly cut out the ${noun} from this photo, so your ads use the original photo. A photo with the whole ${noun} in view and a plain background works best.`}
            </p>
            {onChangeWords && (
              <button type="button" onClick={() => onChangeWords("photo")} className="mmv-btn2 mmv-btn2--sm">
                See photo tips and retake
              </button>
            )}
          </div>
        </div>
      )}
      {photoUsed && stage === "failed" && (
        <div className="mmv-note mmv-note--caution" style={{ margin: "12px 0" }}>
          <Icon name="alert" />
          <div>
            <p style={{ margin: 0 }}>The cut-out tool didn't finish downloading. Check your internet, then tap Try again.</p>
            <button type="button" onClick={onRetryCutout} className="mmv-btn2 mmv-btn2--sm">
              Try again
            </button>
          </div>
        </div>
      )}
      {!greeting && made.photoUrl && look !== null && (look !== ORIGINAL || backTo) && (
        <button type="button" onClick={() => pick(look !== ORIGINAL ? ORIGINAL : backTo!.key)} className="mmv-link">
          {look !== ORIGINAL ? `${Noun} looks wrong? Use the original photo` : `Put your ${noun} on ${backTo!.label}`}
        </button>
      )}
      {greeting && made.photoUrl && (
        <button type="button" onClick={() => setSkipPhoto((v) => !v)} className="mmv-link">
          {skipPhoto ? "Put my photo back" : "Leave the photo out"}
        </button>
      )}

      <div
        role="radiogroup"
        aria-label="Sizes"
        style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 4, margin: "16px 0", padding: "8px 0", borderTop: `1px solid ${color.line}`, borderBottom: `1px solid ${color.line}` }}
      >
        {sizes.map((s) => {
          const on = s.key === selected;
          const box = thumbBox(s);
          const pic = pics[s.key];
          return (
            <button type="button" role="radio" aria-checked={on} key={s.key} onClick={() => select(s.key)} className="mmv-tile mmv-choice" style={{ minHeight: 64, justifyContent: "center" }}>
              <span style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {pic ? (
                  <img src={pic.url} alt="" draggable={false} className="mmv-media" style={{ ...box, objectFit: "contain", borderRadius: 2, background: "none", pointerEvents: "none", opacity: pic.pass === pass ? 1 : 0.55 }} />
                ) : (
                  <span className="mmv-media" style={{ ...box, boxSizing: "border-box", border: `1px solid ${color.lineStrong}`, borderRadius: 2, background: "none" }} />
                )}
              </span>
              <span>{s.short ?? s.label}</span>
            </button>
          );
        })}
      </div>

      {guest && gateOpen ? (
        <div ref={gateRef} className="mmv-panel">
          <SignIn
            heading={greeting ? "Save and send your greeting" : "Save and send your ads"}
            intro="Enter your email and we'll send a 6-digit code. No password. It's saved to your account so you can send it again later."
            autoFocus
          />
        </div>
      ) : (
        <>
          {signedIn && gateUsed && saveState === "saved" && !sent && (
            <p role="status" className="mmv-status mmv-status--done" style={{ margin: "0 0 12px" }}>
              <Icon name="check" size={16} />
              <span>Saved. Tap {primaryLabel} to send it.</span>
            </p>
          )}
          <button type="button" onClick={primary} disabled={!shown} className="mmv-btn">
            {primaryLabel}
          </button>
          {touch && <p style={{ margin: "8px 0 0", ...text.small, color: color.muted }}>Pick WhatsApp, Instagram or email, or Save Image to keep it in your photos.</p>}
          {touch ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginTop: 12 }}>
              <button type="button" onClick={saveAll} disabled={!allReady || zipping} className="mmv-btn2 mmv-btn2--sm mmv-btn2--block">
                {`Save all ${sizes.length} pictures`}
              </button>
              <button type="button" onClick={downloadOne} disabled={!shown} className="mmv-btn2 mmv-btn2--sm mmv-btn2--block">
                Download
              </button>
            </div>
          ) : (
            <button type="button" onClick={saveAll} disabled={!allReady || zipping} className="mmv-btn2 mmv-btn2--block" style={{ marginTop: 12 }}>
              {`Download all ${sizes.length} (zip)`}
            </button>
          )}
          {zipping && (
            <p role="status" className="mmv-status mmv-status--wait" style={{ margin: "12px 0 0" }}>
              <span className="mmv-spin" />
              Making the zip…
            </p>
          )}
          {shareNote && (
            <div className="mmv-note mmv-note--caution" style={{ margin: "12px 0" }}>
              <Icon name="alert" />
              <p style={{ margin: 0 }}>{shareNote}</p>
            </div>
          )}
          {signedIn && gateUsed && saveState === "saving" && (
            <p role="status" className="mmv-status mmv-status--wait" style={{ margin: "12px 0 0" }}>
              <span className="mmv-spin" />
              Saving to your account…
            </p>
          )}
          {signedIn && saveState === "error" && (
            <div role="alert" className="mmv-note mmv-note--error" style={{ margin: "12px 0" }}>
              <Icon name="alert" />
              <div>
                <p style={{ margin: 0 }}>We couldn't save it to your account. Your picture is still here.</p>
                <button type="button" onClick={onRetrySave} className="mmv-btn2 mmv-btn2--sm">
                  Try again
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <h3 style={{ ...text.heading, margin: "32px 0 12px" }}>Try another background</h3>
      <div className="mmv-bg-grid">
        {looks.map((l) => {
          const disabled = !greeting && l.key !== ORIGINAL && cutBroken;
          const on = look === l.key;
          return (
            <button type="button" key={l.key} onClick={() => pick(l.key)} disabled={disabled} aria-pressed={on} className="mmv-tile mmv-choice">
              {l.url && (
                <img src={l.url} alt="" crossOrigin="anonymous" loading="lazy" decoding="async" className="mmv-media" style={{ width: "100%", height: 56, objectFit: "cover", borderRadius: 10 }} />
              )}
              <span style={{ padding: "0 2px" }}>{l.label}</span>
              {on && <CheckDisc size={16} style={{ position: "absolute", top: 4, right: 4 }} />}
            </button>
          );
        })}
      </div>

      <button type="button" onClick={onMakeAnother} className="mmv-btn2 mmv-btn2--block" style={{ marginTop: 32 }}>
        Make another
      </button>
    </section>
  );
}
