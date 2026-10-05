import { useState } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../convex/_generated/api";
import { INDUSTRIES, INDUSTRY_KEYS, type IndustryKey } from "../convex/industries";

type Market = "IN" | "US";
type BusinessDetails = { industry: IndustryKey; market: Market; businessName: string; contact?: string };

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

export default function Onboarding({
  initial,
  onSaved,
  onCancel,
  onIndustryChange,
}: {
  initial: BusinessDetails;
  onSaved?: () => void;
  onCancel?: () => void;
  onIndustryChange?: (industry: IndustryKey) => void;
}) {
  const save = useMutation(api.profiles.save);
  const [industry, setIndustry] = useState<IndustryKey>(initial.industry);
  const [market, setMarket] = useState<Market>(initial.market);
  const [businessName, setBusinessName] = useState(initial.businessName);
  const [contact, setContact] = useState(initial.contact ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const editing = Boolean(onCancel);
  const config = INDUSTRIES[industry];

  function pickIndustry(k: IndustryKey) {
    setIndustry(k);
    onIndustryChange?.(k);
  }

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
      <h2 style={{ fontSize: 20, margin: "0 0 6px" }}>{editing ? "Edit your business" : "Set up your business"}</h2>
      <p style={{ color: MUTED, margin: "0 0 22px" }}>
        {editing ? "Changes show on the next ads you make." : "Your business name goes on every ad. You can change any of this later."}
      </p>

      <fieldset style={fieldset}>
        <legend style={legend}>What do you sell?</legend>
        <div style={{ display: "grid", gap: 10 }}>
          {INDUSTRY_KEYS.filter((k) => INDUSTRIES[k].enabled).map((k) => (
            <label key={k} style={card(industry === k)}>
              <input type="radio" name="industry" value={k} checked={industry === k} onChange={() => pickIndustry(k)} style={radio} />
              <span>
                <span style={{ display: "block", fontWeight: 700, color: INK }}>{INDUSTRIES[k].chooserLabel}</span>
                <span style={{ display: "block", color: MUTED, fontSize: 14, marginTop: 2 }}>{INDUSTRIES[k].chooserDetail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

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
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </form>
  );
}
