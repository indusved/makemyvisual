import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import JSZip from "jszip";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { AD_SIZES, canvasToBlob, loadImage, renderAd, type Offer } from "./adRenderer";

type Rendered = { key: string; label: string; width: number; height: number; url: string; blob: Blob };

export default function AdResults({ jobId, photoUrl, offer, onClose }: { jobId: Id<"jobs">; photoUrl: string; offer: Offer; onClose: () => void }) {
  const markDone = useMutation(api.jobs.markDone);
  const logDownload = useMutation(api.jobs.logDownload);
  const [ads, setAds] = useState<Rendered[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    (async () => {
      try {
        const img = await loadImage(photoUrl);
        const out: Rendered[] = [];
        for (const size of AD_SIZES) {
          const blob = await canvasToBlob(renderAd(img, offer, size));
          const url = URL.createObjectURL(blob);
          urls.push(url);
          out.push({ ...size, url, blob });
        }
        if (cancelled) return;
        setAds(out);
        void markDone({ jobId });
      } catch {
        if (!cancelled) setError("We couldn't make the ads from this photo. Please try another photo.");
      }
    })();
    return () => {
      cancelled = true;
      urls.forEach(URL.revokeObjectURL);
    };
  }, [jobId, photoUrl, offer.headline, offer.details, offer.validity, offer.finePrint]);

  const fileName = (ad: Rendered) => `makemyvisual-${ad.key}-${ad.width}x${ad.height}.png`;

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
    void logDownload({ jobId });
  }

  return (
    <section style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>Your ads</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, textDecoration: "underline" }}>Close</button>
      </div>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!ads && !error && <p>Making your 5 ad sizes…</p>}
      {ads && (
        <>
          <button onClick={() => void downloadAll()} style={{ padding: "12px 20px", fontSize: 16, cursor: "pointer", margin: "12px 0" }}>
            Download all 5 (zip)
          </button>
          {ads.map((ad) => (
            <figure key={ad.key} style={{ margin: "0 0 20px" }}>
              <img src={ad.url} alt={`${ad.label} ad`} style={{ width: "100%", maxWidth: ad.width, border: "1px solid #eee", borderRadius: 6 }} />
              <figcaption style={{ fontSize: 14, color: "#555", marginTop: 4 }}>
                {ad.label} · {ad.width}×{ad.height} ·{" "}
                <a href={ad.url} download={fileName(ad)} onClick={() => void logDownload({ jobId })}>Download</a>
              </figcaption>
            </figure>
          ))}
        </>
      )}
    </section>
  );
}
