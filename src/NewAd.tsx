import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../convex/_generated/api";
import { INDUSTRIES, type FieldCopy, type IndustryKey } from "../convex/industries";
import type { Id } from "../convex/_generated/dataModel";
import AdResults from "./AdResults";
import PhotoGuide from "./PhotoGuide";
import { checkPhoto, type PhotoWarning } from "./photoCheck";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";
const INK = "#111317";
const AMBER = "#F5B700";
const MUTED = "#5b6170";

const input = { display: "block", width: "100%", padding: 12, fontSize: 16, margin: "6px 0 14px", boxSizing: "border-box" as const };
const hint = { color: "#666", fontSize: 13, marginTop: -10, marginBottom: 14 };
const pickButton = {
  flex: "1 1 200px", minHeight: 48, padding: "12px 16px", fontSize: 16, fontWeight: 600, borderRadius: 10, border: `2px solid ${INK}`,
  cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
};
const offscreen = { position: "absolute" as const, width: 1, height: 1, opacity: 0, pointerEvents: "none" as const };

type FieldKey = "headline" | "details" | "validity" | "finePrint";
const FIELDS: { key: FieldKey; maxLength: number; required?: boolean; multiline?: boolean }[] = [
  { key: "headline", maxLength: 60, required: true },
  { key: "details", maxLength: 80 },
  { key: "validity", maxLength: 40 },
  { key: "finePrint", maxLength: 200, multiline: true },
];

export default function NewAd({
  industry,
  profile,
  onBusyChange,
}: {
  industry: IndustryKey;
  profile: { businessName: string; contact?: string };
  // Told while an offer is saving: the server files it under whatever vertical the profile has then.
  onBusyChange?: (busy: boolean) => void;
}) {
  const copy = INDUSTRIES[industry];
  const fields: Record<FieldKey, FieldCopy> = copy.fields;
  const generateUploadUrl = useMutation(api.jobs.generateUploadUrl);
  const createJob = useMutation(api.jobs.create);
  const jobs = useQuery(api.jobs.mine, { industry });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<PhotoWarning[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeJobId, setActiveJobId] = useState<Id<"jobs"> | null>(null);
  const activeJob = jobs?.find((j) => j._id === activeJobId);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const checkRun = useRef(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    onBusyChange?.(busy);
    return () => onBusyChange?.(false);
  }, [busy, onBusyChange]);

  function pickFile(f: File | undefined) {
    setPhotoError(null);
    setError(null);
    setSaved(false);
    if (!f) return;
    if (!ACCEPT.split(",").includes(f.type)) return setPhotoError("Please choose a JPG, PNG or WebP photo.");
    if (f.size > MAX_BYTES) return setPhotoError("That photo is over 10 MB. Please choose a smaller one.");
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setWarnings([]);
    const run = ++checkRun.current;
    void checkPhoto(f, copy.productNoun).then((found) => {
      if (run === checkRun.current) setWarnings(found);
    });
  }

  function onPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const f = event.target.files?.[0];
    event.target.value = "";
    pickFile(f);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return setError(`Please add a photo of your ${copy.productNoun} first.`);
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError(null);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!res.ok) throw new Error("upload failed");
      const { storageId } = await res.json();
      const jobId = await createJob({
        industry,
        photoStorageId: storageId,
        headline: String(data.get("headline") ?? ""),
        details: String(data.get("details") ?? ""),
        validity: String(data.get("validity") ?? ""),
        finePrint: String(data.get("finePrint") ?? ""),
      });
      form.reset();
      checkRun.current++;
      setFile(null);
      setPreview(null);
      setWarnings([]);
      setSaved(true);
      setActiveJobId(jobId);
    } catch (e) {
      setError(e instanceof ConvexError ? String(e.data) : "Something went wrong saving your offer. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={submit}>
        <h2 style={{ fontSize: 20 }}>New offer ad</h2>

        <div role="group" aria-labelledby="photo-label" style={{ position: "relative" }}>
          <p id="photo-label" style={{ margin: 0 }}>Photo of your {copy.productNoun}</p>
          <PhotoGuide industry={industry} defaultOpen={jobs !== undefined && jobs.length === 0} />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            <button type="button" onClick={() => cameraRef.current?.click()} style={{ ...pickButton, background: INK, color: "#fff" }}>
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              Take a photo
            </button>
            <button type="button" onClick={() => galleryRef.current?.click()} style={{ ...pickButton, background: "#fff", color: INK }}>
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 16l5-5 4 4 3-3 6 6" />
                <circle cx="16" cy="9" r="1.5" />
              </svg>
              Choose from gallery
            </button>
          </div>
          <input ref={cameraRef} type="file" accept={ACCEPT} capture="environment" onChange={onPicked} tabIndex={-1} aria-hidden="true" style={offscreen} />
          <input ref={galleryRef} type="file" accept={ACCEPT} onChange={onPicked} tabIndex={-1} aria-hidden="true" style={offscreen} />
          {photoError && <p role="alert" style={{ color: "crimson", marginTop: -4 }}>{photoError}</p>}
        </div>

        {preview && <img src={preview} alt="Your photo" style={{ display: "block", width: "100%", maxHeight: 360, objectFit: "contain", background: "#f4f5f7", borderRadius: 8, marginBottom: 14 }} />}
        <div aria-live="polite">
          {warnings.length > 0 && (
            <div style={{ background: "#FFF6D6", border: `1px solid ${AMBER}`, borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 15, lineHeight: 1.4, color: INK }}>
              <b style={{ display: "block", marginBottom: 4 }}>Quick check on this photo</b>
              <ul style={{ margin: "0 0 6px", paddingLeft: 20 }}>
                {warnings.map((w) => <li key={w.id}>{w.message}</li>)}
              </ul>
              <span style={{ color: MUTED }}>You can still continue.</span>
            </div>
          )}
        </div>

        {FIELDS.map(({ key, maxLength, required, multiline }) => {
          const f = fields[key];
          const props = { id: key, name: key, maxLength, placeholder: f.placeholder, style: input, "aria-describedby": f.hint ? `${key}-hint` : undefined };
          return (
            <div key={key}>
              <label htmlFor={key}>{f.label}</label>
              {multiline ? <textarea {...props} rows={2} /> : <input {...props} required={required} />}
              {f.hint && <p id={`${key}-hint`} style={hint}>{f.hint}</p>}
            </div>
          );
        })}

        <button type="submit" disabled={busy} style={{ width: "100%", minHeight: 52, padding: "12px 20px", fontSize: 17, fontWeight: 700, background: AMBER, color: INK, border: "none", borderRadius: 10, cursor: "pointer" }}>
          {busy ? "Saving…" : "Save offer"}
        </button>
        {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
        <div role="status">{saved && <p style={{ color: "green" }}>Saved. Your ads are below.</p>}</div>
      </form>

      <div ref={resultsRef} style={{ scrollMarginTop: 16 }}>
        {activeJob?.photoUrl && (
          <AdResults
            key={activeJob._id}
            job={{ _id: activeJob._id, photoUrl: activeJob.photoUrl, cutoutUrl: activeJob.cutoutUrl }}
            offer={{
              headline: activeJob.headline,
              details: activeJob.details,
              validity: activeJob.validity,
              finePrint: activeJob.finePrint,
              businessName: profile.businessName,
              contact: profile.contact,
            }}
            industry={activeJob.industry}
            onClose={() => setActiveJobId(null)}
          />
        )}
      </div>

      {jobs && jobs.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 18 }}>Your saved offers</h2>
          {jobs.map((job) => (
            <div key={job._id} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
              {job.photoUrl && <img src={job.photoUrl} alt="" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 6 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{job.headline}</b>
                <div style={{ color: "#666", fontSize: 14 }}>{[job.details, job.validity].filter(Boolean).join(" · ")}</div>
              </div>
              <button onClick={() => { setActiveJobId(job._id); resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }} style={{ minHeight: 44, padding: "8px 12px", cursor: "pointer" }}>
                Make ads
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
