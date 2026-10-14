/**
 * Transport shared by every client. It knows nothing about React Native, Expo, or Supabase: the host app injects
 * the base URL, the bearer-token getter, and (optionally) fetch. A future watch companion or car bridge can reuse it.
 */

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type HttpClientConfig = {
  baseUrl: () => string;
  getAccessToken: () => Promise<string | null>;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export type HttpClient = {
  fetch: (path: string, init?: RequestInit) => Promise<Response>;
  authorizationHeaders: () => Promise<Record<string, string>>;
};

export function createHttpClient(config: HttpClientConfig): HttpClient {
  const timeoutMs = config.timeoutMs ?? 12_000;

  async function authorizationHeaders(): Promise<Record<string, string>> {
    const token = await config.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function request(path: string, init: RequestInit = {}): Promise<Response> {
    const doFetch = config.fetchImpl ?? fetch;
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    for (const [name, value] of Object.entries(await authorizationHeaders()))
      headers.set(name, value);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    init.signal?.addEventListener('abort', () => controller.abort());

    try {
      const response = await doFetch(`${config.baseUrl()}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });
      if (response.status === 401 || response.status === 403) {
        const text = await response.text().catch(() => '');
        throw new AuthError(
          text || `Authentication required (${response.status})`,
          response.status,
        );
      }
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return { fetch: request, authorizationHeaders };
}

/** Pulls a human-readable message out of an error response (JSON `message`/`error`, else raw text). */
export async function readErrorDetail(response: Response): Promise<string> {
  const text = await response.text().catch(() => '');
  if (!text) return '';
  try {
    const data = JSON.parse(text) as { message?: unknown; error?: unknown };
    const detail = data.message ?? data.error;
    return typeof detail === 'string' ? detail : text;
  } catch {
    return text;
  }
}

/** Parses a JSON body, or throws `"<label>: <server detail>"` so screens can show what went wrong. */
export async function parseJsonOrThrow<T>(response: Response, label: string): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  const detail = await readErrorDetail(response);
  throw new ApiError(
    detail ? `${label}: ${detail}` : `${label} failed: ${response.status}`,
    response.status,
  );
}

/** Like `parseJsonOrThrow` without a label: the error message is the server detail itself. */
export async function parseJson<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  const detail = await readErrorDetail(response);
  throw new ApiError(detail || `Request failed: ${response.status}`, response.status);
}

/** True for localhost and private-LAN hosts, which the app rewrites so devices on the network reach a dev backend. */
export function isLocalOrLanHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^192\.168\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
  );
}
