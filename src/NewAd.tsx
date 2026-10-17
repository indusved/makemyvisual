import { useEffect, useRef, useState, type RefObject } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { INDUSTRIES, SEASON, type ContactKind, type FieldCopy, type IndustryKey } from "../convex/industries";
import type { Id } from "../convex/_generated/dataModel";
import AdResults, { type Made, type SaveState } from "./AdResults";
import { loadImage, type Offer } from "./adRenderer";
import { CONTACT_LABEL, guessContactKind, shownContact } from "./contact";
import ContactField, { ContactIcon } from "./ContactField";
import { cutoutFromUrl, preloadCutout, startCutout, useCutoutState, type CutoutRun } from "./cutout";
import { clearDraft, loadPhoto, loadWords, savePhoto, saveWords } from "./draft";
import PhotoGuide, { PhotoTip } from "./PhotoGuide";
import { checkPhoto, shrinkPhoto, type PhotoWarning } from "./photoCheck";
import { Icon } from "./Icons";
import { color, text } from "./theme";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";
const OWN = "own";
const HEADLINE_MAX = 60;
const NAME_MAX = 60;

type Kind = "offer" | "greeting";
type Profile = { industry: IndustryKey; market: "IN" | "US"; businessName: string; contact?: string; contactKind?: ContactKind };
// What the results screen shows. id changes on every Make, Update and Open (one saved job per id).
// photoKey changes only with the photo: AdResults is keyed by it, so Update keeps the chosen background.
type MadeItem = Made & { id: number; photoKey: number; file: File | null; savedJobId?: Id<"jobs">; savedHasCutout?: boolean };
type Photo = { file: File | null; url: string | null; run: CutoutRun | null; key: number };

// Looks come from the shared classes in theme.ts (GLOBAL_CSS); inline styles here are layout only.
const offscreen = { position: "absolute" as const, width: 1, height: 1, opacity: 0, pointerEvents: "none" as const };
// The amber corners of the photo frame. Keyed by photoKey with the frame, so they snap in for each new photo.
const CORNERS = ["tl", "tr", "br", "bl"] as const;
// Labels from industries.ts that end in "(optional)" show that part quieter; the words stay the same.
const OPTIONAL = "(optional)";

// Devanagari text gets lang="hi" so screen readers read it in Hindi.
const langOf = (text: string) => (/[ऀ-ॿ]/.test(text) ? "hi" : undefined);

// Market only matters for the saved profile (it changes nothing on the visuals); editable in Edit business.
function defaultMarket(): "IN" | "US" {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone?.startsWith("America/") ? "US" : "IN";
  } catch {
    return "IN";
  }
}

type FieldKey = "headline" | "details" | "validity" | "finePrint";

// A clay lamp in a 40×40 box.
function DiyaShape() {
  return (
    <g>
      <circle cx="20" cy="14" r="11" fill="#E9B44C" opacity="0.22" />
      <path d="M20 3.5c3.4 4.6 5 7.8 5 10.4a5 5 0 0 1-10 0c0-2.6 1.6-5.8 5-10.4z" fill="#FFC94A" />
      <path d="M20 9.5c1.5 2.2 2.2 3.6 2.2 4.8a2.2 2.2 0 0 1-4.4 0c0-1.2.7-2.6 2.2-4.8z" fill="#FFF4D6" />
      <path d="M3 22.5c5.5-1.6 28.5-1.6 34 0-1.2 7.4-7.6 12-17 12s-15.8-4.6-17-12z" fill="#E9B44C" />
      <path d="M3 22.5c5.5 1.4 28.5 1.4 34 0" fill="none" stroke="#B5832A" strokeWidth="1.4" />
      <circle cx="12" cy="28" r="1.4" fill={color.festive} />
      <circle cx="20" cy="29.5" r="1.4" fill={color.festive} />
      <circle cx="28" cy="28" r="1.4" fill={color.festive} />
    </g>
  );
}

// Thumbnail for a saved greeting that has no photo.
function GreetingTile() {
  return (
    <span aria-hidden="true" style={{ width: 72, height: 54, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: color.festive }}>
      <svg width="32" height="32" viewBox="0 0 40 40"><DiyaShape /></svg>
    </span>
  );
}

// Whole seconds since `from`, ticking every second. Hidden from screen readers, so the status
// line around it isn't read out again on every tick.
function Seconds({ from }: { from: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return <span aria-hidden="true" className="mmv-num"> ({Math.max(0, Math.floor((now - from) / 1000))} s)</span>;
}

export default function NewAd({
  industry,
  signedIn,
  profile,
  initialKind,
  onKindChange,
  onBusyChange,
}: {
  industry: IndustryKey;
  // undefined while the sign-in state loads.
  signedIn: boolean | undefined;
  // undefined = loading; null = guest, or signed in with no business saved yet.
  profile: Profile | null | undefined;
  initialKind?: Kind;
  // Told when the greeting/offer choice changes, so it survives a category switch or reload.
  onKindChange?: (kind: Kind) => void;
  // True only while a save runs: the server files it under whatever vertical the profile has then.
  onBusyChange?: (busy: boolean) => void;
}) {
  const copy = INDUSTRIES[industry];
  const fields: Record<FieldKey, FieldCopy> = copy.fields;
  const noun = copy.productNoun;
  // Read once: the words come back straight away, the photo a moment later (see the mount effect).
  const [draft] = useState(() => loadWords(industry));

  // The address decides greeting or offer: the switch keeps it in step, so a reload keeps the choice.
  const [kind, setKind] = useState<Kind>(initialKind ?? draft?.kind ?? "offer");
  const [line, setLine] = useState<string>(draft?.line || SEASON.greetingOptions[0]);
  const [ownLine, setOwnLine] = useState(draft?.ownLine ?? "");
  const [message, setMessage] = useState<string>(draft ? draft.message : copy.greeting.message);
  const [headline, setHeadline] = useState(draft?.headline ?? "");
  const [details, setDetails] = useState(draft?.details ?? "");
  const [validity, setValidity] = useState(draft?.validity ?? "");
  const [finePrint, setFinePrint] = useState(draft?.finePrint ?? "");
  const [businessName, setBusinessName] = useState(draft?.businessName ?? "");
  const [contact, setContact] = useState(draft?.contact ?? "");
  const [contactKind, setContactKind] = useState<ContactKind>(
    () => draft?.contactKind ?? guessContactKind(draft?.contact ?? "") ?? copy.defaultContactKind,
  );
  // A contact button was tapped in this tab: typing no longer switches the kind by itself.
  const [contactPicked, setContactPicked] = useState(draft?.contactPicked ?? false);
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<PhotoWarning[]>([]);
  const [view, setView] = useState<"form" | "results">("form");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [guideSignal, setGuideSignal] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoKey, setPhotoKey] = useState(0);
  const [run, setRun] = useState<CutoutRun | null>(null);
  // A picked photo is being made smaller before it shows.
  const [shrinking, setShrinking] = useState(false);
  const [made, setMade] = useState<MadeItem | null>(null);
  // The draft photo has been looked for. Until then the stored draft is left alone.
  const [loaded, setLoaded] = useState(false);
  // The draft was on the results screen: make it again once the account state is known.
  const [restoreMake, setRestoreMake] = useState(false);
  // A guest just signed in with results on screen: save once the profile has loaded.
  const [pendingSave, setPendingSave] = useState(false);

  const greeting = kind === "greeting";
  const jobs = useQuery(api.jobs.mine, signedIn ? { industry } : "skip");
  // Only used to warm the first backdrop; AdResults reads the same (shared) query.
  const backgrounds = useQuery(api.backgrounds.list, greeting ? { industry, kind: "greeting" as const } : { industry });
  const ensureProfile = useMutation(api.profiles.ensure);
  const generateUploadUrl = useMutation(api.jobs.generateUploadUrl);
  const createJob = useMutation(api.jobs.create);
  const markDone = useMutation(api.jobs.markDone);
  const logDownload = useMutation(api.jobs.logDownload);
  const setCutout = useMutation(api.jobs.setCutout);
  const cut = useCutoutState(run);

  const rootRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const takeRef = useRef<HTMLButtonElement>(null);
  const retakeRef = useRef<HTMLButtonElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const ownRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const headlineRef = useRef<HTMLInputElement>(null);
  const validityRef = useRef<HTMLInputElement>(null);
  const checkRun = useRef(0);
  const madeCounter = useRef(0);
  const photoKeyCounter = useRef(0);
  const currentMadeId = useRef<number | null>(null);
  const prevSigned = useRef(signedIn);
  // Object URLs this component made, revoked once neither the form nor the results use them.
  const urls = useRef(new Set<string>());
  // One save per made id, one upload per photo; a failed entry is dropped so the next call retries.
  const saves = useRef(new Map<number, Promise<Id<"jobs"> | null>>());
  const uploads = useRef(new Map<number, Promise<Id<"_storage">>>());
  // Shares and downloads (per made id) that happened while its save failed; counted once it saves.
  const missed = useRef(new Map<number, number>());
  // Greetings: the results on screen leave the photo out.
  const photoLeftOut = useRef(false);
  const busyCount = useRef(0);
  const busyChange = useRef(onBusyChange);
  const warmed = useRef(new Set<string>());

  // Account state: guest, or signed in with the profile loaded (null = no business yet).
  const accountKnown = signedIn === false || (signedIn === true && profile !== undefined);
  const showBusinessInputs = accountKnown && (signedIn === false || profile === null || editingBusiness);
  // The typed name while the inputs show (or no profile is loaded yet), otherwise the saved one, live.
  const nameForVisual = showBusinessInputs || !profile ? businessName.trim() : profile.businessName;
  const contactForVisual = showBusinessInputs || !profile ? contact.trim() : profile.contact ?? "";
  // Older profiles have no kind: the renderer guesses it from the text.
  const kindForVisual = showBusinessInputs || !profile ? contactKind : profile.contactKind;
  const draftMade = made !== null && made.savedJobId === undefined;
  const madeUrl = made?.photoUrl ?? null;

  useEffect(() => {
    busyChange.current = onBusyChange;
  }, [onBusyChange]);
  useEffect(() => () => {
    if (busyCount.current > 0) busyChange.current?.(false);
  }, []);

  useEffect(() => {
    currentMadeId.current = made?.id ?? null;
  }, [made]);

  useEffect(() => {
    for (const url of urls.current) {
      if (url !== preview && url !== madeUrl) {
        URL.revokeObjectURL(url);
        urls.current.delete(url);
      }
    }
  }, [preview, madeUrl]);
  useEffect(() => {
    const created = urls.current;
    return () => {
      for (const url of created) URL.revokeObjectURL(url);
      created.clear();
    };
  }, []);

  // Once on mount: bring back the draft photo, and the results if the draft was on them.
  useEffect(() => {
    let cancelled = false;
    if (!draft) {
      // No draft in this tab: drop any photo left over from an earlier visit.
      void savePhoto(industry, null);
      setLoaded(true);
      return;
    }
    // A draft of the other kind is left from an earlier visit: its words come back, its results don't.
    const sameKind = draft.kind === (initialKind ?? draft.kind);
    void loadPhoto(industry).then((blob) => {
      if (cancelled) return;
      // A photo picked in the meantime wins.
      const restored = blob && checkRun.current === 0 ? showPhoto(new File([blob], "photo.jpg", { type: blob.type || "image/jpeg" })) : null;
      if (draft.made && sameKind) {
        if (draft.kind === "greeting" || restored) setRestoreMake(true);
        else setPhotoError("Please add your photo again.");
      }
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!restoreMake || !accountKnown) return;
    setRestoreMake(false);
    // The words may have changed after Make (say, an emptied name): they pass the same checks first.
    const found = problem();
    if (found) return stop(found);
    commitMake({ file, url: preview, run, key: photoKey });
  }, [restoreMake, accountKnown]);

  useEffect(() => {
    if (!loaded || restoreMake) return;
    saveWords(industry, { kind, line, ownLine, message, headline, details, validity, finePrint, businessName, contact, contactKind, contactPicked, made: draftMade });
  }, [loaded, restoreMake, industry, kind, line, ownLine, message, headline, details, validity, finePrint, businessName, contact, contactKind, contactPicked, draftMade]);

  // Guest → signed in (not the first load) with results on screen: save them once.
  useEffect(() => {
    const was = prevSigned.current;
    prevSigned.current = signedIn;
    if (was === false && signedIn === true && made && view === "results") setPendingSave(true);
  }, [signedIn, made, view]);
  useEffect(() => {
    if (!pendingSave) return;
    if (!made) {
      setPendingSave(false);
      return;
    }
    if (profile === undefined) return;
    setPendingSave(false);
    void ensureSaved(made);
  }, [pendingSave, profile, made]);

  // Warm the first backdrop, so the first picture after Make doesn't wait on its download.
  const warmUrl = backgrounds?.find((b) => b.url)?.url ?? null;
  const wantWarm = greeting || file !== null;
  useEffect(() => {
    if (!wantWarm || !warmUrl || warmed.current.has(warmUrl)) return;
    warmed.current.add(warmUrl);
    void loadImage(warmUrl).catch(() => {});
  }, [wantWarm, warmUrl]);

  // A rejected cut-out: open the photo guide next to the advice.
  const cutStage = cut?.stage;
  useEffect(() => {
    if (cutStage === "bad") setGuideSignal((n) => n + 1);
  }, [cutStage]);

  function chooseKind(next: Kind) {
    setKind(next);
    setError(null);
    onKindChange?.(next);
  }

  function onKindKey(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const next: Kind = greeting ? "offer" : "greeting";
    chooseKind(next);
    event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-kind="${next}"]`)?.focus();
  }

  function openBusinessEditor(field: "name" | "contact") {
    if (profile) {
      setBusinessName(profile.businessName);
      setContact(profile.contact ?? "");
      setContactKind(profile.contactKind ?? guessContactKind(profile.contact ?? "") ?? copy.defaultContactKind);
    }
    setEditingBusiness(true);
    requestAnimationFrame(() => (field === "name" ? nameRef : contactRef).current?.focus());
  }

  function nextMessage() {
    const ideas: readonly string[] = copy.greeting.suggestions;
    const at = ideas.indexOf(message);
    for (let step = 1; step <= ideas.length; step++) {
      const idea = ideas[(at + step) % ideas.length];
      if (idea !== message) return setMessage(idea);
    }
  }

  function openPhoto() {
    preloadCutout();
    setPhotoOpen(true);
    requestAnimationFrame(() => takeRef.current?.focus());
  }

  function choosePhoto(picker: HTMLInputElement | null) {
    // Start the cut-out model download while the camera or gallery is open.
    preloadCutout();
    picker?.click();
  }

  // Shows a (shrunk) photo, starts its cut-out and checks it.
  function showPhoto(f: File): Photo {
    const url = URL.createObjectURL(f);
    urls.current.add(url);
    const key = ++photoKeyCounter.current;
    const cutRun = startCutout(f);
    setFile(f);
    setPreview(url);
    setPhotoKey(key);
    setRun(cutRun);
    setWarnings([]);
    setPhotoOpen(true);
    const check = ++checkRun.current;
    void checkPhoto(f, noun).then((found) => {
      if (check !== checkRun.current) return;
      setWarnings(found);
      if (found.length > 0) setGuideSignal((n) => n + 1);
    });
    return { file: f, url, run: cutRun, key };
  }

  function clearPhoto() {
    checkRun.current++;
    setShrinking(false);
    setFile(null);
    setPreview(null);
    setRun(null);
    setWarnings([]);
    setPhotoError(null);
    setPhotoOpen(false);
    setPhotoKey(++photoKeyCounter.current);
    void savePhoto(industry, null);
  }

  async function pickFile(f: File | undefined) {
    setPhotoError(null);
    setError(null);
    if (!f) return;
    if (!ACCEPT.split(",").includes(f.type)) return setPhotoError("Please choose a JPG, PNG or WebP photo.");
    if (f.size > MAX_BYTES) return setPhotoError("That photo is over 10 MB. Please choose a smaller one.");
    const pick = ++checkRun.current;
    setShrinking(true);
    const small = await shrinkPhoto(f);
    // A newer pick, or Remove photo, happened while this one was shrinking.
    if (pick !== checkRun.current) return;
    setShrinking(false);
    showPhoto(small);
    void savePhoto(industry, small);
  }

  function onPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const f = event.target.files?.[0];
    event.target.value = "";
    void pickFile(f);
  }

  // Draws nothing and saves nothing: AdResults draws from the local photo, saving waits for Share/Download.
  function commitMake(photo: Photo) {
    const words: Offer = {
      headline: (greeting ? (line === OWN ? ownLine : line) : headline).trim(),
      message: greeting ? message.trim() : undefined,
      details: greeting ? undefined : details.trim() || undefined,
      validity: greeting ? undefined : validity.trim() || undefined,
      finePrint: greeting ? undefined : finePrint.trim() || undefined,
      businessName: nameForVisual,
      contact: contactForVisual || undefined,
      contactKind: contactForVisual ? kindForVisual : undefined,
    };
    let cutRun = photo.file ? photo.run : null;
    if (photo.file && !cutRun) {
      cutRun = startCutout(photo.file);
      setRun(cutRun);
    }
    setMade({ id: ++madeCounter.current, kind, words, photoUrl: photo.file ? photo.url : null, cutout: cutRun, photoKey: photo.key, file: photo.file });
    setSaveState("idle");
    setError(null);
    setView("results");
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ block: "start" }));
  }

  // The first thing stopping Make, with the field to fix; null when it can go ahead.
  function problem(): { text: string; field: HTMLElement | null } | null {
    if (showBusinessInputs && !businessName.trim()) {
      return { text: `Type your ${copy.businessNoun}'s name. It goes on your ${greeting ? "greeting" : "ads"}.`, field: nameRef.current };
    }
    if (greeting && !(line === OWN ? ownLine : line).trim()) return { text: "Please type your greeting, or pick one above.", field: ownRef.current };
    if (!greeting && !file) {
      return { text: shrinking ? "Your photo is still getting ready. Tap again in a moment." : `Add a photo of your ${noun} first.`, field: takeRef.current };
    }
    if (!greeting && !headline.trim()) return { text: "Type your offer headline.", field: headlineRef.current };
    return null;
  }

  function stop({ text, field }: { text: string; field: HTMLElement | null }) {
    setError(text);
    field?.scrollIntoView({ block: "center" });
    field?.focus({ preventScroll: true });
  }

  function make(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accountKnown) return;
    const found = problem();
    if (found) return stop(found);
    commitMake({ file, url: preview, run, key: photoKey });
  }

  // to "photo": from a rejected cut-out on the results. The photo guide is already open by the photo.
  function changeWords(to?: "photo") {
    setView("form");
    requestAnimationFrame(() => {
      if (to === "photo" && photoRef.current) {
        photoRef.current.scrollIntoView({ block: "start" });
        retakeRef.current?.focus({ preventScroll: true });
        return;
      }
      rootRef.current?.scrollIntoView({ block: "start" });
      (greeting ? messageRef : headlineRef).current?.focus({ preventScroll: true });
    });
  }

  function makeAnother() {
    setLine(SEASON.greetingOptions[0]);
    setOwnLine("");
    setMessage(copy.greeting.message);
    setHeadline("");
    setDetails("");
    setValidity("");
    setFinePrint("");
    setShowExtras(false);
    clearPhoto();
    setMade(null);
    setView("form");
    setSaveState("idle");
    setError(null);
    setPendingSave(false);
    clearDraft(industry);
    requestAnimationFrame(() => rootRef.current?.scrollIntoView({ block: "start" }));
  }

  function retryCutout() {
    if (!made?.photoUrl) return;
    const cutRun = startCutout(made.file ?? made.photoUrl);
    // Only when the results show the form's own photo (not a reopened saved item).
    if (made.photoKey === photoKey) setRun(cutRun);
    setMade({ ...made, cutout: cutRun });
    // Already saved, or saving: that save has the failed run, so this one is filed with the job instead.
    const saving = saves.current.get(made.id);
    if (saving && !made.savedHasCutout && !(made.kind === "greeting" && photoLeftOut.current)) saveCutoutWhenReady(saving, cutRun);
  }

  function upload(body: Blob, type: string): Promise<Id<"_storage">> {
    return (async () => {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": type }, body });
      if (!res.ok) throw new Error("upload failed");
      return (await res.json()).storageId as Id<"_storage">;
    })();
  }

  // Update keeps the same photo, so it reuses one upload.
  function uploadOnce(key: number, f: File): Promise<Id<"_storage">> {
    let pending = uploads.current.get(key);
    if (!pending) {
      pending = upload(f, f.type);
      uploads.current.set(key, pending);
      pending.catch(() => uploads.current.delete(key));
    }
    return pending;
  }

  // Only the visual on screen reports its save state.
  function mark(m: MadeItem, state: SaveState) {
    if (currentMadeId.current === m.id) setSaveState(state);
  }

  // Files a finished cut-out with its job, once both are ready. Watching the run meanwhile keeps it
  // from being skipped if the person moves on to another photo.
  function saveCutoutWhenReady(job: Promise<Id<"jobs"> | null>, cutRun: CutoutRun) {
    const release = cutRun.subscribe(() => {});
    void job
      .then(async (jobId) => {
        if (!jobId) return;
        await cutRun.done;
        const state = cutRun.getState();
        if (state.stage !== "done" || !state.blob) return;
        const cutoutStorageId = await upload(state.blob, "image/png");
        await setCutout({ jobId, cutoutStorageId });
      })
      .catch(() => {})
      .finally(release);
  }

  // Saves a made visual once: profile → photo upload → job → done, then the cut-out when it is ready.
  // Resolves to the job id, or null when it couldn't be saved here. Never rejects.
  function ensureSaved(m: MadeItem): Promise<Id<"jobs"> | null> {
    const known = saves.current.get(m.id);
    if (known) return known;
    // Only the visual on screen is ever saved, and its results report the photo choice.
    const leaveOut = m.kind === "greeting" && photoLeftOut.current;
    const job = (async (): Promise<Id<"jobs"> | null> => {
      if (++busyCount.current === 1) busyChange.current?.(true);
      mark(m, "saving");
      try {
        // A reopened saved item already belongs to this account and vertical.
        if (!m.savedJobId) {
          const saved = await ensureProfile({
            industry,
            market: profile?.market ?? defaultMarket(),
            businessName: m.words.businessName ?? "",
            contact: m.words.contact,
            contactKind: m.words.contactKind,
          });
          if (saved.industry !== industry) {
            // Set up for another vertical: the page is moving there, so nothing is filed here.
            saves.current.delete(m.id);
            mark(m, "idle");
            return null;
          }
        }
        const jobId =
          m.savedJobId ??
          (await createJob({
            industry,
            kind: m.kind,
            headline: m.words.headline,
            message: m.words.message,
            details: m.words.details,
            validity: m.words.validity,
            finePrint: m.words.finePrint,
            photoStorageId: m.file && !leaveOut ? await uploadOnce(m.photoKey, m.file) : undefined,
          }));
        void markDone({ jobId }).catch(() => {});
        const owed = missed.current.get(m.id) ?? 0;
        missed.current.delete(m.id);
        for (let i = 0; i < owed; i++) void logDownload({ jobId }).catch(() => {});
        mark(m, "saved");
        // The form's own draft is done with, unless a newer visual is already on it. A reopened item never touches it.
        if (!m.savedJobId && currentMadeId.current === m.id) clearDraft(industry);
        return jobId;
      } catch {
        saves.current.delete(m.id);
        mark(m, "error");
        return null;
      } finally {
        if (--busyCount.current === 0) busyChange.current?.(false);
      }
    })();
    saves.current.set(m.id, job);
    if (m.cutout && !m.savedHasCutout && !leaveOut) saveCutoutWhenReady(job, m.cutout);
    return job;
  }

  // After each Share, Download or Save all that handed over a file.
  function delivered() {
    if (!signedIn || !made) return;
    const id = made.id;
    void ensureSaved(made).then((jobId) => {
      if (jobId) void logDownload({ jobId }).catch(() => {});
      else missed.current.set(id, (missed.current.get(id) ?? 0) + 1);
    });
  }

  function openJob(job: NonNullable<typeof jobs>[number]) {
    const cutRun = job.photoUrl ? (job.cutoutUrl ? cutoutFromUrl(job.cutoutUrl) : startCutout(job.photoUrl)) : null;
    setMade({
      id: ++madeCounter.current,
      kind: job.kind,
      words: {
        headline: job.headline,
        message: job.message,
        details: job.details,
        validity: job.validity,
        finePrint: job.finePrint,
        businessName: profile?.businessName,
        contact: profile?.contact,
        contactKind: profile?.contactKind,
      },
      photoUrl: job.photoUrl,
      cutout: cutRun,
      photoKey: ++photoKeyCounter.current,
      file: null,
      savedJobId: job._id,
      savedHasCutout: !!job.cutoutUrl,
    });
    setSaveState("saved");
    setView("results");
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ block: "start" }));
  }

  const near = message.length >= SEASON.messageMax - 20;
  const veryNear = message.length >= SEASON.messageMax - 10;
  const extrasOpen = showExtras || validity !== "" || finePrint !== "";
  const photoShown = !greeting || photoOpen || file !== null;
  const updating = made !== null && made.kind === kind;
  const makeLabel = greeting ? (updating ? "Update my greeting" : "Make my greeting") : updating ? "Update my ads" : "Make my ads";
  // Make waits for the sign-in state (and the saved business) to load, and says so.
  const submitLabel = accountKnown ? makeLabel : signedIn ? "Loading your business details…" : "Loading…";

  function textField(
    key: FieldKey,
    value: string,
    set: (next: string) => void,
    maxLength: number,
    opts: { required?: boolean; multiline?: boolean; inputRef?: RefObject<HTMLInputElement | null> } = {},
  ) {
    const f = fields[key];
    const common = { id: key, name: key, value, maxLength, placeholder: `e.g. ${f.placeholder}`, "aria-describedby": f.hint ? `${key}-hint` : undefined };
    return (
      <div className="mmv-field">
        <label htmlFor={key} className="mmv-label">
          {f.label.endsWith(OPTIONAL) ? <>{f.label.slice(0, -OPTIONAL.length)}<span className="mmv-opt">(optional)</span></> : f.label}
        </label>
        {opts.multiline ? (
          <textarea {...common} onChange={(e) => set(e.target.value)} rows={2} className="mmv-input" />
        ) : (
          <input {...common} ref={opts.inputRef} onChange={(e) => set(e.target.value)} required={opts.required} className="mmv-input" />
        )}
        {f.hint && <p id={`${key}-hint`} className="mmv-hint">{f.hint}</p>}
      </div>
    );
  }

  let businessBlock: React.ReactNode = null;
  if (showBusinessInputs) {
    businessBlock = (
      <>
        <div className="mmv-field">
          <label htmlFor="biz-name" className="mmv-label">Your {copy.businessNoun}'s name</label>
          <input
            id="biz-name"
            ref={nameRef}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            maxLength={NAME_MAX}
            autoComplete="organization"
            placeholder={`e.g. ${copy.businessNamePlaceholder}`}
            aria-describedby="biz-name-hint"
            className="mmv-input"
          />
          <p id="biz-name-hint" className="mmv-hint">Goes at the bottom of your {greeting ? "greeting" : "ads"}.</p>
        </div>
        <div className="mmv-field">
          <ContactField
            id="biz-contact"
            industry={industry}
            contact={contact}
            kind={contactKind}
            picked={contactPicked}
            onContact={setContact}
            onKind={(next, tapped) => {
              setContactKind(next);
              if (tapped) setContactPicked(true);
            }}
            inputRef={contactRef}
          />
        </div>
      </>
    );
  } else if (accountKnown && profile) {
    const saved = shownContact(profile.contact, profile.contactKind);
    businessBlock = (
      <div style={{ borderTop: `1px solid ${color.line}`, borderBottom: `1px solid ${color.line}`, padding: "14px 0", margin: "0 0 24px", display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 12 }}>
        <span style={{ flex: "1 1 160px", minWidth: 0, overflowWrap: "anywhere" }}>
          <span style={{ display: "block", fontSize: 15, lineHeight: 1.4 }}>
            From <b style={{ fontWeight: 600 }}>{profile.businessName}</b>
          </span>
          {saved && (
            <span style={{ display: "block", ...text.small, color: color.muted, marginTop: 2 }}>
              {/* The icon is glued to the first letter, so it never ends a line on its own. */}
              <span style={{ whiteSpace: "nowrap" }}>
                {saved.kind && <><ContactIcon kind={saved.kind} size={16} label={CONTACT_LABEL[saved.kind]} />{"\u00a0"}</>}
                {Array.from(saved.text)[0]}
              </span>
              {Array.from(saved.text).slice(1).join("")}
            </span>
          )}
        </span>
        <button type="button" onClick={() => openBusinessEditor(saved ? "name" : "contact")} className="mmv-link">
          {saved ? "Change" : "Add Instagram, WhatsApp or website"}
        </button>
      </div>
    );
  }

  // Space below each status line and note under the photo.
  const statusGap = { margin: "0 0 12px" };
  let cutStatus: React.ReactNode = null;
  if (cut) {
    switch (cut.stage) {
      case "loading":
        cutStatus = <p className="mmv-status mmv-status--wait" style={statusGap}><span className="mmv-spin" />Getting the cut-out tool ready…</p>;
        break;
      case "download":
        cutStatus = (
          <p className="mmv-status mmv-status--wait" style={statusGap}>
            <span className="mmv-spin" />
            <span>Getting the cut-out tool ready (first time only, about 100 MB)… <span className="mmv-num">{Math.round(cut.fraction * 100)}%</span></span>
          </p>
        );
        break;
      case "cutting":
        cutStatus = (
          <p className="mmv-status mmv-status--wait" style={statusGap}>
            <span className="mmv-spin" />
            <span>Cutting out your {noun} in the background<Seconds from={cut.startedAt} />. Keep typing.</span>
          </p>
        );
        break;
      case "done":
        cutStatus = (
          <>
            <p className="mmv-status mmv-status--done" style={statusGap}><Icon name="check" size={16} />Cut-out ready</p>
            {cut.cut.touchesEdge && (
              <p className="mmv-note mmv-note--caution" style={statusGap}>
                <Icon name="alert" />
                <span>Part of your {noun} looks cut off. Retake it with the whole {noun} in frame for the best {greeting ? "greeting" : "ads"}.</span>
              </p>
            )}
          </>
        );
        break;
      case "bad":
        cutStatus = (
          <p className="mmv-note mmv-note--caution" style={statusGap}>
            <Icon name="alert" />
            <span>
              We couldn't cleanly cut out the {noun}. A photo with the whole {noun} and a plain background works best.
              {greeting ? "" : " You can still continue: your ads will use the photo as it is."}
            </span>
          </p>
        );
        break;
      case "failed":
        cutStatus = <p className="mmv-status" style={{ margin: "0 0 4px" }}>The cut-out tool didn't finish downloading. Check your internet.</p>;
        break;
    }
  }

  const photoBlock = (
    <div ref={photoRef} role="group" aria-labelledby="photo-label" style={{ position: "relative", marginBottom: 24, scrollMarginTop: 8 }}>
      <p id="photo-label" className="mmv-label" style={{ margin: "0 0 4px" }}>{greeting ? <>{`Photo of your ${noun} `}<span className="mmv-opt">(optional)</span></> : `Photo of your ${noun}`}</p>
      <PhotoTip industry={industry} />
      {preview ? (
        <>
          <div key={photoKey} className="mmv-frame">
            {CORNERS.map((c) => <span key={c} aria-hidden="true" className={`mmv-corner mmv-corner--${c}`} />)}
            <img src={preview} alt="Your photo" style={{ display: "block", maxWidth: "100%", maxHeight: 240, width: "auto", height: "auto", margin: "0 auto", objectFit: "contain", borderRadius: 8 }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", columnGap: 20, margin: "4px 0 8px" }}>
            <button type="button" ref={retakeRef} onClick={() => choosePhoto(cameraRef.current)} className="mmv-link">Retake</button>
            <button type="button" onClick={() => choosePhoto(galleryRef.current)} className="mmv-link">Choose another</button>
            {greeting && <button type="button" onClick={clearPhoto} className="mmv-link">Remove photo</button>}
          </div>
          <div aria-live="polite">
            {warnings.length > 0 && (
              <div className="mmv-note mmv-note--caution" style={{ margin: "0 0 12px" }}>
                <Icon name="alert" />
                <div style={{ minWidth: 0 }}>
                  <b style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Quick check on this photo</b>
                  <ul style={{ margin: "0 0 6px", paddingLeft: 20 }}>
                    {warnings.map((w) => <li key={w.id}>{w.message}</li>)}
                  </ul>
                  <span style={{ color: color.muted }}>You can still continue.</span>
                </div>
              </div>
            )}
          </div>
          <div role="status">{cutStatus}</div>
          {cut?.stage === "failed" && file && (
            <button type="button" onClick={() => setRun(startCutout(file))} className="mmv-btn2 mmv-btn2--sm" style={{ margin: "8px 0 12px" }}>Try again</button>
          )}
        </>
      ) : (
        <div key={photoKey} className="mmv-frame" style={{ marginBottom: 12 }}>
          {CORNERS.map((c) => <span key={c} aria-hidden="true" className={`mmv-corner mmv-corner--${c}`} />)}
          <div className="mmv-picks">
            <button type="button" ref={takeRef} onClick={() => choosePhoto(cameraRef.current)} className="mmv-pick-tile">
              <Icon name="camera" size={24} />
              Take a photo
            </button>
            <button type="button" onClick={() => choosePhoto(galleryRef.current)} className="mmv-pick-tile">
              <Icon name="image" size={24} />
              Choose from gallery
            </button>
          </div>
        </div>
      )}
      <div role="status">
        {shrinking && <p className="mmv-status mmv-status--wait" style={statusGap}><span className="mmv-spin" />Getting your photo ready…</p>}
      </div>
      <input ref={cameraRef} type="file" accept={ACCEPT} capture="environment" onChange={onPicked} tabIndex={-1} aria-hidden="true" style={offscreen} />
      <input ref={galleryRef} type="file" accept={ACCEPT} onChange={onPicked} tabIndex={-1} aria-hidden="true" style={offscreen} />
      {photoError && <p role="alert" className="mmv-error" style={statusGap}><Icon name="alert" size={18} />{photoError}</p>}
      <PhotoGuide industry={industry} openSignal={guideSignal} />
    </div>
  );

  const greetingFields = (
    <>
      {businessBlock}
      <div role="radiogroup" aria-labelledby="greeting-line-label" style={{ margin: line === OWN ? "0 0 12px" : "0 0 24px" }}>
        <span id="greeting-line-label" className="mmv-label">Greeting</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[...SEASON.greetingOptions, OWN].map((option) => (
            <label key={option} className="mmv-chip">
              <input type="radio" name="greeting-line" value={option} checked={line === option} onChange={() => setLine(option)} />
              <span lang={langOf(option)}>{option === OWN ? "Write your own" : option}</span>
            </label>
          ))}
        </div>
      </div>
      {line === OWN && (
        <div className="mmv-field">
          <label htmlFor="greeting-own" className="mmv-label">Your greeting</label>
          <input id="greeting-own" ref={ownRef} value={ownLine} onChange={(e) => setOwnLine(e.target.value)} maxLength={HEADLINE_MAX} placeholder="Happy Diwali from all of us" className="mmv-input" />
        </div>
      )}

      <div className="mmv-field" style={{ margin: "0 0 8px" }}>
        <label htmlFor="greeting-message" className="mmv-label">Your message</label>
        <textarea
          id="greeting-message"
          ref={messageRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={SEASON.messageMax}
          rows={3}
          aria-describedby={near ? "greeting-message-count" : undefined}
          className="mmv-input"
        />
        {near && (
          <p id="greeting-message-count" className="mmv-num" style={{ ...text.small, margin: "8px 0 0", textAlign: "right", color: veryNear ? color.danger : color.muted, fontWeight: veryNear ? 600 : 400 }}>
            {message.length} of {SEASON.messageMax} characters
          </p>
        )}
      </div>
      <div style={{ margin: "0 0 24px" }}>
        <button type="button" onClick={nextMessage} className="mmv-link">Try another message</button>
      </div>

      {photoShown ? (
        photoBlock
      ) : (
        <div>
          <button type="button" onClick={openPhoto} className="mmv-btn2 mmv-btn2--block">
            <Icon name="plus" />
            Add a photo of your {noun} (optional)
          </button>
          <p style={{ ...text.small, color: color.muted, margin: "8px 0 24px" }}>Your real {noun} on the festive background.</p>
        </div>
      )}
    </>
  );

  const offerFields = (
    <>
      {photoBlock}
      {textField("headline", headline, setHeadline, HEADLINE_MAX, { required: true, inputRef: headlineRef })}
      {textField("details", details, setDetails, 80)}
      {extrasOpen ? (
        <>
          {textField("validity", validity, setValidity, 40, { inputRef: validityRef })}
          {textField("finePrint", finePrint, setFinePrint, 200, { multiline: true })}
        </>
      ) : (
        <div style={{ margin: "0 0 24px" }}>
          <button
            type="button"
            onClick={() => {
              setShowExtras(true);
              requestAnimationFrame(() => validityRef.current?.focus());
            }}
            className="mmv-link"
          >
            <Icon name="plus" size={18} />
            Add an end date or fine print (optional)
          </button>
        </div>
      )}
      {businessBlock}
    </>
  );

  return (
    <div ref={rootRef} style={{ scrollMarginTop: 8 }}>
      <div style={{ display: view === "form" ? undefined : "none" }}>
        <div role="radiogroup" aria-label="What to make" className="mmv-seg mmv-seg--lg" style={{ margin: "8px 0 32px" }}>
          {(["greeting", "offer"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              tabIndex={kind === k ? 0 : -1}
              data-kind={k}
              onClick={() => chooseKind(k)}
              onKeyDown={onKindKey}
            >
              {k === "greeting" ? SEASON.label : "Offer ad"}
            </button>
          ))}
        </div>

        <form onSubmit={make} noValidate aria-label={greeting ? SEASON.label : "Offer ad"}>
          {greeting ? greetingFields : offerFields}

          <div className="mmv-makebar">
            {error && <p role="alert" className="mmv-error"><Icon name="alert" size={18} />{error}</p>}
            <button type="submit" disabled={!accountKnown} className="mmv-btn">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>

      {made && (
        <div ref={resultsRef} style={{ display: view === "results" ? undefined : "none", scrollMarginTop: 8 }}>
          <AdResults
            key={`${made.kind}-${made.photoKey}`}
            industry={industry}
            made={made}
            signedIn={signedIn === true}
            saveState={saveState}
            onDelivered={delivered}
            onRetrySave={() => void ensureSaved(made)}
            onRetryCutout={retryCutout}
            onChangeWords={made.savedJobId ? undefined : changeWords}
            onMakeAnother={makeAnother}
            onPhotoChoice={(leftOut) => (photoLeftOut.current = leftOut)}
          />
        </div>
      )}

      {signedIn && jobs && jobs.length > 0 && (
        <section style={{ marginTop: 48, borderTop: `1px solid ${color.line}`, paddingTop: 32 }}>
          <h2 style={{ ...text.heading, margin: "0 0 8px" }}>Saved greetings and offers</h2>
          {jobs.map((job) => {
            const label = job.kind === "greeting" ? "Greeting" : "Offer";
            const sub = job.kind === "greeting" ? job.message : [job.details, job.validity].filter(Boolean).join(" · ");
            return (
              <div key={job._id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${color.line}` }}>
                {job.photoUrl ? (
                  <img src={job.photoUrl} alt="" style={{ width: 72, height: 54, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                ) : job.kind === "greeting" ? (
                  <GreetingTile />
                ) : (
                  <span aria-hidden="true" style={{ width: 72, height: 54, borderRadius: 8, flexShrink: 0, background: color.sunk }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, lineHeight: 1.25, color: color.muted, marginBottom: 2 }}>
                    <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: job.kind === "greeting" ? color.festive : color.accent }} />
                    {label}
                  </span>
                  <b lang={langOf(job.headline)} style={{ display: "block", fontSize: 16, fontWeight: 600, lineHeight: 1.35, overflowWrap: "anywhere" }}>{job.headline}</b>
                  {sub && <div style={{ ...text.small, color: color.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>}
                </div>
                {/* An offer whose photo is gone can't be drawn again. */}
                {(job.kind === "greeting" || job.photoUrl) && (
                  <button
                    type="button"
                    onClick={() => openJob(job)}
                    aria-label={`Open ${label.toLowerCase()}: ${job.headline}`}
                    className="mmv-btn2 mmv-btn2--sm"
                    style={{ flex: "none" }}
                  >
                    Open
                  </button>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
