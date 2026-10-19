/**
 * Single sign-on with any OIDC provider (Keycloak, Cognito, Entra ID, Okta): authorization code + PKCE,
 * as a public client. The ID token (audience = this client) is the bearer token for the API.
 * When it expires, the next API call returns 401 and the sign-in page offers SSO again.
 */

const KEY = "copilot.oidc";

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  arr.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function random(n = 32): string {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return b64url(a);
}

async function discovery(issuer: string) {
  const res = await fetch(`${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error("Couldn't reach the sign-in provider.");
  return (await res.json()) as { authorization_endpoint: string; token_endpoint: string };
}

export const redirectUri = () => `${location.origin}/auth/callback`;

export async function startSso(cfg: { issuer: string; client_id: string; scopes: string }) {
  const d = await discovery(cfg.issuer);
  const verifier = random(48);
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  const state = random(16);
  sessionStorage.setItem(KEY, JSON.stringify({ verifier, state, token_endpoint: d.token_endpoint, client_id: cfg.client_id }));
  const params = new URLSearchParams({
    response_type: "code",
    client_id: cfg.client_id,
    redirect_uri: redirectUri(),
    scope: cfg.scopes,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });
  location.assign(`${d.authorization_endpoint}?${params}`);
}

/** On /auth/callback: exchange the code for tokens. Returns the bearer token. */
export async function finishSso(): Promise<string> {
  const q = new URLSearchParams(location.search);
  const saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
  sessionStorage.removeItem(KEY);
  if (q.get("error")) throw new Error(q.get("error_description") || q.get("error") || "Sign-in was cancelled.");
  if (!saved || q.get("state") !== saved.state || !q.get("code")) throw new Error("This sign-in link is no longer valid.");
  const res = await fetch(saved.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: q.get("code")!,
      redirect_uri: redirectUri(),
      client_id: saved.client_id,
      code_verifier: saved.verifier,
    }),
  });
  if (!res.ok) throw new Error("The sign-in provider refused the code.");
  const tokens = await res.json();
  const token = tokens.id_token || tokens.access_token;
  if (!token) throw new Error("The sign-in provider returned no token.");
  return token;
}
