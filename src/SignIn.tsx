import { useEffect, useId, useRef, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Icon } from "./Icons";
import { color, text } from "./theme";

// The address a code was sent to, kept for this tab so a reload (or a trip to the email app) comes back to the code step.
const PENDING_KEY = "mmv-signin";
const PENDING_MS = 15 * 60 * 1000;
const RESEND_MS = 30 * 1000;

type Pending = { email: string; at: number };

function readPending(): Pending | null {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? "null");
    if (!parsed || typeof parsed !== "object") return null;
    const { email, at } = parsed as Partial<Pending>;
    if (typeof email !== "string" || typeof at !== "number") return null;
    const age = Date.now() - at;
    return age >= 0 && age < PENDING_MS ? { email, at } : null;
  } catch {
    return null;
  }
}

function writePending(email: string, at: number) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ email, at }));
  } catch {}
}

function clearPending() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {}
}

// True when a code was sent from this tab less than 15 minutes ago.
export function hasPendingCode(): boolean {
  return readPending() !== null;
}

// Looks come from the shared classes in theme.ts (GLOBAL_CSS): .mmv-btn while busy uses its disabled style.
export default function SignIn({
  heading = "Sign in or create your account",
  intro = "We'll email you a 6-digit code. No password needed.",
  autoFocus = false,
}: {
  heading?: string;
  intro?: string;
  autoFocus?: boolean;
}) {
  const { signIn } = useAuthActions();
  const ids = useId();
  // Read once: a code sent less than 15 minutes ago opens straight on the code step.
  const [pending] = useState(readPending);
  const [step, setStep] = useState<"email" | "code">(pending ? "code" : "email");
  const [email, setEmail] = useState(pending?.email ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  // "Send a new code" unlocks at resendAt; now ticks once a second until then.
  const [resendAt, setResendAt] = useState(() => (pending ? pending.at + RESEND_MS : 0));
  const [now, setNow] = useState(Date.now);
  const formRef = useRef<HTMLFormElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  // Stops a second submit (the auto-submit plus a tap on Sign in) while one is running.
  const running = useRef(false);

  const secondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000));
  useEffect(() => {
    const wait = resendAt - now;
    if (step !== "code" || wait <= 0) return;
    // Lands on the next whole second, so the number steps down evenly.
    const timer = window.setTimeout(() => setNow(Date.now()), wait % 1000 || 1000);
    return () => window.clearTimeout(timer);
  }, [step, resendAt, now]);

  const startCountdown = (at: number) => {
    setResendAt(at + RESEND_MS);
    setNow(at);
  };

  async function sendEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (running.current) return;
    running.current = true;
    const typed = email.trim();
    setError(null);
    setBusy(true);
    try {
      await signIn("resend-otp", { email: typed });
      const at = Date.now();
      writePending(typed, at);
      setEmail(typed);
      setCode("");
      setNote(null);
      setStep("code");
      startCountdown(at);
    } catch {
      setError("Couldn't send the code. Check the email and try again.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  async function sendCode(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (running.current) return;
    running.current = true;
    setError(null);
    setNote(null);
    setBusy(true);
    // A correct code keeps "Checking…" until the parent sees the sign-in and hides this step.
    let ok = false;
    try {
      const { signingIn } = await signIn("resend-otp", { email, code });
      if (!signingIn) throw new Error("Not signed in");
      clearPending();
      ok = true;
    } catch {
      setError("That code didn't work. Check it and try again.");
      setCode("");
      codeRef.current?.focus();
    } finally {
      running.current = false;
      if (!ok) setBusy(false);
    }
  }

  // Sends itself once all 6 digits are in.
  useEffect(() => {
    if (step !== "code" || code.length !== 6 || running.current) return;
    const form = formRef.current;
    if (typeof form?.requestSubmit === "function") form.requestSubmit();
    else void sendCode();
    // sendCode is left out of the list on purpose: it is recreated every render and reads the current code.
  }, [step, code]);

  async function resend() {
    setError(null);
    setNote(null);
    setResending(true);
    try {
      await signIn("resend-otp", { email });
      const at = Date.now();
      writePending(email, at);
      startCountdown(at);
      setNote("New code sent.");
    } catch {
      setError("Couldn't send a new code. Try again in a moment.");
    } finally {
      setResending(false);
    }
  }

  function changeEmail() {
    clearPending();
    setStep("email");
    setCode("");
    setError(null);
    setNote(null);
    requestAnimationFrame(() => emailRef.current?.focus());
  }

  return step === "email" ? (
    <form onSubmit={sendEmail}>
      <h2 style={{ ...text.heading, margin: "0 0 4px" }}>{heading}</h2>
      <p style={{ fontSize: 15, lineHeight: 1.45, color: color.muted, margin: "0 0 20px" }}>{intro}</p>
      <label htmlFor={ids + "email"} className="mmv-label">Your email</label>
      <input
        ref={emailRef}
        id={ids + "email"}
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoFocus={autoFocus}
        inputMode="email"
        autoCapitalize="none"
        autoComplete="email"
        required
        className="mmv-input"
      />
      <button type="submit" disabled={busy} className="mmv-btn" style={{ marginTop: 16 }}>{busy ? "Sending…" : "Send me a code"}</button>
      {error && <p role="alert" className="mmv-error" style={{ marginTop: 12 }}><Icon name="alert" size={18} />{error}</p>}
    </form>
  ) : (
    <form ref={formRef} onSubmit={(e) => void sendCode(e)}>
      <p style={{ fontSize: 15, lineHeight: 1.45, color: color.ink, margin: "0 0 6px", overflowWrap: "anywhere" }}>
        We sent a 6-digit code to <b>{email}</b>. It's also in the email's subject line, so you can read it from the notification.
      </p>
      <p style={{ ...text.small, color: color.muted, margin: "0 0 16px" }}>It usually arrives within a minute. Not there? Check Spam or Promotions.</p>
      <label htmlFor={ids + "code"} className="mmv-label">Code</label>
      <input
        ref={codeRef}
        id={ids + "code"}
        name="code"
        value={code}
        // Digits only, first 6, so a code typed or pasted with a space still fits.
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        // maxLength would cut a pasted "123 456" short before onChange sees it, so paste is read here.
        onPaste={(e) => {
          const digits = e.clipboardData.getData("text").replace(/\D/g, "");
          if (!digits) return;
          e.preventDefault();
          setCode(digits.slice(0, 6));
        }}
        autoFocus
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        required
        className="mmv-input mmv-input--code"
      />
      <button type="submit" disabled={busy} className="mmv-btn" style={{ marginTop: 16 }}>{busy ? "Checking…" : "Sign in"}</button>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 16, marginTop: 8 }}>
        <button
          type="button"
          onClick={() => void resend()}
          disabled={secondsLeft > 0 || resending}
          className={secondsLeft > 0 ? "mmv-link mmv-link--muted mmv-num" : "mmv-link mmv-num"}
        >
          {secondsLeft > 0 ? `Send a new code in ${secondsLeft} s` : resending ? "Sending…" : "Send a new code"}
        </button>
        <button type="button" onClick={changeEmail} disabled={busy} className="mmv-link">Use a different email</button>
      </div>
      {note && <p role="status" className="mmv-status mmv-status--done" style={{ marginTop: 8 }}><Icon name="check" size={16} />{note}</p>}
      {error && <p role="alert" className="mmv-error" style={{ marginTop: 12 }}><Icon name="alert" size={18} />{error}</p>}
    </form>
  );
}
