import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../convex/_generated/api";
import { INDUSTRIES, SEASON, type FieldCopy, type IndustryKey } from "../convex/industries";
import type { Id } from "../convex/_generated/dataModel";
import AdResults from "./AdResults";
import PhotoGuide from "./PhotoGuide";
import { checkPhoto, type PhotoWarning } from "./photoCheck";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";
const INK = "#111317";
const AMBER = "#F5B700";
const MUTED = "#5b6170";
const MAROON = "#6B1020";
const GOLD = "#E9B44C";
const OWN = "own";
const HEADLINE_MAX = 60;

type Kind = "offer" | "greeting";

const input = { display: "block", width: "100%", padding: 12, fontSize: 16, margin: "6px 0 14px", boxSizing: "border-box" as const };
const hint = { color: "#666", fontSize: 13, marginTop: -10, marginBottom: 14 };
const pickButton = {
  flex: "1 1 200px", minHeight: 48, padding: "12px 16px", fontSize: 16, fontWeight: 600, borderRadius: 10, border: `2px solid ${INK}`,
  cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
};
const offscreen = { position: "absolute" as const, width: 1, height: 1, opacity: 0, pointerEvents: "none" as const };
const groupLabel: CSSProperties = { display: "block", fontWeight: 600, margin: "0 0 8px" };
const linkButton: CSSProperties = { background: "none", border: "none", padding: 0, minHeight: 44, font: "inherit", fontSize: 15, color: INK, textDecoration: "underline", cursor: "pointer" };
// Focus ring for chips whose real radio button is hidden.
const CHIP_CSS = ".mmv-chip input:focus-visible+span{outline:3px solid #111317;outline-offset:2px}";

// Devanagari text gets lang="hi" so screen readers read it in Hindi.
const langOf = (text: string) => (/[ऀ-ॿ]/.test(text) ? "hi" : undefined);

type FieldKey = "headline" | "details" | "validity" | "finePrint";
const FIELDS: { key: FieldKey; maxLength: number; required?: boolean; multiline?: boolean }[] = [
  { key: "headline", maxLength: HEADLINE_MAX, required: true },
  { key: "details", maxLength: 80 },
  { key: "validity", maxLength: 40 },
  { key: "finePrint", maxLength: 200, multiline: true },
];

// A clay lamp in a 40×40 box.
function DiyaShape() {
  return (
    <g>
      <circle cx="20" cy="14" r="11" fill={GOLD} opacity="0.22" />
      <path d="M20 3.5c3.4 4.6 5 7.8 5 10.4a5 5 0 0 1-10 0c0-2.6 1.6-5.8 5-10.4z" fill="#FFC94A" />
      <path d="M20 9.5c1.5 2.2 2.2 3.6 2.2 4.8a2.2 2.2 0 0 1-4.4 0c0-1.2.7-2.6 2.2-4.8z" fill="#FFF4D6" />
      <path d="M3 22.5c5.5-1.6 28.5-1.6 34 0-1.2 7.4-7.6 12-17 12s-15.8-4.6-17-12z" fill={GOLD} />
      <path d="M3 22.5c5.5 1.4 28.5 1.4 34 0" fill="none" stroke="#B5832A" strokeWidth="1.4" />
      <circle cx="12" cy="28" r="1.4" fill={MAROON} />
      <circle cx="20" cy="29.5" r="1.4" fill={MAROON} />
      <circle cx="28" cy="28" r="1.4" fill={MAROON} />
    </g>
  );
}

function GreetingArt() {
  // The garland runs past the drawing's edges so it reaches the sides of wider cards.
  const flowers = Array.from({ length: 21 }, (_, i) => {
    const x = -64 + i * 14.4;
    const y = 8 + 10 * Math.sin((Math.PI * i) / 20);
    return <circle key={i} cx={x} cy={y} r="4.2" fill={i % 2 ? GOLD : "#F08A24"} />;
  });
  return (
    <svg aria-hidden="true" viewBox="0 0 160 72" style={{ display: "block", width: "100%", height: 72, background: `linear-gradient(135deg, ${MAROON}, #3A0710)` }}>
      <path d="M-64 8 Q80 28 224 8" fill="none" stroke="#7A4A12" strokeWidth="1" />
      {flowers}
      <g transform="translate(26 38) scale(0.75)"><DiyaShape /></g>
      <g transform="translate(62 28)"><DiyaShape /></g>
      <g transform="translate(106 38) scale(0.75)"><DiyaShape /></g>
    </svg>
  );
}

function OfferArt() {
  return (
    <svg aria-hidden="true" viewBox="0 0 160 72" style={{ display: "block", width: "100%", height: 72, background: INK }}>
      <rect x="22" y="14" width="30" height="44" rx="4" fill="none" stroke="#3b3f47" strokeWidth="2" />
      <rect x="110" y="20" width="32" height="32" rx="4" fill="none" stroke="#3b3f47" strokeWidth="2" />
      <g transform="rotate(-14 80 36)">
        <path d="M58 22h30l14 14-14 14H58z" fill={AMBER} />
        <circle cx="91" cy="36" r="3" fill={INK} />
        <text x="73" y="42" textAnchor="middle" fontSize="17" fontWeight="800" fill={INK} fontFamily="system-ui, sans-serif">%</text>
      </g>
      <path d="M118 10v6M115 13h6M40 62v5M37.5 64.5h5" stroke={AMBER} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// Thumbnail for a saved greeting that has no photo.
function GreetingTile() {
  return (
    <span aria-hidden="true" style={{ width: 80, height: 60, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${MAROON}, #3A0710)` }}>
      <svg width="40" height="40" viewBox="0 0 40 40"><DiyaShape /></svg>
    </span>
  );
}

function kindCard(selected: boolean): CSSProperties {
  return {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    borderRadius: 12,
    overflow: "hidden",
    background: "#fff",
    color: INK,
    cursor: "pointer",
    border: `2px solid ${selected ? AMBER : "#d5d8de"}`,
    boxShadow: selected ? `0 0 0 1px ${AMBER}` : "none",
  };
}

function chip(selected: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 44,
    boxSizing: "border-box",
    padding: "10px 14px",
    borderRadius: 999,
    fontSize: 15,
    lineHeight: 1.25,
    cursor: "pointer",
    border: `1.5px solid ${selected ? MAROON : "#c9ccd2"}`,
    background: selected ? MAROON : "#fff",
    color: selected ? "#fff" : INK,
    fontWeight: selected ? 600 : 400,
  };
}

function suggestion(selected: boolean): CSSProperties {
  return {
    display: "block",
    width: "100%",
    minHeight: 44,
    boxSizing: "border-box",
    margin: "0 0 8px",
    padding: selected ? "9px 11px" : "10px 12px",
    borderRadius: 10,
    border: selected ? `2px solid ${MAROON}` : "1px solid #d5d8de",
    background: selected ? "#FBF1EE" : "#fff",
    color: INK,
    font: "inherit",
    fontSize: 15,
    lineHeight: 1.4,
    textAlign: "left",
    cursor: "pointer",
  };
}

function kindTag(kind: Kind): CSSProperties {
  return {
    display: "inline-block",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.3,
    padding: "2px 8px",
    borderRadius: 999,
    marginBottom: 3,
    background: kind === "greeting" ? MAROON : INK,
    color: kind === "greeting" ? GOLD : AMBER,
  };
}

export default function NewAd({
  industry,
  profile,
  initialKind,
  onKindChange,
  onBusyChange,
}: {
  industry: IndustryKey;
  profile: { businessName: string; contact?: string };
  initialKind?: Kind;
  // Told when the greeting/offer choice changes, so it survives a category switch or reload.
  onKindChange?: (kind: Kind) => void;
  // Told while an offer or greeting is saving: the server files it under whatever vertical the profile has then.
  onBusyChange?: (busy: boolean) => void;
}) {
  const copy = INDUSTRIES[industry];
  const fields: Record<FieldKey, FieldCopy> = copy.fields;
  const noun = copy.productNoun;
  const generateUploadUrl = useMutation(api.jobs.generateUploadUrl);
  const createJob = useMutation(api.jobs.create);
  const jobs = useQuery(api.jobs.mine, { industry });

  const [kind, setKind] = useState<Kind>(initialKind ?? "offer");
  const [line, setLine] = useState<string>(SEASON.greetingOptions[0]);
  const [ownLine, setOwnLine] = useState("");
  const [message, setMessage] = useState<string>(copy.greeting.message);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<PhotoWarning[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<Kind | null>(null);
  const [activeJobId, setActiveJobId] = useState<Id<"jobs"> | null>(null);
  const activeJob = jobs?.find((j) => j._id === activeJobId);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const checkRun = useRef(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const greeting = kind === "greeting";

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    onBusyChange?.(busy);
    return () => onBusyChange?.(false);
  }, [busy, onBusyChange]);

  function chooseKind(next: Kind) {
    setKind(next);
    setError(null);
    setSaved(null);
    onKindChange?.(next);
  }

  function clearPhoto() {
    checkRun.current++;
    setFile(null);
    setPreview(null);
    setWarnings([]);
    setPhotoError(null);
  }

  function pickFile(f: File | undefined) {
    setPhotoError(null);
    setError(null);
    setSaved(null);
    if (!f) return;
    if (!ACCEPT.split(",").includes(f.type)) return setPhotoError("Please choose a JPG, PNG or WebP photo.");
    if (f.size > MAX_BYTES) return setPhotoError("That photo is over 10 MB. Please choose a smaller one.");
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setWarnings([]);
    const run = ++checkRun.current;
    void checkPhoto(f, noun).then((found) => {
      if (run === checkRun.current) setWarnings(found);
    });
  }

  function onPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const f = event.target.files?.[0];
    event.target.value = "";
    pickFile(f);
  }

  async function upload(f: File): Promise<Id<"_storage">> {
    const uploadUrl = await generateUploadUrl();
    const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": f.type }, body: f });
    if (!res.ok) throw new Error("upload failed");
    return (await res.json()).storageId;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (greeting) return void submitGreeting();
    if (!file) return setError(`Please add a photo of your ${noun} first.`);
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError(null);
    try {
      const storageId = await upload(file);
      const jobId = await createJob({
        industry,
        kind: "offer",
        photoStorageId: storageId,
        headline: String(data.get("headline") ?? ""),
        details: String(data.get("details") ?? ""),
        validity: String(data.get("validity") ?? ""),
        finePrint: String(data.get("finePrint") ?? ""),
      });
      form.reset();
      clearPhoto();
      setSaved("offer");
      setActiveJobId(jobId);
    } catch (e) {
      setError(e instanceof ConvexError ? String(e.data) : "Something went wrong saving your offer. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitGreeting() {
    const headline = (line === OWN ? ownLine : line).trim();
    if (!headline) return setError("Please type your greeting, or pick one above.");
    setBusy(true);
    setError(null);
    try {
      const photoStorageId = file ? await upload(file) : undefined;
      const jobId = await createJob({ industry, kind: "greeting", headline, message: message.trim(), photoStorageId });
      clearPhoto();
      setSaved("greeting");
      setActiveJobId(jobId);
    } catch (e) {
      setError(e instanceof ConvexError ? String(e.data) : "Something went wrong saving your greeting. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const kinds: { key: Kind; title: string; meta: string; line: string; art: React.ReactNode; metaColor: string }[] = [
    { key: "greeting", title: SEASON.label, meta: SEASON.dateLabel, line: "Send to customers on WhatsApp, email or print", art: <GreetingArt />, metaColor: MAROON },
    { key: "offer", title: "Offer ad", meta: "For social posts and ads", line: `Show a price or deal on your ${noun}s`, art: <OfferArt />, metaColor: MUTED },
  ];
  const hasOffers = jobs?.some((j) => j.kind === "offer") ?? true;
  const near = message.length >= SEASON.messageMax - 10;

  const photoSection = (
    <>
      <div role="group" aria-labelledby="photo-label" aria-describedby={greeting ? "photo-optional" : undefined} style={{ position: "relative" }}>
        {greeting ? (
          <>
            <p id="photo-label" style={{ margin: 0, fontWeight: 600 }}>Add a photo of your {noun} — optional</p>
            <p id="photo-optional" style={{ margin: "4px 0 0", color: MUTED, fontSize: 14, lineHeight: 1.4 }}>
              Your real {noun} sits on the festive background. Skip it for a greeting with just your words.
            </p>
          </>
        ) : (
          <p id="photo-label" style={{ margin: 0 }}>Photo of your {noun}</p>
        )}
        <PhotoGuide key={kind} industry={industry} defaultOpen={!greeting && jobs !== undefined && !hasOffers} />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <button type="button" onClick={() => cameraRef.current?.click()} disabled={busy} style={{ ...pickButton, background: INK, color: "#fff" }}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            Take a photo
          </button>
          <button type="button" onClick={() => galleryRef.current?.click()} disabled={busy} style={{ ...pickButton, background: "#fff", color: INK }}>
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

      {preview && <img src={preview} alt="Your photo" style={{ display: "block", width: "100%", maxHeight: 360, objectFit: "contain", background: "#f4f5f7", borderRadius: 8, marginBottom: greeting ? 4 : 14 }} />}
      {preview && greeting && (
        <p style={{ margin: "0 0 10px" }}>
          <button type="button" onClick={clearPhoto} disabled={busy} style={linkButton}>Remove photo</button>
        </p>
      )}
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
    </>
  );

  const greetingFields = (
    <>
      <p style={{ margin: "0 0 18px", color: MUTED, lineHeight: 1.45 }}>
        Pick your words and add a photo if you like. You get it sized for WhatsApp, Instagram status and email, plus a 4×6 card to print and tuck into gift boxes.
      </p>

      <div role="radiogroup" aria-labelledby="greeting-line-label" style={{ marginBottom: line === OWN ? 4 : 18 }}>
        <span id="greeting-line-label" style={groupLabel}>Greeting</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[...SEASON.greetingOptions, OWN].map((option) => (
            <label key={option} className="mmv-chip" style={{ position: "relative", display: "inline-flex", maxWidth: "100%" }}>
              <input type="radio" name="greeting-line" value={option} checked={line === option} onChange={() => setLine(option)} style={offscreen} />
              <span lang={langOf(option)} style={chip(line === option)}>{option === OWN ? "Write your own" : option}</span>
            </label>
          ))}
        </div>
      </div>
      {line === OWN && (
        <div style={{ marginTop: 10 }}>
          <label htmlFor="greeting-own">Your greeting</label>
          <input id="greeting-own" value={ownLine} onChange={(e) => setOwnLine(e.target.value)} maxLength={HEADLINE_MAX} placeholder="Happy Diwali from all of us" style={input} />
        </div>
      )}

      <label htmlFor="greeting-message" style={{ fontWeight: 600 }}>Your message</label>
      <textarea
        id="greeting-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={SEASON.messageMax}
        rows={3}
        aria-describedby="greeting-message-count"
        style={{ ...input, margin: "6px 0 4px", resize: "vertical", lineHeight: 1.4, fontFamily: "inherit" }}
      />
      <p id="greeting-message-count" style={{ margin: "0 0 12px", fontSize: 13, textAlign: "right", color: near ? MAROON : MUTED, fontWeight: near ? 600 : 400 }}>
        {message.length} of {SEASON.messageMax} characters
      </p>

      <div role="group" aria-labelledby="greeting-ideas-label" style={{ marginBottom: 20 }}>
        <span id="greeting-ideas-label" style={{ display: "block", fontSize: 14, color: MUTED, margin: "0 0 8px" }}>Or tap one to use it</span>
        {copy.greeting.suggestions.map((text) => (
          <button key={text} type="button" aria-pressed={message === text} onClick={() => setMessage(text)} style={suggestion(message === text)}>
            {text}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div>
      <style>{CHIP_CSS}</style>
      <h2 id="make-kind-label" style={{ fontSize: 20, margin: "0 0 12px" }}>What do you want to make?</h2>
      <div role="radiogroup" aria-labelledby="make-kind-label" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginBottom: 22 }}>
        {kinds.map((k) => (
          <label key={k.key} style={kindCard(kind === k.key)}>
            {k.art}
            <span style={{ display: "flex", flexDirection: "column", gap: 4, padding: "10px 12px 12px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="radio"
                  name="make-kind"
                  value={k.key}
                  checked={kind === k.key}
                  onChange={() => chooseKind(k.key)}
                  disabled={busy}
                  aria-describedby={`make-kind-${k.key}`}
                  style={{ width: 20, height: 20, margin: 0, flexShrink: 0, accentColor: INK }}
                />
                <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.25 }}>{k.title}</span>
              </span>
              <span id={`make-kind-${k.key}`} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: k.metaColor, lineHeight: 1.3 }}>{k.meta}</span>
                <span style={{ fontSize: 14, color: MUTED, lineHeight: 1.35 }}>{k.line}</span>
              </span>
            </span>
          </label>
        ))}
      </div>

      <form onSubmit={submit} aria-label={greeting ? SEASON.label : "Offer ad"}>
        {greeting && greetingFields}
        {photoSection}

        <div hidden={greeting}>
          {FIELDS.map(({ key, maxLength, required, multiline }) => {
            const f = fields[key];
            const props = { id: key, name: key, maxLength, placeholder: f.placeholder, style: input, "aria-describedby": f.hint ? `${key}-hint` : undefined };
            return (
              <div key={key}>
                <label htmlFor={key}>{f.label}</label>
                {multiline ? <textarea {...props} rows={2} /> : <input {...props} required={required && !greeting} />}
                {f.hint && <p id={`${key}-hint`} style={hint}>{f.hint}</p>}
              </div>
            );
          })}
        </div>

        {greeting && (
          <div style={{ border: `1px solid ${GOLD}`, background: "#FDF6E7", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 15, lineHeight: 1.4 }}>
            <span style={{ display: "block", fontSize: 13, color: MUTED, marginBottom: 4 }}>Signed at the bottom of your greeting</span>
            <b style={{ display: "block", overflowWrap: "anywhere" }}>{profile.businessName}</b>
            {profile.contact ? (
              <span style={{ display: "block", overflowWrap: "anywhere" }}>{profile.contact}</span>
            ) : (
              <span style={{ display: "block", color: MUTED, fontSize: 14 }}>Add your phone or website with “Edit business” at the top, so people can reach you.</span>
            )}
          </div>
        )}

        <button type="submit" disabled={busy} style={{ width: "100%", minHeight: 52, padding: "12px 20px", fontSize: 17, fontWeight: 700, background: AMBER, color: INK, border: "none", borderRadius: 10, cursor: "pointer" }}>
          {busy ? "Saving…" : greeting ? "Make my greeting" : "Save offer"}
        </button>
        {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
        <div role="status">
          {saved && <p style={{ color: "green" }}>{saved === "greeting" ? "Saved. Your greetings are below." : "Saved. Your ads are below."}</p>}
        </div>
      </form>

      <div ref={resultsRef} style={{ scrollMarginTop: 16 }}>
        {activeJob && (activeJob.kind === "greeting" || activeJob.photoUrl) && (
          <AdResults
            key={activeJob._id}
            job={{ _id: activeJob._id, photoUrl: activeJob.photoUrl, cutoutUrl: activeJob.cutoutUrl }}
            kind={activeJob.kind}
            offer={{
              headline: activeJob.headline,
              details: activeJob.details,
              validity: activeJob.validity,
              finePrint: activeJob.finePrint,
              message: activeJob.message,
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
          <h2 style={{ fontSize: 18 }}>Saved greetings and offers</h2>
          {jobs.map((job) => {
            const label = job.kind === "greeting" ? "Greeting" : "Offer";
            const sub = job.kind === "greeting" ? job.message : [job.details, job.validity].filter(Boolean).join(" · ");
            return (
              <div key={job._id} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                {job.photoUrl ? (
                  <img src={job.photoUrl} alt="" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                ) : job.kind === "greeting" ? (
                  <GreetingTile />
                ) : (
                  <span aria-hidden="true" style={{ width: 80, height: 60, borderRadius: 6, flexShrink: 0, background: "#f4f5f7" }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={kindTag(job.kind)}>{label}</span>
                  <b lang={langOf(job.headline)} style={{ display: "block", overflowWrap: "anywhere" }}>{job.headline}</b>
                  {sub && <div style={{ color: "#666", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>}
                </div>
                <button
                  onClick={() => { setActiveJobId(job._id); resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                  aria-label={`Open ${label.toLowerCase()}: ${job.headline}`}
                  style={{ minHeight: 44, minWidth: 64, padding: "8px 12px", cursor: "pointer", flexShrink: 0 }}
                >
                  Open
                </button>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
