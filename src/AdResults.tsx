import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useMutation, useQuery } from "convex/react";
import JSZip from "jszip";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { INDUSTRIES, SEASON, type IndustryKey } from "../convex/industries";
import { AD_SIZES, GREETING_SIZES, canvasToBlob, loadImage, renderAd, renderGreeting, type AdSize, type Offer, type Scene } from "./adRenderer";
import type { Trimmed } from "./cutout";

type Rendered = AdSize & { url: string; blob: Blob };
type Job = { _id: Id<"jobs">; photoUrl: string | null; cutoutUrl: string | null };
type Kind = "offer" | "greeting";

const ORIGINAL = "original";
const MAROON = "#6B1020";
const GOLD = "#E9B44C";

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

const note: CSSProperties = { background: "#FFF6D6", border: "1px solid #F5B700", borderRadius: 8, padding: "10px 12px", color: "#4a3700", fontSize: 14, lineHeight: 1.45, margin: "12px 0" };
const linkButton: CSSProperties = { background: "none", border: "none", padding: "0 4px", minHeight: 44, cursor: "pointer", fontSize: 14, textDecoration: "underline", color: "inherit" };
const bigButton: CSSProperties = { minHeight: 44, padding: "12px 20px", fontSize: 16, fontWeight: 600, cursor: "pointer", background: "#111317", color: "#fff", border: "none", borderRadius: 8 };
const smallAction: CSSProperties = { display: "inline-flex", alignItems: "center", minHeight: 44, padding: "0 6px", color: "#111317", fontWeight: 600, fontSize: 14, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" };

export default function AdResults({
  job,
  kind = "offer",
  offer,
  industry,
  onClose,
}: {
  job: Job;
  kind?: Kind;
  offer: Offer;
  industry: IndustryKey;
  onClose: () => void;
}) {
  const greeting = kind === "greeting";
  const markDone = useMutation(api.jobs.markDone);
  const logDownload = useMutation(api.jobs.logDownload);
  const generateUploadUrl = useMutation(api.jobs.generateUploadUrl);
  const setCutout = useMutation(api.jobs.setCutout);
  const backgrounds = useQuery(api.backgrounds.list, greeting ? { industry, kind: "greeting" } : { industry });

  const config = INDUSTRIES[industry];
  const noun = config.productNoun;
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);
  const sizes = greeting ? GREETING_SIZES : AD_SIZES;

  const [look, setLook] = useState<string | null>(null);
  const [ads, setAds] = useState<Rendered[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cutoutFailed, setCutoutFailed] = useState(false);
  const [cutOffEdge, setCutOffEdge] = useState(false);
  // Greetings only: leave the photo out (if the cut-out looks wrong).
  const [skipPhoto, setSkipPhoto] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [shareable] = useState(canShareFiles);
  // One cut-out run per offer, shared by every look that needs it.
  const cutoutRef = useRef<Promise<Trimmed | null> | null>(null);
  // Only a run that is still waiting for the cut-out may show its progress.
  const waitingRef = useRef(false);

  const backdrops = (backgrounds ?? []).filter((b) => b.url);
  const noBackdrops = greeting && backgrounds !== undefined && backdrops.length === 0;

  // Default look: first AI backdrop if any exist, otherwise (offers) the original photo.
  useEffect(() => {
    if (look !== null || backgrounds === undefined) return;
    const first = backgrounds.find((b) => b.url)?.key;
    if (first) setLook(first);
    else if (!greeting) setLook(ORIGINAL);
  }, [backgrounds, look, greeting]);

  function getCutout(photoUrl: string): Promise<Trimmed | null> {
    const say = (text: string) => {
      if (waitingRef.current) setStatus(text);
    };
    cutoutRef.current ??= (async () => {
      // Loaded on demand: the cut-out library is large.
      const { cutOut, trimCutout } = await import("./cutout");
      if (job.cutoutUrl) return trimCutout(await loadImage(job.cutoutUrl));
      say(`Cutting out your ${noun}… the first time on a device can take up to a minute.`);
      const blob = await cutOut(photoUrl, (f) => say(`Getting the cut-out tool ready… ${Math.round(f * 100)}%`));
      say(`Placing your ${noun}…`);
      // Save it so this offer never needs cutting out again.
      void (async () => {
        try {
          const uploadUrl = await generateUploadUrl();
          const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": "image/png" }, body: blob });
          if (res.ok) await setCutout({ jobId: job._id, cutoutStorageId: (await res.json()).storageId });
        } catch {
          // Not saving the cutout only costs time on the next visit.
        }
      })();
      const src = URL.createObjectURL(blob);
      try {
        return trimCutout(await loadImage(src));
      } finally {
        URL.revokeObjectURL(src);
      }
    })();
    return cutoutRef.current;
  }

  async function cutoutOrNull(photoUrl: string) {
    try {
      return await getCutout(photoUrl);
    } catch {
      return null;
    }
  }

  useEffect(() => {
    if (look === null) return;
    let cancelled = false;
    const urls: string[] = [];
    const photoUrl = greeting && skipPhoto ? null : job.photoUrl;
    waitingRef.current = greeting ? !!photoUrl : look !== ORIGINAL;
    setAds(null);
    setError(null);
    (async () => {
      try {
        let draw: (size: AdSize) => HTMLCanvasElement;
        if (greeting) {
          const bg = backgrounds?.find((b) => b.key === look);
          if (!bg?.url) throw new Error("Background missing.");
          const [background, photo] = await Promise.all([loadImage(bg.url), photoUrl ? loadImage(photoUrl) : null]);
          const cut = photoUrl ? await cutoutOrNull(photoUrl) : null;
          if (cancelled) return;
          // Without a clean cut-out the photo still appears, as a small framed print.
          if (photoUrl && !cut) setCutoutFailed(true);
          if (cut?.touchesEdge) setCutOffEdge(true);
          const words = { headline: offer.headline, message: offer.message, businessName: offer.businessName, contact: offer.contact };
          draw = (size) => renderGreeting(photo, words, size, background, cut?.canvas ?? null, config.placement);
        } else {
          if (!job.photoUrl) throw new Error("Photo missing.");
          const img = await loadImage(job.photoUrl);
          let scene: Scene | undefined;
          if (look !== ORIGINAL) {
            const bg = backgrounds?.find((b) => b.key === look);
            const cut = await cutoutOrNull(job.photoUrl);
            if (cancelled) return;
            if (cut?.touchesEdge) setCutOffEdge(true);
            if (!cut || !bg?.url) {
              setCutoutFailed(true);
              setStatus(null);
              setLook(ORIGINAL);
              return;
            }
            scene = { background: await loadImage(bg.url), subject: cut.canvas };
          }
          draw = (size) => renderAd(img, offer, size, scene, config.placement);
        }
        setStatus(greeting ? `Making your ${sizes.length} greeting sizes…` : `Making your ${sizes.length} ad sizes…`);
        const out: Rendered[] = [];
        for (const size of sizes) {
          const blob = await canvasToBlob(draw(size));
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          urls.push(url);
          out.push({ ...size, url, blob });
        }
        if (cancelled) return;
        setAds(out);
        setStatus(null);
        void markDone({ jobId: job._id });
      } catch {
        if (!cancelled) {
          setStatus(null);
          setError(greeting ? "We couldn't make your greeting. Please try another background or photo." : "We couldn't make the ads from this photo. Please try another photo.");
        }
      }
    })();
    return () => {
      cancelled = true;
      waitingRef.current = false;
      urls.forEach(URL.revokeObjectURL);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [look, kind, skipPhoto, industry, job._id, job.photoUrl, offer.headline, offer.message, offer.details, offer.validity, offer.finePrint, offer.businessName, offer.contact]);

  const looks = greeting ? backdrops : [{ key: ORIGINAL, label: "My photo", url: job.photoUrl }, ...backdrops];
  // Named after the background people picked ("festive-glow", "my-photo"), not its internal key.
  const lookSlug = slug(looks.find((l) => l.key === look)?.label ?? "") || (greeting ? "greeting" : "ad");
  const fileName = (ad: Rendered) =>
    greeting
      ? `makemyvisual-${config.path}-${SEASON.key}-${lookSlug}-${ad.key}-${ad.width}x${ad.height}.png`
      : `makemyvisual-${config.path}-${lookSlug}-${ad.key}-${ad.width}x${ad.height}.png`;

  function save(ad: Rendered) {
    const a = document.createElement("a");
    a.href = ad.url;
    a.download = fileName(ad);
    a.click();
  }

  // Opens the phone's share menu (WhatsApp, Instagram, email…) with this one picture.
  // Nothing may be awaited before navigator.share: it must run straight from the tap.
  async function share(ad: Rendered) {
    setShareNote(null);
    const file = new File([ad.blob], fileName(ad), { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        void logDownload({ jobId: job._id });
      } catch (e) {
        // Closing the share menu without picking an app is fine.
        if ((e as Error).name === "AbortError") return;
        save(ad);
        void logDownload({ jobId: job._id });
        setShareNote("Sharing didn't work here, so we saved the picture instead. Attach it from your photos or downloads.");
      }
      return;
    }
    save(ad);
    void logDownload({ jobId: job._id });
    setShareNote("This browser can't send pictures straight to apps, so we saved it instead. Open WhatsApp (or WhatsApp Web) and attach it from your downloads.");
  }

  async function downloadAll() {
    if (!ads) return;
    const zip = new JSZip();
    ads.forEach((ad) => zip.file(fileName(ad), ad.blob));
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = greeting ? `makemyvisual-${SEASON.key}-greetings.zip` : "makemyvisual-ads.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    void logDownload({ jobId: job._id });
  }

  const chat = greeting ? ads?.[0] : undefined;

  return (
    <section style={{ marginTop: 24, padding: 16, border: greeting ? `1px solid ${GOLD}` : "1px solid #ddd", borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>{greeting ? "Your Diwali greeting" : "Your ads"}</h2>
        <button type="button" onClick={onClose} style={linkButton}>Close</button>
      </div>
      {greeting && <p style={{ margin: "6px 0 0", fontSize: 14, color: "#5b6170" }}>{SEASON.dateLabel}. Send yours a few days before.</p>}

      {noBackdrops ? (
        <p style={note}>The Diwali backgrounds aren't ready yet. Please try again in a few minutes.</p>
      ) : (
        <>
          <p style={{ margin: "12px 0 6px", fontSize: 14, color: "#5b6170" }}>Background</p>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
            {looks.map((l) => {
              const disabled = !greeting && l.key !== ORIGINAL && cutoutFailed;
              return (
                <button
                  type="button"
                  key={l.key}
                  onClick={() => setLook(l.key)}
                  disabled={disabled}
                  aria-pressed={look === l.key}
                  style={{ flex: "0 0 auto", width: 92, padding: 0, border: look === l.key ? "3px solid #F5B700" : "1px solid #ccc", borderRadius: 8, background: "#fff", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1 }}
                >
                  {l.url && <img src={l.url} alt="" style={{ width: "100%", height: 56, objectFit: "cover", borderRadius: "6px 6px 0 0", display: "block" }} />}
                  <span style={{ display: "block", fontSize: 12, padding: "4px 2px" }}>{l.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Always mounted, so screen readers read out text as it appears. */}
      <div role="status">
        {cutoutFailed && !skipPhoto && (
          <p style={note}>
            {greeting
              ? `We couldn't cleanly cut out the ${noun} from this photo, so it appears as a small framed photo. A photo with the whole ${noun} in view and a plain background works best.`
              : `We couldn't cleanly cut out the ${noun} from this photo, so your ads use the original photo. A photo with the whole ${noun} in view and a plain background works best.`}
          </p>
        )}
        {cutOffEdge && !cutoutFailed && !skipPhoto && (
          <p style={note}>
            Part of your {noun} looks cut off in the photo. For the best {greeting ? "greeting" : "ads"}, retake it with the whole {noun} in frame.
          </p>
        )}
        {status && <p>{status}</p>}
        {shareNote && <p style={note}>{shareNote}</p>}
      </div>
      {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
      {ads && (
        <>
          {chat && (
            <div style={{ margin: "12px 0", padding: 12, borderRadius: 10, background: "#FBF3E4", border: `1px solid ${GOLD}` }}>
              <button
                type="button"
                onClick={() => {
                  if (shareable) void share(chat);
                  else {
                    save(chat);
                    void logDownload({ jobId: job._id });
                  }
                }}
                style={{ ...bigButton, width: "100%", background: MAROON, color: GOLD }}
              >
                {shareable ? "Share on WhatsApp" : "Download for WhatsApp"}
              </button>
              <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.45, color: "#4a3a2a" }}>
                {shareable
                  ? "Opens your share menu with the WhatsApp picture. Pick WhatsApp, Instagram or email."
                  : "Saves the WhatsApp picture to your downloads, ready to attach in WhatsApp Web or email. On a phone? Open this page in Chrome or Safari to send it straight to WhatsApp."}
              </p>
            </div>
          )}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "12px 0" }}>
            <button type="button" onClick={() => void downloadAll()} style={bigButton}>
              Download all {ads.length} (zip)
            </button>
            {!greeting && look !== ORIGINAL && (
              <button type="button" onClick={() => setLook(ORIGINAL)} style={linkButton}>
                {Noun} looks wrong? Use my original photo
              </button>
            )}
            {greeting && job.photoUrl && (
              <button type="button" onClick={() => setSkipPhoto((v) => !v)} style={linkButton}>
                {skipPhoto ? `Put my ${noun} photo back` : `${Noun} looks wrong? Leave the photo out`}
              </button>
            )}
          </div>
          {ads.map((ad) => (
            <figure key={ad.key} style={{ margin: "0 0 20px" }}>
              <img src={ad.url} alt={`${ad.label} ${greeting ? "greeting" : "ad"}`} style={{ width: "100%", maxWidth: ad.width, border: "1px solid #eee", borderRadius: 6 }} />
              <figcaption style={{ fontSize: 14, color: "#5b6170", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                {ad.label} · {ad.width}×{ad.height} ·
                {shareable && (
                  <button type="button" onClick={() => void share(ad)} style={smallAction}>
                    Share
                  </button>
                )}
                <a
                  href={ad.url}
                  download={fileName(ad)}
                  onClick={() => void logDownload({ jobId: job._id })}
                  style={smallAction}
                >
                  Download
                </a>
              </figcaption>
              {ad.print && <p style={{ margin: "2px 0 0", fontSize: 13, color: "#5b6170" }}>Print at 4×6 inches (photo size) and tuck one into each gift box.</p>}
            </figure>
          ))}
        </>
      )}
    </section>
  );
}
