import { useState } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../convex/_generated/api";
import { INDUSTRIES, INDUSTRY_KEYS, type ContactKind, type IndustryKey } from "../convex/industries";
import { VerticalIcon } from "./Brand";
import { CheckDisc, Icon } from "./Icons";
import { color, text } from "./theme";
import { guessContactKind, shownContact } from "./contact";
import ContactField from "./ContactField";

type Market = "IN" | "US";
export type BusinessDetails = { market: Market; businessName: string; contact?: string; contactKind?: ContactKind };

const MARKETS: { key: Market; label: string }[] = [
  { key: "IN", label: "India" },
  { key: "US", label: "United States" },
];

const fieldset = { border: "none", padding: 0, margin: "0 0 24px", minWidth: 0 };
const radio = { width: 20, height: 20, margin: 0, flexShrink: 0, accentColor: color.ink };
const muted15 = { color: color.muted, fontSize: 15, lineHeight: 1.45 };

// A chosen market gets an ink edge plus an inset ring, so it looks 2px thick without anything shifting.
function card(selected: boolean) {
  return {
    display: "flex",
    gap: 12,
    alignItems: "center",
    minHeight: 52,
    boxSizing: "border-box" as const,
    borderRadius: 12,
    padding: "14px 16px",
    background: color.surface,
    cursor: "pointer",
    border: `1px solid ${selected ? color.ink : color.lineStrong}`,
    boxShadow: selected ? `inset 0 0 0 1px ${color.ink}` : "none",
  };
}

// Example image on a card, or the vertical's icon on the sunk panel when it has none yet, so every card lines up
// and has something to ring when chosen.
function CardMedia({ industry, url, badgeText, chosen }: { industry: IndustryKey; url?: string; badgeText?: string; chosen: boolean }) {
  return (
    <span className="mmv-media" style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", overflow: "hidden" }}>
      {url ? (
        <img src={url} alt="" decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <VerticalIcon industry={industry} />
        </span>
      )}
      {badgeText && (
        <span
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.3,
            padding: "3px 8px",
            borderRadius: 999,
            background: color.festive,
            color: color.festiveText,
          }}
        >
          {badgeText}
        </span>
      )}
      {chosen && <CheckDisc style={{ position: "absolute", top: 8, right: 8 }} />}
    </span>
  );
}

// One card per vertical, two to a row. Links to the vertical's page (plus hrefSearch, e.g. "?make=greeting"), or buttons when onPick is given.
export function VerticalCards({
  labelledBy,
  onPick,
  selected,
  current,
  disabled,
  images,
  badges,
  hrefSearch = "",
}: {
  labelledBy: string;
  onPick?: (industry: IndustryKey) => void;
  selected?: IndustryKey;
  current?: IndustryKey;
  disabled?: boolean;
  images?: Partial<Record<IndustryKey, string>>;
  badges?: Partial<Record<IndustryKey, string>>;
  hrefSearch?: string;
}) {
  const grid = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "24px 16px" };
  const cards = INDUSTRY_KEYS.filter((k) => INDUSTRIES[k].enabled).map((k) => {
    const body = (
      <>
        <CardMedia industry={k} url={images?.[k]} badgeText={badges?.[k]} chosen={selected === k} />
        <span>
          <span style={{ display: "block", fontSize: 17, fontWeight: 600, lineHeight: 1.25 }}>{INDUSTRIES[k].chooserLabel}</span>
          <span style={{ display: "block", color: color.muted, fontSize: 14, lineHeight: 1.4, marginTop: 4 }}>{INDUSTRIES[k].chooserDetail}</span>
          {current === k && <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginTop: 6 }}>What you sell now</span>}
        </span>
      </>
    );
    // The ink ring comes from .mmv-choice plus aria-pressed, so these get no inline border or background.
    return onPick ? (
      <button key={k} type="button" onClick={() => onPick(k)} disabled={disabled} aria-pressed={selected === undefined ? undefined : selected === k} className="mmv-card mmv-choice">
        {body}
      </button>
    ) : (
      <a key={k} href={"/" + INDUSTRIES[k].path + hrefSearch} className="mmv-card mmv-choice">
        {body}
      </a>
    );
  });
  return onPick ? (
    <div role="group" aria-labelledby={labelledBy} style={grid}>{cards}</div>
  ) : (
    <nav aria-labelledby={labelledBy} style={grid}>{cards}</nav>
  );
}

// Setup or edit for one vertical only. The vertical itself is chosen on its own screen.
export default function Onboarding({
  industry,
  initial,
  onSaved,
  onCancel,
  onChangeVertical,
  purpose = "offer",
}: {
  industry: IndustryKey;
  initial: BusinessDetails;
  // "greeting" when they came to make a Diwali greeting: the setup copy says it carries their name and contact.
  purpose?: "greeting" | "offer";
  onSaved?: () => void;
  onCancel?: () => void;
  // Gets what is typed now, so switching vertical from the edit form doesn't drop unsaved edits.
  onChangeVertical?: (typed: BusinessDetails) => void;
}) {
  const save = useMutation(api.profiles.save);
  const [market, setMarket] = useState<Market>(initial.market);
  const [businessName, setBusinessName] = useState(initial.businessName);
  const [contact, setContact] = useState(initial.contact ?? "");
  const [contactKind, setContactKind] = useState<ContactKind>(
    () => initial.contactKind ?? guessContactKind(initial.contact ?? "") ?? INDUSTRIES[industry].defaultContactKind,
  );
  // A contact button was tapped: typing no longer switches the kind by itself.
  const [contactPicked, setContactPicked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const editing = Boolean(onCancel);
  const greeting = purpose === "greeting" && !editing;
  const config = INDUSTRIES[industry];
  const shownOn = greeting ? "your greeting and ads" : "your greetings and ads";
  // The kind only travels with a contact.
  const typedContact = () => (contact.trim() ? { contact: contact.trim(), contactKind } : {});
  const changeVertical = () =>
    onChangeVertical?.({ market, businessName: businessName.trim() ? businessName : initial.businessName, ...typedContact() });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!businessName.trim()) return setError(`Please type your ${config.businessNoun}'s name.`);
    setBusy(true);
    try {
      await save({ industry, market, businessName, ...typedContact() });
      onSaved?.();
    } catch (e) {
      setError(e instanceof ConvexError ? String(e.data) : "Couldn't save your details. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <h2 id="business-details" tabIndex={-1} style={{ ...text.title, margin: 0, outline: "none" }}>{editing ? "Edit your business" : `Set up your ${config.businessNoun}`}</h2>
      <p style={{ ...muted15, margin: "8px 0 4px" }}>
        {editing
          ? "Changes show on the next ads you make."
          : greeting
            ? "Your name and contact go on your Diwali greeting, so customers know who it's from. You can change any of this later."
            : "Your name and contact go on every ad. You can change any of this later."}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 12, ...muted15, margin: "0 0 16px" }}>
        {editing ? (
          <>
            <span>
              You sell: <b style={{ color: color.ink, fontWeight: 600 }}>{config.chooserLabel}</b>
            </span>
            {onChangeVertical && (
              <button type="button" onClick={changeVertical} disabled={busy} className="mmv-link">Change what you sell</button>
            )}
          </>
        ) : (
          onChangeVertical && (
            <button type="button" onClick={changeVertical} disabled={busy} className="mmv-link">
              Not {config.label}? Choose again
            </button>
          )
        )}
      </div>

      <fieldset style={fieldset}>
        <legend className="mmv-label" style={{ padding: 0 }}>Where are your customers?</legend>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          {MARKETS.map((m) => (
            <label key={m.key} style={card(market === m.key)}>
              <input type="radio" name="market" value={m.key} checked={market === m.key} onChange={() => setMarket(m.key)} style={radio} />
              <span style={{ color: color.ink }}>{m.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mmv-field">
        <label htmlFor="businessName" className="mmv-label">Your {config.businessNoun}'s name</label>
        <input
          id="businessName"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
          maxLength={60}
          autoComplete="organization"
          placeholder={config.businessNamePlaceholder}
          className="mmv-input"
        />
        <p className="mmv-hint">Shown on {shownOn}.</p>
      </div>

      <div className="mmv-field">
        <ContactField
          id="contact"
          industry={industry}
          contact={contact}
          kind={contactKind}
          picked={contactPicked}
          onContact={setContact}
          onKind={(next, tapped) => {
            setContactKind(next);
            if (tapped) setContactPicked(true);
          }}
        />
      </div>

      <button type="submit" disabled={busy} className="mmv-btn">
        {busy ? "Saving…" : editing ? "Save changes" : greeting ? "Continue to your greeting" : "Continue"}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} disabled={busy} className="mmv-link mmv-link--muted" style={{ display: "block", marginTop: 8 }}>
          Cancel
        </button>
      )}
      {error && (
        <p role="alert" className="mmv-error" style={{ marginTop: 12 }}>
          <Icon name="alert" />
          {error}
        </p>
      )}
    </form>
  );
}

// A deliberate, separate step: switch the saved business to another vertical, saving market, name and contact with it.
export function ChangeVertical({
  current,
  details,
  onDone,
  onCancel,
}: {
  current: IndustryKey;
  details: BusinessDetails;
  onDone: () => void;
  onCancel: () => void;
}) {
  const save = useMutation(api.profiles.save);
  const [next, setNext] = useState<IndustryKey>(current);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setError(null);
    setBusy(true);
    try {
      await save({ industry: next, market: details.market, businessName: details.businessName, contact: details.contact, contactKind: details.contactKind });
      onDone();
    } catch (e) {
      setError(e instanceof ConvexError ? String(e.data) : "Couldn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2 id="change-vertical" tabIndex={-1} style={{ ...text.title, margin: 0, outline: "none" }}>Change what you sell</h2>
      <p style={{ ...muted15, margin: "8px 0 24px" }}>
        New ads will use the new category's backgrounds and photo tips, and will show <b style={{ color: color.ink, fontWeight: 600 }}>{details.businessName}</b>
        {details.contact && <> and {shownContact(details.contact, details.contactKind)?.text}</>}. Greetings and offers you saved for {INDUSTRIES[current].chooserLabel} are kept and show
        again if you switch back.
      </p>
      <VerticalCards labelledBy="change-vertical" onPick={setNext} selected={next} current={current} disabled={busy} />
      <button type="button" onClick={() => void confirm()} disabled={busy || next === current} className="mmv-btn" style={{ marginTop: 32 }}>
        {busy ? "Saving…" : next === current ? "Pick a new category" : `Switch to ${INDUSTRIES[next].chooserLabel}`}
      </button>
      <button type="button" onClick={onCancel} disabled={busy} className="mmv-link mmv-link--muted" style={{ display: "block", marginTop: 8 }}>
        Cancel
      </button>
      {error && (
        <p role="alert" className="mmv-error" style={{ marginTop: 12 }}>
          <Icon name="alert" />
          {error}
        </p>
      )}
    </section>
  );
}
