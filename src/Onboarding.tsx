import { useState } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../convex/_generated/api";
import { INDUSTRIES, INDUSTRY_KEYS, type IndustryKey } from "../convex/industries";
import { VerticalIcon } from "./Brand";

type Market = "IN" | "US";
export type BusinessDetails = { market: Market; businessName: string; contact?: string };

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
const button = { padding: "12px 20px", fontSize: 16, minHeight: 44, cursor: "pointer" };
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

// One card per vertical, two to a row. Links to the vertical's page, or buttons when onPick is given.
export function VerticalCards({
  labelledBy,
  onPick,
  selected,
  current,
  disabled,
}: {
  labelledBy: string;
  onPick?: (industry: IndustryKey) => void;
  selected?: IndustryKey;
  current?: IndustryKey;
  disabled?: boolean;
}) {
  const grid = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 };
  const cards = INDUSTRY_KEYS.filter((k) => INDUSTRIES[k].enabled).map((k) => {
    const body = (
      <>
        <VerticalIcon industry={k} />
        <span>
          <span style={{ display: "block", fontSize: 17, fontWeight: 700, lineHeight: 1.25 }}>{INDUSTRIES[k].chooserLabel}</span>
          <span style={{ display: "block", color: MUTED, fontSize: 14, lineHeight: 1.35, marginTop: 4 }}>{INDUSTRIES[k].chooserDetail}</span>
          {current === k && <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginTop: 6 }}>What you sell now</span>}
        </span>
      </>
    );
    return onPick ? (
      <button key={k} type="button" onClick={() => onPick(k)} disabled={disabled} aria-pressed={selected === undefined ? undefined : selected === k} style={verticalCard(selected === k)}>
        {body}
      </button>
    ) : (
      <a key={k} href={"/" + INDUSTRIES[k].path} style={verticalCard(false)}>
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
}: {
  industry: IndustryKey;
  initial: BusinessDetails;
  onSaved?: () => void;
  onCancel?: () => void;
  // Gets what is typed now, so switching vertical from the edit form doesn't drop unsaved edits.
  onChangeVertical?: (typed: BusinessDetails) => void;
}) {
  const save = useMutation(api.profiles.save);
  const [market, setMarket] = useState<Market>(initial.market);
  const [businessName, setBusinessName] = useState(initial.businessName);
  const [contact, setContact] = useState(initial.contact ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const editing = Boolean(onCancel);
  const config = INDUSTRIES[industry];
  const changeVertical = () =>
    onChangeVertical?.({ market, businessName: businessName.trim() ? businessName : initial.businessName, contact: contact.trim() || undefined });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!businessName.trim()) return setError(`Please type your ${config.businessNoun}'s name.`);
    setBusy(true);
    try {
      await save({ industry, market, businessName, contact: contact.trim() || undefined });
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
        {editing ? "Changes show on the next ads you make." : "Your name and contact go on every ad. You can change any of this later."}
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
      <p style={hint}>Shown on your ads.</p>

      <label htmlFor="contact" style={{ fontWeight: 600 }}>
        Phone, website or Instagram (shown on your ads) <span style={{ color: MUTED, fontWeight: 400 }}>· optional</span>
      </label>
      <input
        id="contact"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        maxLength={60}
        placeholder={config.contactPlaceholder}
        style={{ ...input, marginBottom: 22 }}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <button type="submit" disabled={busy} style={button}>
          {busy ? "Saving…" : editing ? "Save changes" : "Continue"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={busy} style={{ ...button, background: "none", border: "none", textDecoration: "underline" }}>
            Cancel
          </button>
        )}
      </div>
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
      await save({ industry: next, market: details.market, businessName: details.businessName, contact: details.contact });
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
        {details.contact && <> and {details.contact}</>}. Offers you saved for {INDUSTRIES[current].chooserLabel} are kept and show again if you
        switch back.
      </p>
      <VerticalCards labelledBy="change-vertical" onPick={setNext} selected={next} current={current} disabled={busy} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 22 }}>
        <button type="button" onClick={() => void confirm()} disabled={busy || next === current} style={button}>
          {busy ? "Saving…" : next === current ? "Pick a new category" : `Switch to ${INDUSTRIES[next].chooserLabel}`}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} style={{ ...button, background: "none", border: "none", textDecoration: "underline" }}>
          Cancel
        </button>
      </div>
      {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
    </section>
  );
}
