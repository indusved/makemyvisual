import type { CSSProperties, RefObject } from "react";
import { CONTACT_KINDS, INDUSTRIES, type ContactKind, type IndustryKey } from "../convex/industries";
import { CONTACT_ICON, CONTACT_LABEL, guessContactKind } from "./contact";

const INK = "#111317";
const MUTED = "#5b6170";
const INPUT_MODE: Record<ContactKind, "text" | "tel" | "url"> = { instagram: "text", whatsapp: "tel", website: "url" };
// Icon beside the word; on phones narrower than 375px all three put the icon above the word, so none overflows.
const KIND_CSS =
  ".mmv-contact-kind{display:inline-flex;align-items:center;justify-content:center;gap:4px}" +
  "@media (max-width:374px){.mmv-contact-kind{flex-direction:column;gap:2px}}";

// The same icon the visuals draw. Named for screen readers when label is given, otherwise hidden.
export function ContactIcon({ kind, size = 18, label }: { kind: ContactKind; size?: number; label?: string }) {
  const icon = CONTACT_ICON[kind];
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };
  return (
    <svg {...a11y} width={size} height={size} viewBox="2 2 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, verticalAlign: "-0.2em" }}>
      <path d={icon.lines} />
      {icon.bold && <path d={icon.bold} strokeWidth="3.4" />}
      {icon.dots && <path d={icon.dots} fill="currentColor" stroke="none" />}
    </svg>
  );
}

// Same look as the greeting/offer switch on the form, a little smaller so three fit across a phone.
function kindButton(selected: boolean): CSSProperties {
  return {
    minWidth: 0,
    minHeight: 44,
    padding: "6px 3px",
    borderRadius: 10,
    fontSize: 14,
    fontFamily: "inherit",
    lineHeight: 1.2,
    color: INK,
    cursor: "pointer",
    border: selected ? `2px solid ${INK}` : "1px solid #d5d8de",
    background: selected ? "#FFF6D6" : "#fff",
    fontWeight: selected ? 600 : 400,
  };
}

// "Where customers can find you": Instagram · WhatsApp · Website above one box, used by the maker
// form and Edit business. Until a button is tapped (picked), typing a number or a link picks the
// matching kind by itself; after that only the buttons change it.
export default function ContactField({
  id,
  industry,
  contact,
  kind,
  picked,
  onContact,
  onKind,
  inputRef,
  inputStyle,
  hintStyle,
}: {
  id: string;
  industry: IndustryKey;
  contact: string;
  kind: ContactKind;
  picked: boolean;
  onContact: (text: string) => void;
  // tapped: a button was used (by touch, click or arrow keys), not a guess from the typing.
  onKind: (kind: ContactKind, tapped: boolean) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  inputStyle: CSSProperties;
  hintStyle: CSSProperties;
}) {
  const examples = INDUSTRIES[industry].contactExamples;

  function type(text: string) {
    onContact(text);
    const guess = picked ? null : guessContactKind(text);
    if (guess && guess !== kind) onKind(guess, false);
  }

  function onKey(event: React.KeyboardEvent<HTMLButtonElement>) {
    const step = ({ ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 } as Record<string, number>)[event.key];
    if (!step) return;
    event.preventDefault();
    const next = CONTACT_KINDS[(CONTACT_KINDS.indexOf(kind) + step + CONTACT_KINDS.length) % CONTACT_KINDS.length];
    onKind(next, true);
    event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-contact="${next}"]`)?.focus();
  }

  return (
    <>
      <style>{KIND_CSS}</style>
      <label htmlFor={id} style={{ display: "block", fontWeight: 600 }}>
        Where customers can find you <span style={{ color: MUTED, fontWeight: 400 }}>· optional</span>
      </label>
      <div role="radiogroup" aria-label="Contact type" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 8 }}>
        {CONTACT_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            tabIndex={kind === k ? 0 : -1}
            data-contact={k}
            onClick={() => onKind(k, true)}
            onKeyDown={onKey}
            className="mmv-contact-kind"
            style={kindButton(kind === k)}
          >
            <ContactIcon kind={k} size={16} />
            {CONTACT_LABEL[k]}
          </button>
        ))}
      </div>
      <input
        id={id}
        ref={inputRef}
        value={contact}
        onChange={(e) => type(e.target.value)}
        maxLength={60}
        placeholder={`e.g. ${examples[kind]}`}
        inputMode={INPUT_MODE[kind]}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        aria-describedby={`${id}-hint`}
        style={{ ...inputStyle, marginTop: 8 }}
      />
      <p id={`${id}-hint`} style={hintStyle}>
        Shown on your greetings and ads with the {kind === "website" ? "website" : CONTACT_LABEL[kind]} icon.
      </p>
    </>
  );
}
