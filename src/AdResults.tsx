import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import JSZip from "jszip";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { DEFAULT_INDUSTRY } from "../convex/industries";
import { AD_SIZES, canvasToBlob, loadImage, renderAd, type Offer, type Scene } from "./adRenderer";

type Rendered = { key: string; label: string; width: number; height: number; url: string; blob: Blob };
type Job = { _id: Id<"jobs">; photoUrl: string; cutoutUrl: string | null };

const ORIGINAL = "original";

export default function AdResults({ job, offer, onClose }: { job: Job; offer: Offer; onClose: () => void }) {
  const markDone = useMutation(api.jobs.markDone);
  const logDownload = useMutation(api.jobs.logDownload);
  const generateUploadUrl = useMutation(api.jobs.generateUploadUrl);
  const setCutout = useMutation(api.jobs.setCutout);
  const backgrounds = useQuery(api.backgrounds.list, { industry: DEFAULT_INDUSTRY });

  const [look, setLook] = useState<string | null>(null);
  const [ads, setAds] = useState<Rendered[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cutoutFailed, setCutoutFailed] = useState(false);
  const carRef = useRef<HTMLCanvasElement | null>(null);

  // Default look: first AI backdrop if any exist, otherwise the original photo.
  useEffect(() => {
    if (look === null && backgrounds !== undefined) setLook(backgrounds.length > 0 ? backgrounds[0].key : ORIGINAL);
  }, [backgrounds, look]);

  async function getCar(): Promise<HTMLCanvasElement | null> {
    if (carRef.current) return carRef.current;
    // Loaded on demand: the cut-out library is large.
    const { cutOutCar, trimCutout } = await import("./cutout");
    let cutoutSrc = job.cutoutUrl;
    if (!cutoutSrc) {
      setStatus("Cutting out your car… the first time on a device can take up to a minute.");
      const blob = await cutOutCar(job.photoUrl, (f) => setStatus(`Getting the cut-out tool ready… ${Math.round(f * 100)}%`));
      setStatus("Placing your car…");
      cutoutSrc = URL.createObjectURL(blob);
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
    }
    const trimmed = trimCutout(await loadImage(cutoutSrc));
    carRef.current = trimmed;
    return trimmed;
  }

  useEffect(() => {
    if (look === null) return;
    let cancelled = false;
    const urls: string[] = [];
    setAds(null);
    setError(null);
    (async () => {
      try {
        const img = await loadImage(job.photoUrl);
        let scene: Scene | undefined;
        if (look !== ORIGINAL) {
          const bg = backgrounds?.find((b) => b.key === look);
          let car: HTMLCanvasElement | null = null;
          try {
            car = await getCar();
          } catch {
            car = null;
          }
          if (cancelled) return;
          if (!car || !bg?.url) {
            setCutoutFailed(true);
            setStatus(null);
            setLook(ORIGINAL);
            return;
          }
          scene = { background: await loadImage(bg.url), car };
        }
        setStatus("Making your 5 ad sizes…");
        const out: Rendered[] = [];
        for (const size of AD_SIZES) {
          const blob = await canvasToBlob(renderAd(img, offer, size, scene));
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
      urls.forEach(URL.revokeObjectURL);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [look, job._id, job.photoUrl, offer.headline, offer.details, offer.validity, offer.finePrint]);

  const fileName = (ad: Rendered) => `makemyvisual-${look}-${ad.key}-${ad.width}x${ad.height}.png`;

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

  const looks = [{ key: ORIGINAL, label: "My photo", url: job.photoUrl }, ...(backgrounds ?? [])];

  return (
    <section style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>Your ads</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, textDecoration: "underline" }}>Close</button>
      </div>

      <p style={{ margin: "12px 0 6px", fontSize: 14, color: "#555" }}>Background</p>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
        {looks.map((l) => (
          <button
            key={l.key}
            onClick={() => setLook(l.key)}
            disabled={l.key !== ORIGINAL && cutoutFailed}
            style={{ flex: "0 0 auto", width: 92, padding: 0, border: look === l.key ? "3px solid #F5B700" : "1px solid #ccc", borderRadius: 8, background: "#fff", cursor: "pointer", opacity: l.key !== ORIGINAL && cutoutFailed ? 0.4 : 1 }}
          >
            {l.url && <img src={l.url} alt="" style={{ width: "100%", height: 56, objectFit: "cover", borderRadius: "6px 6px 0 0", display: "block" }} />}
            <span style={{ display: "block", fontSize: 12, padding: "4px 2px" }}>{l.label}</span>
          </button>
        ))}
      </div>

      {cutoutFailed && <p style={{ color: "#8a5a00", fontSize: 14 }}>We couldn't cleanly cut out the car from this photo, so your ads use the original photo. A photo with the whole car in view and a plain background works best.</p>}
      {status && <p>{status}</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {ads && (
        <>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "12px 0" }}>
            <button onClick={() => void downloadAll()} style={{ padding: "12px 20px", fontSize: 16, cursor: "pointer" }}>Download all 5 (zip)</button>
            {look !== ORIGINAL && (
              <button onClick={() => setLook(ORIGINAL)} style={{ background: "none", border: "none", textDecoration: "underline", cursor: "pointer", fontSize: 14 }}>
                Car looks wrong? Use my original photo
              </button>
            )}
          </div>
          {ads.map((ad) => (
            <figure key={ad.key} style={{ margin: "0 0 20px" }}>
              <img src={ad.url} alt={`${ad.label} ad`} style={{ width: "100%", maxWidth: ad.width, border: "1px solid #eee", borderRadius: 6 }} />
              <figcaption style={{ fontSize: 14, color: "#555", marginTop: 4 }}>
                {ad.label} · {ad.width}×{ad.height} ·{" "}
                <a href={ad.url} download={fileName(ad)} onClick={() => void logDownload({ jobId: job._id })}>Download</a>
              </figcaption>
            </figure>
          ))}
        </>
      )}
    </section>
  );
}
