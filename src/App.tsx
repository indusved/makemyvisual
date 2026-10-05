import { useCallback, useEffect, useRef, useState } from "react";
import { Authenticated, Unauthenticated, AuthLoading, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { BRAND, INDUSTRIES, industryFromPath, productName, type IndustryKey } from "../convex/industries";
import SignIn from "./SignIn";
import NewAd from "./NewAd";
import Brand from "./Brand";
import Onboarding, { ChangeVertical, VerticalCards, type BusinessDetails } from "./Onboarding";

const INK = "#111317";
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

export default function App() {
  const [urlIndustry, setUrlIndustry] = useState(() => industryFromPath(window.location.pathname));

  useEffect(() => {
    document.title = urlIndustry ? productName(urlIndustry) : BRAND;
  }, [urlIndustry]);

  // Keeps the address bar on "/" + the vertical's path (or "/" when none), without a reload.
  const goTo = useCallback((industry: IndustryKey | null) => {
    const path = industry ? "/" + INDUSTRIES[industry].path : "/";
    if (window.location.pathname !== path) {
      const { search, hash } = window.location;
      history.replaceState(null, "", path + search + hash);
    }
    setUrlIndustry(industry);
  }, []);

  // Retired or unknown paths show the home page, so tidy them to "/".
  useEffect(() => {
    if (industryFromPath(window.location.pathname) === null) goTo(null);
  }, [goTo]);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", color: INK, maxWidth: 560, margin: "40px auto 64px", padding: "0 16px" }}>
      <AuthLoading>
        <h1 style={heading}><Brand industry={urlIndustry ?? undefined} showSuffix={urlIndustry !== null} /></h1>
        <p>Loading…</p>
      </AuthLoading>
      <Unauthenticated>{urlIndustry ? <SignedOut industry={urlIndustry} /> : <Landing />}</Unauthenticated>
      <Authenticated>
        <SignedIn urlIndustry={urlIndustry} goTo={goTo} />
      </Authenticated>
    </main>
  );
}

function Landing() {
  return (
    <>
      <h1 style={{ margin: "0 0 20px" }}><Brand showSuffix={false} size={32} /></h1>
      <p style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3, margin: "0 0 8px" }}>Ad-ready visuals from one photo, in every social size.</p>
      <p style={{ color: MUTED, lineHeight: 1.45, margin: "0 0 28px" }}>Your real photo goes on every ad, never an AI-made copy.</p>
      <h2 id="home-vertical" style={{ fontSize: 18, margin: "0 0 12px" }}>What do you sell?</h2>
      <VerticalCards labelledBy="home-vertical" />
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

function SignedIn({ urlIndustry, goTo }: { urlIndustry: IndustryKey | null; goTo: (industry: IndustryKey | null) => void }) {
  const viewer = useQuery(api.users.viewer);
  const profile = useQuery(api.profiles.mine);
  const { signOut } = useAuthActions();
  const [mode, setMode] = useState<"ads" | "edit" | "change">("ads");
  // What the edit form holds when "Change what you sell" is tapped, saved along with the new vertical.
  const [draft, setDraft] = useState<BusinessDetails | null>(null);
  // While an offer is saving, a vertical switch could file it under the new vertical, so editing waits.
  const [savingOffer, setSavingOffer] = useState(false);
  const editRef = useRef<HTMLButtonElement>(null);

  // The button just pressed disappears on every screen change, so move focus to the new screen
  // (or back to "Edit business"), letting keyboard and screen-reader users carry on from there.
  const shownMode = useRef(mode);
  useEffect(() => {
    if (shownMode.current === mode) return;
    shownMode.current = mode;
    const target = mode === "ads" ? editRef.current : document.getElementById(mode === "edit" ? "business-details" : "change-vertical");
    target?.focus();
  }, [mode]);

  // A saved business always wins over whatever vertical the address names.
  const savedIndustry = profile?.industry;
  useEffect(() => {
    if (savedIndustry) goTo(savedIndustry);
  }, [savedIndustry, goTo]);

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
          <button ref={editRef} onClick={business.onEdit} disabled={savingOffer} style={{ ...linkButton, cursor: savingOffer ? "default" : "pointer" }}>
            Edit business
          </button>
        </>
      )}
      <span aria-hidden="true">·</span>
      <button onClick={() => void signOut()} style={linkButton}>Sign out</button>
    </div>
  );

  if (profile === undefined) {
    return (
      <>
        <h1 style={heading}><Brand industry={urlIndustry ?? undefined} showSuffix={urlIndustry !== null} /></h1>
        <p>Loading…</p>
      </>
    );
  }

  if (profile === null) {
    if (!urlIndustry) {
      return (
        <>
          <h1 style={heading}><Brand showSuffix={false} /></h1>
          {accountLine()}
          <h2 id="setup-vertical" style={{ fontSize: 20, margin: "0 0 6px" }}>What do you sell?</h2>
          <p style={{ color: MUTED, lineHeight: 1.45, margin: "0 0 18px" }}>
            Pick one. Your backgrounds, photo tips and ad wording will be made for it. You can change it later.
          </p>
          <VerticalCards labelledBy="setup-vertical" onPick={goTo} />
        </>
      );
    }
    return (
      <>
        <h1 style={heading}><Brand industry={urlIndustry} /></h1>
        {accountLine()}
        <Onboarding industry={urlIndustry} initial={{ market: "IN", businessName: "" }} onChangeVertical={() => goTo(null)} />
      </>
    );
  }

  const { industry, market, businessName, contact } = profile;

  return (
    <>
      <h1 style={heading}>{mode === "change" ? <Brand showSuffix={false} /> : <Brand industry={industry} />}</h1>
      {mode === "ads" && <p style={{ lineHeight: 1.45, margin: "0 0 12px" }}>{INDUSTRIES[industry].tagline}</p>}
      {accountLine({ name: businessName, onEdit: mode === "ads" ? () => setMode("edit") : undefined })}

      {/* Kept mounted (hidden) while choosing a vertical, so Cancel brings back any unsaved edits. */}
      {mode !== "ads" && (
        <div style={{ display: mode === "edit" ? undefined : "none" }}>
          <Onboarding
            industry={industry}
            initial={{ market, businessName, contact }}
            onCancel={() => setMode("ads")}
            onSaved={() => setMode("ads")}
            onChangeVertical={(typed) => {
              setDraft(typed);
              setMode("change");
            }}
          />
        </div>
      )}
      {mode === "change" && (
        <ChangeVertical
          current={industry}
          details={draft ?? { market, businessName, contact }}
          onCancel={() => setMode("edit")}
          onDone={() => setMode("ads")}
        />
      )}
      {/* Keyed by vertical so an unfinished ad never carries over into another vertical. */}
      <div style={{ display: mode === "ads" ? undefined : "none" }}>
        <NewAd key={industry} industry={industry} profile={{ businessName, contact }} onBusyChange={setSavingOffer} />
      </div>
    </>
  );
}
