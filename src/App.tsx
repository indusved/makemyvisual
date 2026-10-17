import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { BRAND, INDUSTRIES, SEASON, industryFromPath, productName, type IndustryKey } from "../convex/industries";
import SignIn, { hasPendingCode } from "./SignIn";
import NewAd from "./NewAd";
import { loadWords } from "./draft";
import Brand, { Diya, Toran } from "./Brand";
import Onboarding, { ChangeVertical, VerticalCards, type BusinessDetails } from "./Onboarding";
import { ShowcaseRow, exampleImages, examplesFor, type MakeKind } from "./Showcase";
import { GREETING_SIZES } from "./adRenderer";

const INK = "#111317";
const MUTED = "#5b6170";
const MAROON = "#6B1020";
const GOLD = "#E9B44C";
const CREAM = "#FFF4E2";

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
const sectionTitle = { fontSize: 18, margin: "0 0 6px" };
const festiveNote = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  background: "#FFF7E8",
  border: `1px solid ${GOLD}`,
  borderLeft: `4px solid ${MAROON}`,
  borderRadius: 10,
  padding: "12px 14px",
};

// The season's badge on the "What do you sell?" cards.
const SEASON_BADGES: Partial<Record<IndustryKey, string>> = { gifting: "Diwali season" };
// Short names for the greeting sizes, small enough to sit under each shape in the hero.
const SHORT_SIZE_NAMES: Record<string, string> = { whatsapp: "WhatsApp", status: "Status", instagram: "Instagram", email: "Email", card: "Print card" };

const kindFromUrl = (): MakeKind => (new URLSearchParams(window.location.search).get("make") === "greeting" ? "greeting" : "offer");
const makeSearch = (kind: MakeKind) => (kind === "greeting" ? "?make=greeting" : "");
// The line under the logo for guests: the vertical's offer tagline, or a greeting one when making a greeting.
const tagline = (industry: IndustryKey, kind: MakeKind) =>
  kind === "greeting"
    ? `Make your ${INDUSTRIES[industry].businessNoun}'s Diwali greeting with your name on it, ready for WhatsApp, Instagram, email and print. ${SEASON.dateLabel}.`
    : INDUSTRIES[industry].tagline;

// Moves focus to a section and scrolls it to the top, smoothly unless reduced motion is on.
function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}
const scrollToChooser = () => scrollToSection("home-vertical");

export default function App() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  // undefined while the saved sign-in is still being checked.
  const signedIn = isLoading ? undefined : isAuthenticated;
  const [urlIndustry, setUrlIndustry] = useState(() => industryFromPath(window.location.pathname));
  // "greeting" when the address has ?make=greeting: kept in the address through sign-in and every path change.
  const [makeKind, setMakeKind] = useState(kindFromUrl);

  useEffect(() => {
    document.title = urlIndustry ? productName(urlIndustry) : BRAND;
  }, [urlIndustry]);

  // Keeps the address bar on "/" + the vertical's path (or "/" when none), without a reload. The query (?make=…) stays.
  const goTo = useCallback((industry: IndustryKey | null) => {
    const path = industry ? "/" + INDUSTRIES[industry].path : "/";
    if (window.location.pathname !== path) {
      const { search, hash } = window.location;
      history.replaceState(null, "", path + search + hash);
    }
    setUrlIndustry(industry);
  }, []);

  const chooseKind = useCallback((kind: MakeKind) => {
    const url = new URL(window.location.href);
    if (kind === "greeting") url.searchParams.set("make", "greeting");
    else url.searchParams.delete("make");
    history.replaceState(null, "", url.pathname + url.search + url.hash);
    setMakeKind(kind);
  }, []);

  // Retired or unknown paths show the home page, so tidy them to "/".
  useEffect(() => {
    if (industryFromPath(window.location.pathname) === null) goTo(null);
  }, [goTo]);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", color: INK, maxWidth: 560, margin: "20px auto 64px", padding: "0 16px" }}>
      {urlIndustry ? (
        // The same page in the same place for guests, loading and signed in, so the maker inside keeps
        // everything typed and made when someone signs in.
        <VerticalPage industry={urlIndustry} signedIn={signedIn} goTo={goTo} kind={makeKind} onKind={chooseKind} />
      ) : signedIn === undefined ? (
        <>
          <h1 style={heading}><Brand showSuffix={false} /></h1>
          <p>Loading…</p>
        </>
      ) : signedIn ? (
        <SignedInHome goTo={goTo} kind={makeKind} />
      ) : (
        <Landing kind={makeKind} onKind={chooseKind} />
      )}
    </main>
  );
}

function GreetingSizes() {
  const scale = 64 / Math.max(...GREETING_SIZES.map((s) => s.height));
  return (
    <ul
      aria-label="Sizes you get"
      style={{ listStyle: "none", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "12px 8px", maxWidth: 360, padding: 0, margin: "0 0 22px" }}
    >
      {GREETING_SIZES.map((s) => (
        <li key={s.key} title={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span
            aria-hidden="true"
            style={{
              width: Math.round(s.width * scale),
              height: Math.round(s.height * scale),
              border: `1.5px solid ${GOLD}`,
              borderRadius: 3,
              background: "rgba(233,180,76,0.14)",
              boxSizing: "border-box",
            }}
          />
          <span style={{ fontSize: 12, color: CREAM, whiteSpace: "nowrap" }}>{SHORT_SIZE_NAMES[s.key] ?? s.label}</span>
        </li>
      ))}
    </ul>
  );
}

function Landing({ kind, onKind }: { kind: MakeKind; onKind: (kind: MakeKind) => void }) {
  const showcase = useQuery(api.showcase.list, {});
  const pick = (next: MakeKind) => {
    onKind(next);
    scrollToChooser();
  };

  return (
    <>
      <h1 style={{ margin: "0 0 20px" }}><Brand showSuffix={false} size={32} /></h1>

      <section
        aria-labelledby="season-title"
        style={{
          borderRadius: 16,
          overflow: "hidden",
          color: CREAM,
          background: `radial-gradient(120% 70% at 50% 0%, #8A1C30 0%, ${MAROON} 55%, #4E0B17 100%)`,
          margin: "0 0 32px",
        }}
      >
        <Toran />
        <div style={{ padding: "14px 20px 22px" }}>
          <p style={{ display: "flex", alignItems: "center", gap: 8, color: GOLD, fontSize: 15, fontWeight: 600, margin: "0 0 10px" }}>
            <Diya size={22} />
            {SEASON.dateLabel}
          </p>
          <h2 id="season-title" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.01em", color: "#FFFFFF", margin: "0 0 12px" }}>
            Your business's Diwali greeting, ready in 2 minutes
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.5, margin: "0 0 20px" }}>
            Thank your customers with a greeting that carries your name. Send it on WhatsApp, Instagram or email, or print it as a card for your gift boxes.
          </p>
          <GreetingSizes />
          <button
            type="button"
            onClick={() => pick("greeting")}
            style={{
              display: "block",
              width: "100%",
              maxWidth: 320,
              minHeight: 50,
              padding: "12px 20px",
              fontSize: 17,
              fontWeight: 700,
              color: INK,
              background: GOLD,
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            Make a Diwali greeting
          </button>
          <button type="button" onClick={() => pick("offer")} style={{ ...linkButton, marginTop: 8, fontSize: 15, textAlign: "left" }}>
            Making a sale or offer ad? Choose what you sell
          </button>
        </div>
      </section>

      {showcase && showcase.some((i) => i.url) && (
        <section aria-labelledby="examples-title" style={{ margin: "0 0 28px" }}>
          <h2 id="examples-title" style={sectionTitle}>Examples</h2>
          <p style={{ color: MUTED, lineHeight: 1.45, margin: "0 0 12px" }}>Made with sample photos. Yours will use your own photo, or no photo for a greeting.</p>
          <ShowcaseRow items={showcase} label="Example greetings and ads" showIndustry />
        </section>
      )}

      <h2 id="home-vertical" tabIndex={-1} style={{ ...sectionTitle, outline: "none", scrollMarginTop: 16 }}>What do you sell?</h2>
      <div aria-live="polite">
        {kind === "greeting" ? (
          <div style={{ ...festiveNote, alignItems: "center", flexWrap: "wrap", columnGap: 10, rowGap: 0, padding: "6px 14px", margin: "8px 0 14px" }}>
            <Diya size={22} />
            <span style={{ flex: "1 1 200px", lineHeight: 1.4, padding: "6px 0" }}>
              <b>Making a Diwali greeting.</b> Pick what you sell to start.
            </span>
            <button type="button" onClick={() => onKind("offer")} style={{ ...linkButton, fontSize: 15 }}>Make an offer ad instead</button>
          </div>
        ) : (
          <p style={{ color: MUTED, lineHeight: 1.45, margin: "0 0 14px" }}>
            Pick one to start. Your real photo goes on every visual, never an AI-made copy.
          </p>
        )}
      </div>
      <VerticalCards labelledBy="home-vertical" images={exampleImages(showcase, kind)} badges={SEASON_BADGES} hrefSearch={makeSearch(kind)} />
    </>
  );
}

// First-time choice of vertical after signing in, with the same example pictures as the home page.
function SetupChooser({ kind, onPick }: { kind: MakeKind; onPick: (industry: IndustryKey) => void }) {
  const showcase = useQuery(api.showcase.list, {});
  return <VerticalCards labelledBy="setup-vertical" onPick={onPick} images={exampleImages(showcase, kind)} badges={SEASON_BADGES} />;
}

// One muted line: who is signed in (or their business), then the account links.
function AccountLine({ children }: { children: ReactNode }) {
  const { signOut } = useAuthActions();
  return (
    <div style={{ color: MUTED, fontSize: 14, display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 6, margin: "0 0 16px" }}>
      {children}
      <span aria-hidden="true">·</span>
      <button type="button" onClick={() => void signOut()} style={linkButton}>Sign out</button>
    </div>
  );
}

// Signed in on "/": straight to their business's page once it loads, or the first-time "What do you sell?".
function SignedInHome({ goTo, kind }: { goTo: (industry: IndustryKey | null) => void; kind: MakeKind }) {
  const viewer = useQuery(api.users.viewer);
  const profile = useQuery(api.profiles.mine);

  // A saved business always wins over whatever vertical the address names.
  const savedIndustry = profile?.industry;
  useEffect(() => {
    if (savedIndustry) goTo(savedIndustry);
  }, [savedIndustry, goTo]);

  if (profile !== null) {
    return (
      <>
        <h1 style={heading}><Brand showSuffix={false} /></h1>
        <p>Loading…</p>
      </>
    );
  }

  return (
    <>
      <h1 style={heading}><Brand showSuffix={false} /></h1>
      <AccountLine>
        <span style={{ overflowWrap: "anywhere" }}>{viewer?.email ?? "…"}</span>
      </AccountLine>
      <h2 id="setup-vertical" style={{ fontSize: 20, margin: "0 0 6px" }}>What do you sell?</h2>
      <p style={{ color: MUTED, lineHeight: 1.45, margin: "0 0 18px" }}>
        {kind === "greeting"
          ? "Pick one. Your Diwali greeting wording, photo tips and ad backgrounds will be made for it. You can change it later."
          : "Pick one. Your backgrounds, photo tips and ad wording will be made for it. You can change it later."}
      </p>
      <SetupChooser kind={kind} onPick={goTo} />
    </>
  );
}

// A vertical's page for every sign-in state: the maker, plus sign-in and examples for guests, or the account line
// and Edit business when signed in. Not keyed by vertical: only NewAd inside is.
function VerticalPage({
  industry,
  signedIn,
  goTo,
  kind,
  onKind,
}: {
  industry: IndustryKey;
  signedIn: boolean | undefined;
  goTo: (industry: IndustryKey | null) => void;
  kind: MakeKind;
  onKind: (kind: MakeKind) => void;
}) {
  // Skipped until signed in, so the profile reads as loading (undefined) until it is fresh, never a stale null.
  const profile = useQuery(api.profiles.mine, signedIn ? {} : "skip");
  const viewer = useQuery(api.users.viewer, signedIn ? {} : "skip");
  const showcase = useQuery(api.showcase.list, signedIn === false ? { industry } : "skip");
  const examples = examplesFor(showcase, industry, kind);
  const hasExamples = examples.some((i) => i.url);
  const config = INDUSTRIES[industry];
  const [mode, setMode] = useState<"ads" | "edit" | "change">("ads");
  // What the edit form holds when "Change what you sell" is tapped, saved along with the new vertical.
  const [draft, setDraft] = useState<BusinessDetails | null>(null);
  // While a job is saving, a vertical switch could file it under the new vertical, so editing waits.
  const [saving, setSaving] = useState(false);
  // Open again after a reload during the code step, unless the results (and their own sign-in step) come back.
  const [showSignIn, setShowSignIn] = useState(() => hasPendingCode() && !loadWords(industry)?.made);
  // The vertical in the address when a saved business sent us on to its own page.
  const [movedFrom, setMovedFrom] = useState<IndustryKey | null>(null);
  // The vertical being left through "Change what you sell", so that switch gets no "You're set up for" note.
  const switchingFrom = useRef<IndustryKey | null>(null);
  const editRef = useRef<HTMLButtonElement>(null);

  // Edit and change need a saved business. Without one (signed out, say) the maker shows.
  const view = profile ? mode : "ads";
  useEffect(() => {
    if (!profile) setMode("ads");
  }, [profile]);

  useEffect(() => {
    if (signedIn) setShowSignIn(false);
  }, [signedIn]);

  // The button just pressed disappears on every screen change, so move focus to the new screen
  // (or back to "Edit business"), letting keyboard and screen-reader users carry on from there.
  const shownMode = useRef(mode);
  useEffect(() => {
    if (shownMode.current === mode) return;
    shownMode.current = mode;
    const target = mode === "ads" ? editRef.current : document.getElementById(mode === "edit" ? "business-details" : "change-vertical");
    target?.focus();
  }, [mode]);

  // A saved business always wins over whatever vertical the address names. It never gets mixed into another vertical.
  useEffect(() => {
    if (!profile || profile.industry === industry) return;
    const onPurpose = switchingFrom.current === industry;
    switchingFrom.current = null;
    setMovedFrom(onPurpose ? null : industry);
    goTo(profile.industry);
  }, [profile, industry, goTo]);

  return (
    <>
      <h1 style={{ margin: "0 0 8px" }}>{view === "change" ? <Brand showSuffix={false} size={24} /> : <Brand industry={industry} size={24} />}</h1>

      {signedIn === false && (
        <>
          <p style={{ fontSize: 15, lineHeight: 1.45, margin: "0 0 8px" }}>
            {tagline(industry, kind)}
            {hasExamples && (
              <>
                {" "}
                {/* Inline, with padding that makes it 44px tall to tap without spreading the lines apart. */}
                <a
                  href="#examples"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection("examples");
                  }}
                  style={{ color: INK, padding: "13px 0", whiteSpace: "nowrap" }}
                >
                  See examples
                </a>
              </>
            )}
          </p>
          <button
            type="button"
            aria-expanded={showSignIn}
            onClick={() => setShowSignIn((open) => !open)}
            style={{ ...linkButton, display: "block", fontSize: 15, textAlign: "left", margin: "0 0 8px" }}
          >
            Already have an account? Sign in
          </button>
          {showSignIn && (
            <div style={{ border: "1px solid #e3e6eb", borderRadius: 12, padding: 14, margin: "0 0 16px" }}>
              <SignIn heading="Sign in" intro="We'll email you a 6-digit code. Your saved greetings and ads come back." autoFocus />
              <button type="button" onClick={() => setShowSignIn(false)} style={{ ...linkButton, fontSize: 15 }}>Cancel</button>
            </div>
          )}
        </>
      )}

      {signedIn === true && (
        <AccountLine>
          {profile ? (
            <>
              <b style={{ color: INK, overflowWrap: "anywhere" }}>{profile.businessName}</b>
              {view === "ads" && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    ref={editRef}
                    type="button"
                    onClick={() => setMode("edit")}
                    disabled={saving}
                    style={{ ...linkButton, cursor: saving ? "default" : "pointer" }}
                  >
                    Edit business
                  </button>
                </>
              )}
            </>
          ) : (
            <span style={{ overflowWrap: "anywhere" }}>{viewer?.email ?? "…"}</span>
          )}
        </AccountLine>
      )}

      {profile && movedFrom && movedFrom !== industry && (
        <p role="status" style={{ ...festiveNote, display: "block", fontSize: 15, lineHeight: 1.45, margin: "0 0 16px" }}>
          You're set up for {INDUSTRIES[profile.industry].chooserLabel}, so this is your {INDUSTRIES[profile.industry].chooserLabel} page. To make things
          for {INDUSTRIES[movedFrom].chooserLabel}, use Edit business, then Change what you sell.
        </p>
      )}

      {/* Kept mounted (hidden) while choosing a vertical, so Cancel brings back any unsaved edits. */}
      {profile && view !== "ads" && (
        <div style={{ display: view === "edit" ? undefined : "none" }}>
          <p style={{ color: MUTED, fontSize: 14, margin: "0 0 12px", overflowWrap: "anywhere" }}>
            Signed in as <b style={{ color: INK }}>{viewer?.email ?? "…"}</b>
          </p>
          <Onboarding
            industry={profile.industry}
            initial={{ market: profile.market, businessName: profile.businessName, contact: profile.contact, contactKind: profile.contactKind }}
            onCancel={() => setMode("ads")}
            onSaved={() => setMode("ads")}
            onChangeVertical={(typed) => {
              setDraft(typed);
              switchingFrom.current = profile.industry;
              setMode("change");
            }}
          />
        </div>
      )}
      {profile && view === "change" && (
        <ChangeVertical
          current={profile.industry}
          details={draft ?? { market: profile.market, businessName: profile.businessName, contact: profile.contact, contactKind: profile.contactKind }}
          onCancel={() => {
            switchingFrom.current = null;
            setMode("edit");
          }}
          onDone={() => setMode("ads")}
        />
      )}
      {/* Keyed by vertical so an unfinished ad never carries over into another vertical. Hidden, never unmounted,
          during Edit business, and never remounted on sign-in or while the profile loads. */}
      <div style={{ display: view === "ads" ? undefined : "none" }}>
        <NewAd
          key={industry}
          industry={industry}
          signedIn={signedIn}
          profile={signedIn === false ? null : profile}
          initialKind={kind}
          onKindChange={onKind}
          onBusyChange={setSaving}
        />
      </div>

      {signedIn === false && (
        <>
          {hasExamples && (
            <section id="examples" tabIndex={-1} aria-labelledby="examples-title" style={{ marginTop: 32, scrollMarginTop: 16, outline: "none" }}>
              <h2 id="examples-title" style={sectionTitle}>Examples</h2>
              <p style={{ color: MUTED, lineHeight: 1.45, margin: "0 0 12px" }}>Made with sample photos. Yours uses your own photo, or no photo for a greeting.</p>
              <ShowcaseRow items={examples} label={`Examples for ${config.chooserLabel}`} height={120} />
            </section>
          )}
          <p style={{ marginTop: 32, fontSize: 14 }}>
            <a href={"/" + makeSearch(kind)} style={{ color: MUTED, display: "inline-flex", alignItems: "center", minHeight: 44 }}>
              Sell something else? Choose another
            </a>
          </p>
        </>
      )}
    </>
  );
}
