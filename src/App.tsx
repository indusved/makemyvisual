import { Authenticated, Unauthenticated, AuthLoading, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import SignIn from "./SignIn";
import NewAd from "./NewAd";

export default function App() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 560, margin: "64px auto", padding: "0 16px" }}>
      <h1>Showroom Ads</h1>
      <p>Upload your car photo, type your offer, get ads in every social size in 2 minutes.</p>
      <AuthLoading>
        <p>Loading…</p>
      </AuthLoading>
      <Unauthenticated>
        <SignIn />
      </Unauthenticated>
      <Authenticated>
        <SignedIn />
      </Authenticated>
    </main>
  );
}

function SignedIn() {
  const viewer = useQuery(api.users.viewer);
  const { signOut } = useAuthActions();
  return (
    <div>
      <p style={{ color: "#666" }}>
        Signed in as <b>{viewer?.email ?? "…"}</b>{" "}
        <button onClick={() => void signOut()} style={{ background: "none", border: "none", textDecoration: "underline", cursor: "pointer", color: "inherit" }}>Sign out</button>
      </p>
      <NewAd />
    </div>
  );
}
