import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useMutation, useQuery } from "convex/react";
import JSZip from "jszip";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { INDUSTRIES, type IndustryKey } from "../convex/industries";
import { AD_SIZES, canvasToBlob, loadImage, renderAd, type Offer, type Scene } from "./adRenderer";
import type { Trimmed } from "./cutout";

type Rendered = { key: string; label: string; width: number; height: number; url: string; blob: Blob };
type Job = { _id: Id<"jobs">; photoUrl: string; cutoutUrl: string | null };

const ORIGINAL = "original";

// "Red & gold gifting" → "red-and-gold-gifting", for file names.
const slug = (text: string) => text.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const note: CSSProperties = { background: "#FFF6D6", border: "1px solid #F5B700", borderRadius: 8, padding: "10px 12px", color: "#4a3700", fontSize: 14, lineHeight: 1.45, margin: "12px 0" };
const linkButton: CSSProperties = { background: "none", border: "none", padding: "0 4px", minHeight: 44, cursor: "pointer", fontSize: 14, textDecoration: "underline", color: "inherit" };

export default function AdResults({ job, offer, industry, onClose }: { job: Job; offer: Offer; industry: IndustryKey; onClose: () => void }) {
  const markDone = useMutation(api.jobs.markDone);
  const logDownload = useMutation(api.jobs.logDownload);
  const generateUploadUrl = useMutation(api.jobs.generateUploadUrl);
  const setCutout = useMutation(api.jobs.setCutout);
  const backgrounds = useQuery(api.backgrounds.list, { industry });

  const config = INDUSTRIES[industry];
  const noun = config.productNoun;
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);

  const [look, setLook] = useState<string | null>(null);
  const [ads, setAds] = useState<Rendered[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cutoutFailed, setCutoutFailed] = useState(false);
  const [cutOffEdge, setCutOffEdge] = useState(false);
  // One cut-out run per offer, shared by every look that needs it.
  const cutoutRef = useRef<Promise<Trimmed | null> | null>(null);
  // Only a run that is still waiting for the cut-out may show its progress.
  const waitingRef = useRef(false);

  const backdrops = (backgrounds ?? []).filter((b) => b.url);

  // Default look: first AI backdrop if any exist, otherwise the original photo.
  useEffect(() => {
    if (look === null && backgrounds !== undefined) setLook(backgrounds.find((b) => b.url)?.key ?? ORIGINAL);
  }, [backgrounds, look]);

  function getCutout(): Promise<Trimmed | null> {
    const say = (text: string) => {
      if (waitingRef.current) setStatus(text);
    };
    cutoutRef.current ??= (async () => {
      // Loaded on demand: the cut-out library is large.
      const { cutOut, trimCutout } = await import("./cutout");
      if (job.cutoutUrl) return trimCutout(await loadImage(job.cutoutUrl));
      say(`Cutting out your ${noun}… the first time on a device can take up to a minute.`);
      const blob = await cutOut(job.photoUrl, (f) => say(`Getting the cut-out tool ready… ${Math.round(f * 100)}%`));
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

  useEffect(() => {
    if (look === null) return;
    let cancelled = false;
    const urls: string[] = [];
    waitingRef.current = look !== ORIGINAL;
    setAds(null);
    setError(null);
    (async () => {
      try {
        const img = await loadImage(job.photoUrl);
        let scene: Scene | undefined;
        if (look !== ORIGINAL) {
          const bg = backgrounds?.find((b) => b.key === look);
          let cut: Trimmed | null = null;
          try {
            cut = await getCutout();
          } catch {
            cut = null;
          }
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
        setStatus("Making your 5 ad sizes…");
        const out: Rendered[] = [];
        for (const size of AD_SIZES) {
          const blob = await canvasToBlob(renderAd(img, offer, size, scene, config.placement));
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
          setError("We couldn't make the ads from this photo. Please try another photo.");
        }
      }
    })();
    return () => {
      cancelled = true;
      waitingRef.current = false;
      urls.forEach(URL.revokeObjectURL);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [look, industry, job._id, job.photoUrl, offer.headline, offer.details, offer.validity, offer.finePrint, offer.businessName, offer.contact]);

  const looks = [{ key: ORIGINAL, label: "My photo", url: job.photoUrl }, ...backdrops];
  // Named after the background people picked ("festive-glow", "my-photo"), not its internal key.
  const lookSlug = slug(looks.find((l) => l.key === look)?.label ?? "") || "ad";
  const fileName = (ad: Rendered) => `makemyvisual-${config.path}-${lookSlug}-${ad.key}-${ad.width}x${ad.height}.png`;

  async function downloadAll() {
    if (!ads) return;
    const zip = new JSZip();
    ads.forEach((ad) => zip.file(fileName(ad), ad.blob));
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "makemyvisual-ads.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    void logDownload({ jobId: job._id });
  }

  return (
    <section style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>Your ads</h2>
        <button type="button" onClick={onClose} style={linkButton}>Close</button>
      </div>

      <p style={{ margin: "12px 0 6px", fontSize: 14, color: "#5b6170" }}>Background</p>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
        {looks.map((l) => {
          const disabled = l.key !== ORIGINAL && cutoutFailed;
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

      {/* Always mounted, so screen readers read out text as it appears. */}
      <div role="status">
        {cutoutFailed && (
          <p style={note}>
            We couldn't cleanly cut out the {noun} from this photo, so your ads use the original photo. A photo with the whole {noun} in view and a plain background works best.
          </p>
        )}
        {cutOffEdge && !cutoutFailed && (
          <p style={note}>
            Part of your {noun} looks cut off in the photo. For the best ads, retake it with the whole {noun} in frame.
          </p>
        )}
        {status && <p>{status}</p>}
      </div>
      {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
      {ads && (
        <>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "12px 0" }}>
            <button
              type="button"
              onClick={() => void downloadAll()}
              style={{ minHeight: 44, padding: "12px 20px", fontSize: 16, fontWeight: 600, cursor: "pointer", background: "#111317", color: "#fff", border: "none", borderRadius: 8 }}
            >
              Download all 5 (zip)
            </button>
            {look !== ORIGINAL && (
              <button type="button" onClick={() => setLook(ORIGINAL)} style={linkButton}>
                {Noun} looks wrong? Use my original photo
              </button>
            )}
          </div>
          {ads.map((ad) => (
            <figure key={ad.key} style={{ margin: "0 0 20px" }}>
              <img src={ad.url} alt={`${ad.label} ad`} style={{ width: "100%", maxWidth: ad.width, border: "1px solid #eee", borderRadius: 6 }} />
              <figcaption style={{ fontSize: 14, color: "#5b6170", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                {ad.label} · {ad.width}×{ad.height} ·
                <a
                  href={ad.url}
                  download={fileName(ad)}
                  onClick={() => void logDownload({ jobId: job._id })}
                  style={{ display: "inline-flex", alignItems: "center", minHeight: 44, padding: "0 4px", color: "#111317", fontWeight: 600 }}
                >
                  Download
                </a>
              </figcaption>
            </figure>
          ))}
        </>
      )}
    </section>
  );
}
