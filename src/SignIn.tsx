import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"email" | { email: string }>("email");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const formData = new FormData(event.currentTarget);
    try {
      await signIn("resend-otp", formData);
      if (step === "email") setStep({ email: formData.get("email") as string });
    } catch {
      setError(step === "email" ? "Couldn't send the code. Check the email and try again." : "That code didn't work. Check it and try again.");
    } finally {
      setBusy(false);
    }
  }

  const input = { display: "block", width: "100%", padding: 12, fontSize: 16, margin: "8px 0 12px", boxSizing: "border-box" as const };
  const button = { padding: "12px 20px", fontSize: 16, cursor: "pointer" };

  return step === "email" ? (
    <form onSubmit={submit}>
      <label htmlFor="email">Your work email</label>
      <input id="email" name="email" type="email" autoComplete="email" required style={input} />
      <button type="submit" disabled={busy} style={button}>{busy ? "Sending…" : "Send me a code"}</button>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </form>
  ) : (
    <form onSubmit={submit}>
      <p>We sent a 6-digit code to <b>{step.email}</b>.</p>
      <label htmlFor="code">Code</label>
      <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" required style={input} />
      <input name="email" type="hidden" value={step.email} />
      <button type="submit" disabled={busy} style={button}>{busy ? "Checking…" : "Sign in"}</button>{" "}
      <button type="button" onClick={() => setStep("email")} style={{ ...button, background: "none", border: "none" }}>Use a different email</button>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </form>
  );
}
