import { FormEvent, useState } from "react";
import { api, setToken } from "../api";

export function LoginPage({ onSignedIn }: { onSignedIn: () => void }) {
  const [token, setTokenValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (await api.checkToken(token.trim())) {
        setToken(token.trim());
        onSignedIn();
      } else {
        setError("That token doesn't match API_TOKEN on the server.");
      }
    } catch {
      setError("Can't reach the server. Check that it's running.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <form onSubmit={submit}>
        <h1>Meeting Copilot</h1>
        <p className="muted">Enter the access token from your server's API_TOKEN setting.</p>
        <label htmlFor="token">Access token</label>
        <input
          id="token"
          type="password"
          autoComplete="current-password"
          value={token}
          onChange={(e) => setTokenValue(e.target.value)}
          autoFocus
        />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" disabled={busy || !token.trim()}>
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
