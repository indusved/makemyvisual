import { useCallback, useEffect, useState } from "react";
import { Authenticated, Unauthenticated, AuthLoading, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { ConvexError } from "convex/values";
import { api } from "../convex/_generated/api";
import {
  BRAND,
  DEFAULT_INDUSTRY,
  INDUSTRIES,
  INDUSTRY_KEYS,
  industryFromPath,
  productName,
  type IndustryKey,
} from "../convex/industries";
import SignIn from "./SignIn";
import NewAd from "./NewAd";
import Brand from "./Brand";
import Onboarding from "./Onboarding";

const INK = "#111317";
const AMBER = "#F5B700";
const MUTED = "#5b6170";

const heading = { margin: "0 0 12px" };
const linkButton = {
  background: "none",
  border: "none",
  padding: 0,
  minHeight: 44,
  font: "inherit",
  color: "inherit",
  textDecoration: "underline",
  cursor: "pointer",
};

// "Car dealership" → "car dealership", but "D2C brand" stays as is.
function inSentence(label: string) {
  return /^[A-Z][a-z]/.test(label) ? label[0].toLowerCase() + label.slice(1) : label;
}

export default function App() {
  const [urlIndustry, setUrlIndustry] = useState(() => industryFromPath(window.location.pathname));
  const [arrivedAt] = useState(urlIndustry);

  useEffect(() => {
    document.title = urlIndustry ? productName(urlIndustry) : BRAND;
  }, [urlIndustry]);

  const syncUrl = useCallback((industry: IndustryKey) => {
    if (industryFromPath(window.location.pathname) !== industry) {
      const { search, hash } = window.location;
      history.replaceState(null, "", "/" + INDUSTRIES[industry].path + search + hash);
    }
    setUrlIndustry(industry);
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", color: INK, maxWidth: 560, margin: "40px auto 64px", padding: "0 16px" }}>
      <AuthLoading>
        <h1 style={heading}><Brand industry={urlIndustry ?? undefined} showSuffix={urlIndustry !== null} /></h1>
        <p>Loading…</p>
      </AuthLoading>
      <Unauthenticated>{urlIndustry ? <SignedOut industry={urlIndustry} /> : <Landing />}</Unauthenticated>
      <Authenticated>
        <SignedIn arrivedAt={arrivedAt} onIndustry={syncUrl} />
      </Authenticated>
    </main>
  );
}

function Landing() {
  return (
    <>
      <h1 style={{ margin: "0 0 20px" }}><Brand showSuffix={false} size={32} /></h1>
      <p style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3, margin: "0 0 8px" }}>Ad-ready visuals from one photo, in every social size.</p>
      <p style={{ color: MUTED, lineHeight: 1.45, margin: "0 0 28px" }}>
        Your real photo goes on every ad, never an AI-made copy. Pick what you sell to start.
      </p>
      <nav aria-label="Choose your business" style={{ display: "grid", gap: 12 }}>
        {INDUSTRY_KEYS.filter((k) => INDUSTRIES[k].enabled).map((k) => (
          <a
            key={k}
            href={"/" + INDUSTRIES[k].path}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              minHeight: 84,
              padding: "16px 18px",
              boxSizing: "border-box",
              border: "1px solid #ccc",
              borderRadius: 12,
              background: "#fff",
              color: INK,
              textDecoration: "none",
            }}
          >
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 20, fontWeight: 700 }}>{INDUSTRIES[k].chooserLabel}</span>
              <span style={{ display: "block", color: MUTED, fontSize: 15, marginTop: 4 }}>{INDUSTRIES[k].chooserDetail}</span>
            </span>
            <span
              aria-hidden="true"
              style={{ display: "grid", placeItems: "center", width: 40, height: 40, flexShrink: 0, borderRadius: 999, background: INK, color: AMBER, fontSize: 20, fontWeight: 700 }}
            >
              →
            </span>
          </a>
        ))}
      </nav>
    </>
  );
}

function SignedOut({ industry }: { industry: IndustryKey }) {
  return (
    <>
      <h1 style={heading}><Brand industry={industry} /></h1>
      <p style={{ lineHeight: 1.45, margin: "0 0 24px" }}>{INDUSTRIES[industry].tagline}</p>
      <SignIn />
      <p style={{ marginTop: 32, fontSize: 14 }}>
        <a href="/" style={{ color: MUTED, display: "inline-flex", alignItems: "center", minHeight: 44 }}>
          Sell something else? Choose another
        </a>
      </p>
    </>
  );
}

function SignedIn({ arrivedAt, onIndustry }: { arrivedAt: IndustryKey | null; onIndustry: (industry: IndustryKey) => void }) {
  const viewer = useQuery(api.users.viewer);
  const profile = useQuery(api.profiles.mine);
  const saveProfile = useMutation(api.profiles.save);
  const { signOut } = useAuthActions();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<IndustryKey | null>(null);
  const [mismatch, setMismatch] = useState(arrivedAt);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const savedIndustry = profile?.industry;
  useEffect(() => {
    if (savedIndustry) onIndustry(savedIndustry);
  }, [savedIndustry, onIndustry]);

  const accountLine = (business?: { name: string; onEdit?: () => void }) => (
    <div style={{ color: MUTED, fontSize: 14, display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 6, margin: "0 0 20px" }}>
      <span style={{ overflowWrap: "anywhere" }}>
        Signed in as <b style={{ color: INK }}>{viewer?.email ?? "…"}</b>
      </span>
      {business && (
        <>
          <span aria-hidden="true">·</span>
          <span style={{ overflowWrap: "anywhere" }}>{business.name}</span>
        </>
      )}
      {business?.onEdit && (
        <>
          <span aria-hidden="true">·</span>
          <button onClick={business.onEdit} style={linkButton}>Edit business</button>
        </>
      )}
      <span aria-hidden="true">·</span>
      <button onClick={() => void signOut()} style={linkButton}>Sign out</button>
    </div>
  );

  if (profile === undefined) {
    return (
      <>
        <h1 style={heading}><Brand industry={arrivedAt ?? undefined} showSuffix={arrivedAt !== null} /></h1>
        <p>Loading…</p>
      </>
    );
  }

  if (profile === null) {
    const start = arrivedAt ?? DEFAULT_INDUSTRY;
    return (
      <>
        <h1 style={heading}><Brand industry={draft ?? start} /></h1>
        {accountLine()}
        <Onboarding
          initial={{ industry: start, market: "IN", businessName: "" }}
          onIndustryChange={setDraft}
          onSaved={() => {
            setDraft(null);
            setMismatch(null);
          }}
        />
      </>
    );
  }

  const { industry, market, businessName, contact } = profile;

  async function switchTo(next: IndustryKey) {
    setSwitching(true);
    setSwitchError(null);
    try {
      await saveProfile({ industry: next, market, businessName, contact });
      setMismatch(null);
    } catch (e) {
      setSwitchError(e instanceof ConvexError ? String(e.data) : "Couldn't switch. Please try again.");
    } finally {
      setSwitching(false);
    }
  }

  function closeEditor() {
    setEditing(false);
    setDraft(null);
  }

  return (
    <>
      <h1 style={heading}><Brand industry={editing && draft ? draft : industry} /></h1>
      {!editing && <p style={{ lineHeight: 1.45, margin: "0 0 12px" }}>{INDUSTRIES[industry].tagline}</p>}
      {accountLine({ name: businessName, onEdit: editing ? undefined : () => setEditing(true) })}

      {mismatch && mismatch !== industry && !editing && (
        <div
          role="status"
          style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px", padding: "10px 14px", margin: "0 0 24px", border: `1px solid ${AMBER}`, background: "#FFF8E1", borderRadius: 8 }}
        >
          <span style={{ flex: "1 1 180px" }}>You're set up as a {inSentence(INDUSTRIES[industry].label)}.</span>
          <button onClick={() => void switchTo(mismatch)} disabled={switching} style={{ padding: "10px 14px", fontSize: 15, minHeight: 44, cursor: "pointer" }}>
            {switching ? "Switching…" : `Switch to ${inSentence(INDUSTRIES[mismatch].label)}`}
          </button>
          <button onClick={() => setMismatch(null)} style={{ ...linkButton, fontSize: 14, color: MUTED }}>Keep as is</button>
          {switchError && <p style={{ color: "crimson", flexBasis: "100%", margin: "4px 0 0" }}>{switchError}</p>}
        </div>
      )}

      {editing && (
        <Onboarding
          initial={{ industry, market, businessName, contact }}
          onIndustryChange={setDraft}
          onCancel={closeEditor}
          onSaved={() => {
            closeEditor();
            setMismatch(null);
          }}
        />
      )}
      <div style={{ display: editing ? "none" : undefined }}>
        <NewAd industry={industry} profile={{ businessName, contact }} />
      </div>
    </>
  );
}
