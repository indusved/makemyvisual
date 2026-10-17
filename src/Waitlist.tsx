import { useEffect, useId, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../convex/_generated/api";
import { SEASON, type IndustryKey } from "../convex/industries";
import { Icon } from "./Icons";
import { color, text } from "./theme";

// Remembered for this tab only, so a reload keeps the thank-you line.
const DONE_KEY = "mmv-waitlist-done";
// Same simple check as convex/waitlist.ts.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// "Sunday, 8 November", read from SEASON so the date never drifts from the home page's date line.
const DIWALI_DAY = SEASON.dateLabel.replace(/^Diwali is on /, "");

function readDone(): boolean {
  try {
    return sessionStorage.getItem(DONE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDone() {
  try {
    sessionStorage.setItem(DONE_KEY, "1");
  } catch {}
}

// "Remind me before Diwali": one email drop for guests who aren't ready to make anything yet.
// Never a signup: it makes no account and no business profile. Only rendered for signed-out visitors,
// outside the maker. Its button is the outlined secondary one, so the page keeps one solid ink button.
export default function Waitlist({ source, industry }: { source: "home" | "category"; industry?: IndustryKey }) {
  const join = useMutation(api.waitlist.join);
  const ids = useId();
  const [done, setDone] = useState(readDone);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Goes up on every failed submit. Used as the alert's key so a repeated, identical error is a fresh alert
  // that screen readers announce again (otherwise the unchanged text is silent).
  const [errorCount, setErrorCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLParagraphElement>(null);
  // Stops a second submit while one is running.
  const running = useRef(false);
  // True only when the thank-you replaced the form just now (not after a reload), so focus moves to it.
  const justDone = useRef(false);

  useEffect(() => {
    if (done && justDone.current) {
      justDone.current = false;
      doneRef.current?.focus();
    }
  }, [done]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (running.current) return;
    const typed = email.trim();
    const problem = !typed ? "Please type your email." : typed.length > 254 || !EMAIL_RE.test(typed) ? "Please type a valid email address." : null;
    if (problem) {
      setError(problem);
      setErrorCount((n) => n + 1);
      inputRef.current?.focus();
      return;
    }
    running.current = true;
    setError(null);
    setBusy(true);
    try {
      await join({ email: typed, source, ...(industry ? { industry } : {}) });
      writeDone();
      justDone.current = true;
      setDone(true);
    } catch (e) {
      setError(e instanceof ConvexError ? String(e.data) : "Couldn't save your email. Please try again.");
      setErrorCount((n) => n + 1);
      inputRef.current?.focus();
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  const errorId = ids + "error";
  return (
    <section aria-labelledby={ids + "title"}>
      <h2 id={ids + "title"} style={{ ...text.heading, margin: "0 0 4px" }}>Not ready yet?</h2>
      <p style={{ color: color.muted, fontSize: 15, lineHeight: 1.45, margin: "0 0 16px" }}>
        Get one email reminder before Diwali ({DIWALI_DAY}). Nothing else.
      </p>
      {done ? (
        <p ref={doneRef} tabIndex={-1} role="status" className="mmv-status mmv-status--done" style={{ fontSize: 15, outline: "none" }}>
          <Icon name="check" size={16} />
          You're on the list. We'll email you once before Diwali.
        </p>
      ) : (
        <form onSubmit={(e) => void submit(e)} noValidate>
          <label htmlFor={ids + "email"} className="mmv-label">Your email</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <input
              ref={inputRef}
              id={ids + "email"}
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
              autoCapitalize="none"
              autoComplete="email"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className="mmv-input"
              style={{ flex: "1 1 200px", width: "auto", minWidth: 0 }}
            />
            <button type="submit" disabled={busy} className="mmv-btn2" style={{ flex: "none", minHeight: 50 }}>
              {busy ? "Saving…" : "Remind me"}
            </button>
          </div>
          {error && (
            <p key={errorCount} id={errorId} role="alert" className="mmv-error" style={{ marginTop: 8 }}>
              <Icon name="alert" size={18} />
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
