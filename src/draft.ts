import { CONTACT_KINDS, type ContactKind, type IndustryKey } from "../convex/industries";

// Best-effort copy of the maker's form, so a phone that reloads the tab while the person is in
// their email app (getting the sign-in code) comes back to the same words, photo and results.
// Words go in sessionStorage (this tab only); the photo goes in IndexedDB, which holds files.
// Nothing here ever throws: private windows and blocked storage just mean no draft.

export type DraftWords = {
  kind: "offer" | "greeting";
  line: string;
  ownLine: string;
  message: string;
  headline: string;
  details: string;
  validity: string;
  finePrint: string;
  businessName: string;
  contact: string;
  // Missing in drafts saved before contact kinds: the form then starts from the vertical's default.
  contactKind?: ContactKind;
  // A contact button was tapped, so typing no longer switches the kind by itself.
  contactPicked?: boolean;
  // The words were made into a visual, so a reload shows the results again.
  made: boolean;
};

const wordsKey = (industry: IndustryKey) => `mmv-draft-${industry}`;
const text = (v: unknown) => (typeof v === "string" ? v : "");

export function loadWords(industry: IndustryKey): DraftWords | null {
  try {
    const raw = sessionStorage.getItem(wordsKey(industry));
    if (!raw) return null;
    const w = JSON.parse(raw);
    if (!w || typeof w !== "object" || (w.kind !== "offer" && w.kind !== "greeting")) return null;
    return {
      kind: w.kind,
      line: text(w.line),
      ownLine: text(w.ownLine),
      message: text(w.message),
      headline: text(w.headline),
      details: text(w.details),
      validity: text(w.validity),
      finePrint: text(w.finePrint),
      businessName: text(w.businessName),
      contact: text(w.contact),
      contactKind: CONTACT_KINDS.find((k) => k === w.contactKind),
      contactPicked: w.contactPicked === true,
      made: w.made === true,
    };
  } catch {
    return null;
  }
}

export function saveWords(industry: IndustryKey, w: DraftWords): void {
  try {
    sessionStorage.setItem(wordsKey(industry), JSON.stringify(w));
  } catch {
    // Storage full or blocked: no draft.
  }
}

export function clearDraft(industry: IndustryKey): void {
  try {
    sessionStorage.removeItem(wordsKey(industry));
    sessionStorage.removeItem(lookKey(industry));
  } catch {
    // Blocked storage: nothing to clear.
  }
  void savePhoto(industry, null);
}

// The background and size picked on the results, so they come back with the results after a reload.
export type DraftLook = { kind: "offer" | "greeting"; look: string | null; size: string };
const lookKey = (industry: IndustryKey) => `mmv-look-${industry}`;

export function loadLook(industry: IndustryKey): DraftLook | null {
  try {
    const raw = sessionStorage.getItem(lookKey(industry));
    if (!raw) return null;
    const l = JSON.parse(raw);
    if (!l || (l.kind !== "offer" && l.kind !== "greeting") || typeof l.size !== "string") return null;
    return { kind: l.kind, look: typeof l.look === "string" ? l.look : null, size: l.size };
  } catch {
    return null;
  }
}

export function saveLook(industry: IndustryKey, l: DraftLook): void {
  try {
    sessionStorage.setItem(lookKey(industry), JSON.stringify(l));
  } catch {
    // Storage full or blocked: the default look comes back instead.
  }
}

const DB = "mmv";
const STORE = "photos";
const DAY = 24 * 60 * 60 * 1000;

// IndexedDB is shared by every tab of the site, so each photo is tagged with the tab that saved
// it (an id kept in that tab's sessionStorage, which survives a reload). A tab only ever gets its
// own photo back, never one picked in another tab.
type Stored = { blob: Blob; tab: string; at: number };
const pageId = Math.random().toString(36).slice(2);
function tabId(): string {
  try {
    let id = sessionStorage.getItem("mmv-tab");
    if (!id) {
      id = pageId;
      sessionStorage.setItem("mmv-tab", id);
    }
    return id;
  } catch {
    return pageId;
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("blocked"));
  });
}

// Runs work on the photo store and resolves once its transaction has finished.
async function transact(mode: IDBTransactionMode, work: (store: IDBObjectStore) => void): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      work(tx.objectStore(STORE));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

// One photo operation at a time, so a quick pick-then-remove always ends with the remove.
let queue: Promise<unknown> = Promise.resolve();
function queued<T>(work: () => Promise<T>, fallback: T): Promise<T> {
  const next = queue.then(work).catch(() => fallback);
  queue = next;
  return next;
}

// null removes the stored photo: this tab's own, or one left over for a day or more.
export function savePhoto(industry: IndustryKey, blob: Blob | null): Promise<void> {
  return queued(async () => {
    if (typeof indexedDB === "undefined") return;
    const tab = tabId();
    await transact("readwrite", (store) => {
      if (blob) {
        store.put({ blob, tab, at: Date.now() } satisfies Stored, industry);
        return;
      }
      const req = store.get(industry);
      req.onsuccess = () => {
        const found = req.result as Partial<Stored> | undefined;
        if (!found) return;
        const fresh = typeof found.at === "number" && Date.now() - found.at < DAY;
        if (found.tab === tab || !fresh) store.delete(industry);
      };
    });
  }, undefined);
}

export function loadPhoto(industry: IndustryKey): Promise<Blob | null> {
  return queued(async () => {
    if (typeof indexedDB === "undefined") return null;
    let found: Partial<Stored> | undefined;
    await transact("readonly", (store) => {
      const req = store.get(industry);
      req.onsuccess = () => {
        found = req.result as Partial<Stored> | undefined;
      };
    });
    const blob = found?.tab === tabId() ? found.blob : undefined;
    return blob instanceof Blob && blob.size > 0 ? blob : null;
  }, null);
}
