import type { ActionItem, AppConfig, ChatResponse, MeetingDetail, MeetingListItem } from "./types";

const TOKEN_KEY = "copilot.token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable: the token lives for this page load only */
  }
  memoryToken = token;
}

let memoryToken: string | null = getToken();

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();
export function onUnauthorized(fn: Listener) {
  unauthorizedListeners.add(fn);
  return () => {
    unauthorizedListeners.delete(fn);
  };
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (memoryToken) headers.Authorization = `Bearer ${memoryToken}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check that it's running and your network connection.");
  }
  if (res.status === 401) {
    unauthorizedListeners.forEach((fn) => fn());
    throw new ApiError(401, "Your access token was rejected. Sign in again.");
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    } catch {
      /* not JSON */
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Upload with progress (fetch has no upload progress events). */
function uploadAudio(meetingId: string, file: Blob, filename: string, onProgress?: (fraction: number) => void) {
  return new Promise<MeetingDetail>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `/api/meetings/${meetingId}/audio`);
    if (memoryToken) xhr.setRequestHeader("Authorization", `Bearer ${memoryToken}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
      else {
        let detail = xhr.statusText;
        try {
          detail = JSON.parse(xhr.responseText).detail ?? detail;
        } catch {
          /* not JSON */
        }
        reject(new ApiError(xhr.status, detail));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, "The upload was interrupted. Check your connection and try again."));
    const form = new FormData();
    form.append("file", file, filename);
    xhr.send(form);
  });
}

export interface NewMeeting {
  title: string;
  profile: string;
  started_at?: string;
  attendees?: string[];
  channel_layout: "mic_system" | "mono";
  consent_confirmed: boolean;
}

export const api = {
  config: () => request<AppConfig>("GET", "/api/config"),
  meetings: (q?: string) => request<MeetingListItem[]>("GET", `/api/meetings${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  meeting: (id: string) => request<MeetingDetail>("GET", `/api/meetings/${id}`),
  createMeeting: (m: NewMeeting) => request<MeetingDetail>("POST", "/api/meetings", m),
  updateMeeting: (id: string, patch: { title?: string; profile?: string }) =>
    request<MeetingDetail>("PATCH", `/api/meetings/${id}`, patch),
  deleteMeeting: (id: string) => request<void>("DELETE", `/api/meetings/${id}`),
  uploadAudio,
  reprocess: (id: string, stage: "full" | "summarize") =>
    request<MeetingDetail>("POST", `/api/meetings/${id}/reprocess`, { stage }),
  renameSpeaker: (id: string, label: string, display_name: string) =>
    request("PATCH", `/api/meetings/${id}/speakers/${label}`, { display_name }),
  mergeSpeakers: (id: string, from_label: string, into_label: string) =>
    request<MeetingDetail>("POST", `/api/meetings/${id}/speakers/merge`, { from_label, into_label }),
  audioUrl: (id: string) => request<{ url: string }>("GET", `/api/meetings/${id}/audio-url`),
  actionItems: (openOnly = true) => request<ActionItem[]>("GET", `/api/action-items?open_only=${openOnly}`),
  setActionItem: (id: number, done: boolean) => request<ActionItem>("PATCH", `/api/action-items/${id}`, { done }),
  chat: (question: string, history: { role: "user" | "assistant"; content: string }[], since?: string, until?: string) =>
    request<ChatResponse>("POST", "/api/chat", { question, history, since: since || null, until: until || null }),
  checkToken: async (token: string) => {
    const res = await fetch("/api/config", { headers: { Authorization: `Bearer ${token}` } });
    return res.ok;
  },
};
