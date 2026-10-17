import { useState } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../convex/_generated/api";
import { INDUSTRIES, INDUSTRY_KEYS, type ContactKind, type IndustryKey } from "../convex/industries";
import { VerticalIcon } from "./Brand";
import { guessContactKind, shownContact } from "./contact";
import ContactField from "./ContactField";

type Market = "IN" | "US";
export type BusinessDetails = { market: Market; businessName: string; contact?: string; contactKind?: ContactKind };

const INK = "#111317";
const AMBER = "#F5B700";
const MUTED = "#5b6170";

const MARKETS: { key: Market; label: string }[] = [
  { key: "IN", label: "India" },
  { key: "US", label: "United States" },
];

const input = { display: "block", width: "100%", padding: 12, fontSize: 16, margin: "6px 0 4px", boxSizing: "border-box" as const };
const hint = { color: MUTED, fontSize: 13, margin: "0 0 18px" };
const fieldset = { border: "none", padding: 0, margin: "0 0 22px", minWidth: 0 };
const legend = { fontWeight: 600, padding: 0, marginBottom: 8 };
// The one main action on a screen: amber and full width. Dimmed while it can't be pressed.
function primary(disabled: boolean) {
  return {
    display: "block",
    width: "100%",
    minHeight: 52,
    padding: "12px 20px",
    fontSize: 17,
    fontWeight: 700,
    background: AMBER,
    color: INK,
    border: "none",
    borderRadius: 10,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.55 : 1,
  };
}
const radio = { width: 20, height: 20, margin: "1px 0 0", flexShrink: 0, accentColor: INK };
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

// Selected cards get a thicker amber border; padding shrinks by the same amount so nothing jumps.
function card(selected: boolean) {
  return {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    minHeight: 44,
    boxSizing: "border-box" as const,
    borderRadius: 10,
    background: "#fff",
    cursor: "pointer",
    border: selected ? `3px solid ${AMBER}` : "1px solid #ccc",
    padding: selected ? "12px 14px" : "14px 16px",
  };
}

function verticalCard(selected: boolean) {
  return {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-start",
    gap: 10,
    width: "100%",
    minHeight: 150,
    boxSizing: "border-box" as const,
    margin: 0,
    padding: selected ? 12 : 14,
    border: selected ? `3px solid ${AMBER}` : "1px solid #ccc",
    borderRadius: 12,
    background: "#fff",
    color: INK,
    font: "inherit",
    textAlign: "left" as const,
    textDecoration: "none",
    cursor: "pointer",
  };
}

const badge = {
  display: "inline-block",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.3,
  color: "#FFE9B8",
  background: "#6B1020",
  borderRadius: 999,
  padding: "2px 8px",
  marginTop: 8,
};

// Example image on a card, or the vertical's icon on a soft panel when it has none yet, so every card lines up.
function CardMedia({ industry, url, badgeText }: { industry: IndustryKey; url?: string; badgeText?: string }) {
  return (
    <span style={{ position: "relative", display: "block", width: "100%", aspectRatio: "4 / 3", borderRadius: 8, overflow: "hidden", background: "#f3f1ee" }}>
      {url ? (
        <img src={url} alt="" decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <VerticalIcon industry={industry} />
        </span>
      )}
      {badgeText && <span style={{ ...badge, position: "absolute", top: 8, left: 8, margin: 0 }}>{badgeText}</span>}
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
  const grid = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 };
  const withMedia = Object.values(images ?? {}).some(Boolean);
  const cards = INDUSTRY_KEYS.filter((k) => INDUSTRIES[k].enabled).map((k) => {
    const body = (
      <>
        {withMedia ? <CardMedia industry={k} url={images?.[k]} badgeText={badges?.[k]} /> : <VerticalIcon industry={k} />}
        <span>
          <span style={{ display: "block", fontSize: 17, fontWeight: 700, lineHeight: 1.25 }}>{INDUSTRIES[k].chooserLabel}</span>
          <span style={{ display: "block", color: MUTED, fontSize: 14, lineHeight: 1.35, marginTop: 4 }}>{INDUSTRIES[k].chooserDetail}</span>
          {current === k && <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginTop: 6 }}>What you sell now</span>}
          {!withMedia && badges?.[k] && <span style={badge}>{badges[k]}</span>}
        </span>
      </>
    );
    return onPick ? (
      <button key={k} type="button" onClick={() => onPick(k)} disabled={disabled} aria-pressed={selected === undefined ? undefined : selected === k} style={verticalCard(selected === k)}>
        {body}
      </button>
    ) : (
      <a key={k} href={"/" + INDUSTRIES[k].path + hrefSearch} style={verticalCard(false)}>
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
      <h2 id="business-details" tabIndex={-1} style={{ fontSize: 20, margin: "0 0 6px", outline: "none" }}>{editing ? "Edit your business" : `Set up your ${config.businessNoun}`}</h2>
      <p style={{ color: MUTED, margin: "0 0 4px" }}>
        {editing
          ? "Changes show on the next ads you make."
          : greeting
            ? "Your name and contact go on your Diwali greeting, so customers know who it's from. You can change any of this later."
            : "Your name and contact go on every ad. You can change any of this later."}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 6, fontSize: 14, color: MUTED, margin: "0 0 14px" }}>
        {editing ? (
          <>
            <span>
              You sell: <b style={{ color: INK }}>{config.chooserLabel}</b>
            </span>
            {onChangeVertical && (
              <>
                <span aria-hidden="true">·</span>
                <button type="button" onClick={changeVertical} disabled={busy} style={linkButton}>Change what you sell</button>
              </>
            )}
          </>
        ) : (
          onChangeVertical && (
            <button type="button" onClick={changeVertical} disabled={busy} style={linkButton}>
              Not {config.label}? Choose again
            </button>
          )
        )}
      </div>

      <fieldset style={fieldset}>
        <legend style={legend}>Where are your customers?</legend>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {MARKETS.map((m) => (
            <label key={m.key} style={{ ...card(market === m.key), alignItems: "center" }}>
              <input type="radio" name="market" value={m.key} checked={market === m.key} onChange={() => setMarket(m.key)} style={{ ...radio, margin: 0 }} />
              <span style={{ color: INK }}>{m.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label htmlFor="businessName" style={{ fontWeight: 600 }}>Your {config.businessNoun}'s name</label>
      <input
        id="businessName"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        required
        maxLength={60}
        autoComplete="organization"
        placeholder={config.businessNamePlaceholder}
        style={input}
      />
      <p style={hint}>Shown on {shownOn}.</p>

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
        inputStyle={input}
        hintStyle={{ ...hint, marginBottom: 22 }}
      />

      <button type="submit" disabled={busy} style={primary(busy)}>
        {busy ? "Saving…" : editing ? "Save changes" : greeting ? "Continue to your greeting" : "Continue"}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} disabled={busy} style={{ ...linkButton, display: "block", fontSize: 15, marginTop: 6 }}>
          Cancel
        </button>
      )}
      {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
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
      <h2 id="change-vertical" tabIndex={-1} style={{ fontSize: 20, margin: "0 0 6px", outline: "none" }}>Change what you sell</h2>
      <p style={{ color: MUTED, lineHeight: 1.45, margin: "0 0 18px" }}>
        New ads will use the new category's backgrounds and photo tips, and will show <b style={{ color: INK }}>{details.businessName}</b>
        {details.contact && <> and {shownContact(details.contact, details.contactKind)?.text}</>}. Greetings and offers you saved for {INDUSTRIES[current].chooserLabel} are kept and show
        again if you switch back.
      </p>
      <VerticalCards labelledBy="change-vertical" onPick={setNext} selected={next} current={current} disabled={busy} />
      <button type="button" onClick={() => void confirm()} disabled={busy || next === current} style={{ ...primary(busy || next === current), marginTop: 22 }}>
        {busy ? "Saving…" : next === current ? "Pick a new category" : `Switch to ${INDUSTRIES[next].chooserLabel}`}
      </button>
      <button type="button" onClick={onCancel} disabled={busy} style={{ ...linkButton, display: "block", fontSize: 15, marginTop: 6 }}>
        Cancel
      </button>
      {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
    </section>
  );
}
