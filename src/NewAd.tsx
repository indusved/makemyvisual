import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../convex/_generated/api";
import { INDUSTRIES, DEFAULT_INDUSTRY } from "../convex/industries";
import type { Id } from "../convex/_generated/dataModel";
import AdResults from "./AdResults";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";
const industry = INDUSTRIES[DEFAULT_INDUSTRY];

const input = { display: "block", width: "100%", padding: 12, fontSize: 16, margin: "6px 0 14px", boxSizing: "border-box" as const };
const hint = { color: "#666", fontSize: 13, marginTop: -10, marginBottom: 14 };

export default function NewAd() {
  const generateUploadUrl = useMutation(api.jobs.generateUploadUrl);
  const createJob = useMutation(api.jobs.create);
  const jobs = useQuery(api.jobs.mine);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeJobId, setActiveJobId] = useState<Id<"jobs"> | null>(null);
  const activeJob = jobs?.find((j) => j._id === activeJobId);

  function pickFile(f: File | undefined) {
    setError(null);
    setSaved(false);
    if (!f) return;
    if (!ACCEPT.split(",").includes(f.type)) return setError("Please choose a JPG, PNG or WebP photo.");
    if (f.size > MAX_BYTES) return setError("That photo is over 10 MB. Please choose a smaller one.");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return setError(`Please choose a photo of your ${industry.productNoun}.`);
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
        photoStorageId: storageId,
        headline: String(data.get("headline") ?? ""),
        details: String(data.get("details") ?? ""),
        validity: String(data.get("validity") ?? ""),
        finePrint: String(data.get("finePrint") ?? ""),
      });
      form.reset();
      setFile(null);
      setPreview(null);
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

        <label htmlFor="photo">Photo of your {industry.productNoun}</label>
        <input id="photo" type="file" accept={ACCEPT} onChange={(e) => pickFile(e.target.files?.[0])} style={input} />
        {preview && <img src={preview} alt="Your photo" style={{ width: "100%", borderRadius: 8, marginBottom: 14 }} />}

        <label htmlFor="headline">Offer headline</label>
        <input id="headline" name="headline" required maxLength={60} placeholder="₹50,000 off the XUV700" style={input} />

        <label htmlFor="details">Price or EMI (optional)</label>
        <input id="details" name="details" maxLength={80} placeholder="EMI from ₹9,999/month" style={input} />

        <label htmlFor="validity">Valid until (optional)</label>
        <input id="validity" name="validity" maxLength={40} placeholder="This weekend only" style={input} />

        <label htmlFor="finePrint">Fine print (optional)</label>
        <textarea id="finePrint" name="finePrint" maxLength={200} rows={2} placeholder="Terms apply. Offer valid on select variants." style={input} />
        <p style={hint}>US lease or finance offers usually need terms shown here.</p>

        <button type="submit" disabled={busy} style={{ padding: "12px 20px", fontSize: 16, cursor: "pointer" }}>
          {busy ? "Saving…" : "Save offer"}
        </button>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        {saved && <p style={{ color: "green" }}>Saved. Your ads are below.</p>}
      </form>

      {activeJob?.photoUrl && (
        <AdResults
          key={activeJob._id}
          job={{ _id: activeJob._id, photoUrl: activeJob.photoUrl, cutoutUrl: activeJob.cutoutUrl }}
          offer={{ headline: activeJob.headline, details: activeJob.details, validity: activeJob.validity, finePrint: activeJob.finePrint }}
          onClose={() => setActiveJobId(null)}
        />
      )}

      {jobs && jobs.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 18 }}>Your saved offers</h2>
          {jobs.map((job) => (
            <div key={job._id} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
              {job.photoUrl && <img src={job.photoUrl} alt="" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 6 }} />}
              <div style={{ flex: 1 }}>
                <b>{job.headline}</b>
                <div style={{ color: "#666", fontSize: 14 }}>{[job.details, job.validity].filter(Boolean).join(" · ")}</div>
              </div>
              <button onClick={() => { setActiveJobId(job._id); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ padding: "8px 12px", cursor: "pointer" }}>
                Make ads
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
