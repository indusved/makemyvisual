import { Authenticated, Unauthenticated, AuthLoading, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import SignIn from "./SignIn";

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
      <p>Signed in as <b>{viewer?.email ?? "…"}</b>. Ad maker coming soon.</p>
      <button onClick={() => void signOut()} style={{ padding: "8px 16px" }}>Sign out</button>
    </div>
  );
}
