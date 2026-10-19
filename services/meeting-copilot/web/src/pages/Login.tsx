import { FormEvent, useEffect, useState } from "react";
import { api, setToken } from "../api";
import { startSso } from "../lib/oidc";
import type { AuthConfig } from "../types";

export function LoginPage({ onSignedIn }: { onSignedIn: () => void }) {
  const [token, setTokenValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [auth, setAuth] = useState<AuthConfig | null>(null);

  useEffect(() => {
    api
      .authConfig()
      .then(setAuth)
      .catch(() => setAuth({ token: true, oidc: null }));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (await api.checkToken(token.trim())) {
        setToken(token.trim());
        onSignedIn();
      } else {
        setError("That token wasn't accepted. Use API_TOKEN from the server or a personal token from Settings.");
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
        {auth?.oidc && (
          <>
            <button
              type="button"
              className="button primary sso"
              onClick={() => startSso(auth.oidc!).catch((e) => setError(String(e.message ?? e)))}
            >
              Sign in with your company account
            </button>
            <p className="muted or">or use an access token</p>
          </>
        )}
        {!auth?.oidc && <p className="muted">Enter your access token: the server's API_TOKEN, or a personal token from Settings.</p>}
        <label htmlFor="token">Access token</label>
        <input
          id="token"
          type="password"
          autoComplete="current-password"
          value={token}
          onChange={(e) => setTokenValue(e.target.value)}
          autoFocus={!auth?.oidc}
        />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button" disabled={busy || !token.trim()}>
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
