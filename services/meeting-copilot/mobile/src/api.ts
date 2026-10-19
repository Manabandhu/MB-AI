/** Small client for the Meeting Copilot API. The server address and token live in the secure store. */
import * as SecureStore from "expo-secure-store";

export interface Session {
  server: string;
  token: string;
}

export interface MeetingRow {
  id: string;
  title: string;
  profile: string;
  started_at: string;
  duration_s: number | null;
  status: string;
  stage: string | null;
  overview: string | null;
  open_action_items: number;
}

export interface MeetingDetail extends MeetingRow {
  error: string | null;
  speakers: { label: string; display_name: string; is_owner: boolean }[];
  segments: { id: number; speaker_label: string; start: number; text: string }[];
  summary: {
    overview: string;
    people: { name: string; yesterday: string[]; today: string[]; blockers: string[] }[];
    decisions: (string | { text: string })[];
    fields?: Record<string, string[] | string>;
    fields_meta?: { key: string; label: string }[];
  } | null;
  action_items: { id: number; owner: string | null; text: string; due: string | null; done: boolean }[];
}

export interface Commitment {
  id: number;
  owner: string | null;
  text: string;
  due: string | null;
  status: string;
  stuck: boolean;
  overdue: boolean;
}

export interface Card {
  id: number | null;
  kind: string;
  trigger_text: string;
  answer: string;
  facts: string[];
  grounded: boolean;
  sources: { n: number; meeting_title: string; started_at: string | null; start: number | null }[];
}

const KEY = "copilot.session";

export async function loadSession(): Promise<Session | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export async function saveSession(s: Session | null) {
  if (s) await SecureStore.setItemAsync(KEY, JSON.stringify(s));
  else await SecureStore.deleteItemAsync(KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function client(s: Session) {
  const base = s.server.replace(/\/$/, "");
  async function call<T>(method: string, path: string, body?: unknown, form?: FormData): Promise<T> {
    let res: Response;
    try {
      res = await fetch(base + path, {
        method,
        headers: { Authorization: `Bearer ${s.token}`, ...(body !== undefined && !form ? { "Content-Type": "application/json" } : {}) },
        body: form ?? (body === undefined ? undefined : JSON.stringify(body)),
      });
    } catch {
      throw new ApiError(0, `Can't reach ${base}. Check the address and your connection.`);
    }
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const data = await res.json();
        detail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
      } catch {
        /* not JSON */
      }
      throw new ApiError(res.status, res.status === 401 ? "The token was rejected. Sign in again." : detail);
    }
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  }
  return {
    check: () => call<{ owner_name: string; profiles: { key: string; label: string }[] }>("GET", "/api/config"),
    meetings: () => call<MeetingRow[]>("GET", "/api/meetings"),
    meeting: (id: string) => call<MeetingDetail>("GET", `/api/meetings/${id}`),
    createMeeting: (title: string, profile: string, attendees: string[]) =>
      call<MeetingDetail>("POST", "/api/meetings", {
        title,
        profile,
        attendees,
        channel_layout: "mono",
        consent_confirmed: true,
        consent_method: "verbal",
        source: "mobile",
      }),
    upload: (id: string, uri: string) => {
      const form = new FormData();
      // React Native's FormData takes a file descriptor object for local files.
      form.append("file", { uri, name: "recording.m4a", type: "audio/m4a" } as unknown as Blob);
      return call<MeetingDetail>("PUT", `/api/meetings/${id}/audio`, undefined, form);
    },
    setActionItem: (id: number, done: boolean) => call("PATCH", `/api/action-items/${id}`, { done }),
    commitments: () => call<Commitment[]>("GET", "/api/commitments?mine=true"),
    closeCommitment: (id: number) => call("PATCH", `/api/commitments/${id}`, { status: "done" }),
    ask: (question: string) =>
      call<{ answer: string; grounded: boolean; sources: { n: number; meeting_title: string; started_at: string | null; start: number | null }[] }>(
        "POST",
        "/api/chat",
        { question, history: [] },
      ),
    liveUrl: (meetingId: string) => {
      const ws = base.replace(/^http/, "ws");
      return `${ws}/api/live/${meetingId}?token=${encodeURIComponent(s.token)}&role=view`;
    },
  };
}

export type Client = ReturnType<typeof client>;

export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
