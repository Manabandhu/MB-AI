import type {
  ActionItem,
  ApiTokenRow,
  AppConfig,
  AuditEntry,
  AuthConfig,
  Brief,
  CalendarEventRow,
  ChatResponse,
  Commitment,
  CustomProfile,
  Decision,
  Digest,
  DocumentRow,
  Entity,
  Gate,
  GlossaryTerm,
  Integrations,
  JiraDraft,
  LiveCard,
  LiveMetrics,
  Me,
  MeetingDetail,
  MeetingListItem,
  Member,
  Person,
  RadarItem,
  Rehearsal,
  Rollup,
  SpeakerMetrics,
  StandupDraft,
  Workspace,
} from "./types";

const TOKEN_KEY = "copilot.token";
const WORKSPACE_KEY = "copilot.workspace";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* storage unavailable: the value lives for this page load only */
  }
}

export function getToken(): string | null {
  return read(TOKEN_KEY);
}

export function setToken(token: string | null) {
  write(TOKEN_KEY, token);
  memoryToken = token;
}

/** The shared workspace to act in; null means your personal one. */
export function getWorkspace(): string | null {
  return memoryWorkspace;
}

export function setWorkspace(id: string | null) {
  write(WORKSPACE_KEY, id);
  memoryWorkspace = id;
}

let memoryToken: string | null = getToken();
let memoryWorkspace: string | null = read(WORKSPACE_KEY);

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

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (memoryToken) headers.Authorization = `Bearer ${memoryToken}`;
  if (memoryWorkspace) headers["X-Workspace-Id"] = memoryWorkspace;
  return headers;
}

async function errorDetail(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
  } catch {
    return res.statusText;
  }
}

async function send(method: string, path: string, body?: unknown, form?: FormData): Promise<Response> {
  const headers = authHeaders();
  if (body !== undefined && !form) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(path, { method, headers, body: form ?? (body === undefined ? undefined : JSON.stringify(body)) });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check that it's running and your network connection.");
  }
  if (res.status === 401) {
    unauthorizedListeners.forEach((fn) => fn());
    throw new ApiError(401, "Your sign-in was rejected or has expired. Sign in again.");
  }
  if (res.status === 403 && memoryWorkspace && (await res.clone().text()).includes("not a member")) {
    setWorkspace(null); // removed from that workspace: fall back to your personal one
  }
  if (!res.ok) throw new ApiError(res.status, await errorDetail(res));
  return res;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await send(method, path, body);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function text(path: string): Promise<string> {
  return (await send("GET", path)).text();
}

/** Upload with progress (fetch has no upload progress events). */
function uploadAudio(meetingId: string, file: Blob, filename: string, onProgress?: (fraction: number) => void) {
  return new Promise<MeetingDetail>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `/api/meetings/${meetingId}/audio`);
    for (const [k, v] of Object.entries(authHeaders())) xhr.setRequestHeader(k, v);
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
  channel_layout?: "mic_system" | "mono";
  consent_confirmed: boolean;
  consent_method?: "tap" | "verbal" | "bot_notice" | "written";
  source?: string;
  local_only?: boolean;
  links?: { title: string; url: string }[];
  meeting_url?: string;
}

const qs = (params: Record<string, string | number | boolean | null | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const api = {
  // account and workspace
  authConfig: async (): Promise<AuthConfig> => (await fetch("/api/auth-config")).json(),
  config: () => request<AppConfig>("GET", "/api/config"),
  me: () => request<Me>("GET", "/api/me"),
  updateMe: (patch: { display_name?: string; aliases?: string[]; watched_keywords?: string[] }) =>
    request<Me>("PATCH", "/api/me", patch),
  tokens: () => request<ApiTokenRow[]>("GET", "/api/tokens"),
  createToken: (name: string) => request<ApiTokenRow>("POST", "/api/tokens", { name }),
  revokeToken: (id: string) => request<void>("DELETE", `/api/tokens/${id}`),
  createWorkspace: (name: string) => request<Workspace>("POST", "/api/workspaces", { name }),
  members: () => request<Member[]>("GET", "/api/workspace/members"),
  addMember: (email: string, display_name: string, role: string, issue_token: boolean) =>
    request<Member>("POST", "/api/workspace/members", { email, display_name, role, issue_token }),
  removeMember: (userId: string) => request<void>("DELETE", `/api/workspace/members/${userId}`),
  audit: (action?: string) => request<AuditEntry[]>("GET", `/api/audit${qs({ action })}`),

  // meetings
  meetings: (q?: string) => request<MeetingListItem[]>("GET", `/api/meetings${qs({ q })}`),
  meeting: (id: string) => request<MeetingDetail>("GET", `/api/meetings/${id}`),
  createMeeting: (m: NewMeeting) => request<MeetingDetail>("POST", "/api/meetings", m),
  updateMeeting: (
    id: string,
    patch: { title?: string; profile?: string; attendees?: string[]; local_only?: boolean; links?: { title: string; url: string }[] },
  ) => request<MeetingDetail>("PATCH", `/api/meetings/${id}`, patch),
  deleteMeeting: (id: string) => request<void>("DELETE", `/api/meetings/${id}`),
  confirmConsent: (id: string, method: string, note = "") =>
    request<MeetingDetail>("POST", `/api/meetings/${id}/consent`, { method, note }),
  uploadAudio,
  uploadPlatformTranscript: async (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file, file.name);
    return (await send("PUT", `/api/meetings/${id}/platform-transcript`, undefined, form)).json() as Promise<MeetingDetail>;
  },
  importTranscript: (id: string, lines: { speaker: string; start: number; end?: number; text: string }[]) =>
    request<MeetingDetail>("POST", `/api/meetings/${id}/transcript`, { lines }),
  reprocess: (id: string, stage: "full" | "summarize") =>
    request<MeetingDetail>("POST", `/api/meetings/${id}/reprocess`, { stage }),
  renameSpeaker: (id: string, label: string, body: { display_name?: string; person_id?: string }) =>
    request("PATCH", `/api/meetings/${id}/speakers/${label}`, body),
  mergeSpeakers: (id: string, from_label: string, into_label: string) =>
    request<MeetingDetail>("POST", `/api/meetings/${id}/speakers/merge`, { from_label, into_label }),
  fixLine: (id: string, segmentId: number, speaker_label: string) =>
    request<MeetingDetail>("PATCH", `/api/meetings/${id}/segments/${segmentId}`, { speaker_label }),
  enrollFromMeeting: (id: string, label: string, person_id: string) =>
    request<Person>("POST", `/api/meetings/${id}/speakers/${label}/enroll`, { person_id, consent: true }),
  editSummary: (id: string, data: Record<string, unknown>) =>
    request<MeetingDetail>("PATCH", `/api/meetings/${id}/summary`, { data }),
  exportMeeting: (id: string) => text(`/api/meetings/${id}/export?format=md`),
  audioUrl: (id: string) => request<{ url: string }>("GET", `/api/meetings/${id}/audio-url`),
  actionItems: (openOnly = true) => request<ActionItem[]>("GET", `/api/action-items${qs({ open_only: openOnly })}`),
  setActionItem: (id: number, done: boolean) => request<ActionItem>("PATCH", `/api/action-items/${id}`, { done }),
  brief: (id: string) => request<Brief>("GET", `/api/meetings/${id}/brief`),
  digest: (id: string) => request<Digest>("GET", `/api/meetings/${id}/digest`),
  liveCards: (id: string) => request<LiveCard[]>("GET", `/api/meetings/${id}/live/cards`),
  cardFeedback: (cardId: number, value: number) => request<void>("POST", `/api/live/cards/${cardId}/feedback`, { value }),
  askLive: (id: string, question: string) => request<LiveCard | { status: string }>("POST", `/api/meetings/${id}/live/ask`, { question }),
  stopLive: (id: string) => request<{ status: string }>("POST", `/api/meetings/${id}/live/stop`),
  sendBot: (id: string, meeting_url: string, consent_confirmed: boolean) =>
    request<MeetingDetail>("POST", `/api/meetings/${id}/bot`, { meeting_url, consent_confirmed }),
  removeBot: (id: string) => request<MeetingDetail>("DELETE", `/api/meetings/${id}/bot`),
  syncBot: (id: string) => request<MeetingDetail>("POST", `/api/meetings/${id}/bot/sync`),
  postSummary: (id: string, targets: string[] = []) => request<{ posted: string[] }>("POST", `/api/meetings/${id}/post`, { targets }),
  jiraDraft: (itemId: number) => request<{ key: string | null; draft: JiraDraft | null }>("GET", `/api/action-items/${itemId}/jira`),
  saveJiraDraft: (itemId: number, draft: Partial<JiraDraft>) =>
    request<{ key: string | null; draft: JiraDraft }>("PUT", `/api/action-items/${itemId}/jira`, draft),
  fileJira: (itemId: number) => request<{ key: string; url: string }>("POST", `/api/action-items/${itemId}/jira`),

  // ask
  chat: (question: string, history: { role: "user" | "assistant"; content: string }[], since?: string, until?: string) =>
    request<ChatResponse>("POST", "/api/chat", { question, history, since: since || null, until: until || null }),

  // memory
  commitments: (status = "open", mine = false, owner?: string) =>
    request<Commitment[]>("GET", `/api/commitments${qs({ status, mine, owner })}`),
  updateCommitment: (id: number, patch: { status?: string; text?: string; due?: string; owner?: string }) =>
    request<Commitment>("PATCH", `/api/commitments/${id}`, patch),
  decisions: (q?: string) => request<Decision[]>("GET", `/api/decisions${qs({ q })}`),
  entities: () => request<Entity[]>("GET", "/api/entities"),
  mergeEntities: (from_id: number, into_id: number) => request<Entity>("POST", "/api/entities/merge", { from_id, into_id }),
  glossary: () => request<GlossaryTerm[]>("GET", "/api/glossary"),
  addGlossary: (t: Omit<GlossaryTerm, "id">) => request<GlossaryTerm>("POST", "/api/glossary", t),
  updateGlossary: (id: number, t: Omit<GlossaryTerm, "id">) => request<GlossaryTerm>("PUT", `/api/glossary/${id}`, t),
  deleteGlossary: (id: number) => request<void>("DELETE", `/api/glossary/${id}`),
  customProfiles: () => request<CustomProfile[]>("GET", "/api/profiles/custom"),
  createProfile: (p: CustomProfile) => request<CustomProfile>("POST", "/api/profiles/custom", p),
  updateProfile: (p: CustomProfile) => request<CustomProfile>("PUT", `/api/profiles/custom/${p.key}`, p),
  deleteProfile: (key: string) => request<void>("DELETE", `/api/profiles/custom/${key}`),
  documents: () => request<DocumentRow[]>("GET", "/api/documents"),
  addDocument: (d: { title: string; url?: string; kind: string; text: string }) => request<DocumentRow>("POST", "/api/documents", d),
  deleteDocument: (id: number) => request<void>("DELETE", `/api/documents/${id}`),

  // people
  people: () => request<Person[]>("GET", "/api/people"),
  createPerson: (p: { display_name: string; email?: string; aliases?: string[] }) => request<Person>("POST", "/api/people", p),
  updatePerson: (id: string, p: { display_name?: string; email?: string; aliases?: string[] }) =>
    request<Person>("PATCH", `/api/people/${id}`, p),
  deletePerson: (id: string) => request<void>("DELETE", `/api/people/${id}`),
  enrollVoiceprint: async (id: string, clips: Blob[]) => {
    const form = new FormData();
    clips.forEach((c, i) => form.append("clips", c, `clip${i + 1}.webm`));
    form.append("consent", "true");
    return (await send("POST", `/api/people/${id}/voiceprint`, undefined, form)).json() as Promise<Person>;
  },
  deleteVoiceprint: (id: string) => request<Person>("DELETE", `/api/people/${id}/voiceprint`),

  // standup, insights, metrics
  standupDraft: () => request<StandupDraft>("POST", "/api/standup/draft"),
  rehearse: (t: string) => request<Rehearsal>("POST", "/api/standup/rehearse", { text: t }),
  rollup: (since?: string, until?: string) => request<Rollup>("GET", `/api/rollup${qs({ since, until })}`),
  rollupMarkdown: (since?: string, until?: string) => text(`/api/rollup${qs({ since, until, format: "md" })}`),
  blockerRadar: (days = 14) => request<RadarItem[]>("GET", `/api/blocker-radar${qs({ days })}`),
  gates: () => request<Gate[]>("GET", "/api/metrics/gates"),
  signOffReview: (note: string) => request<Gate[]>("POST", "/api/metrics/gates/legal-review", { note }),
  speakerMetrics: () => request<SpeakerMetrics>("GET", "/api/metrics/speakers"),
  liveMetrics: () => request<LiveMetrics>("GET", "/api/metrics/live"),

  // integrations and calendar
  integrations: () => request<Integrations>("GET", "/api/integrations"),
  saveIntegrations: (patch: Partial<Integrations>) => request<Integrations>("PUT", "/api/integrations", patch),
  testIntegration: (target: string) => request<{ ok: boolean; detail: string }>("POST", "/api/integrations/test", { target }),
  calendar: (days = 7) => request<{ configured: boolean; events: CalendarEventRow[] }>("GET", `/api/calendar/events${qs({ days })}`),
  prepareEvent: (key: string) => request<{ meeting_id: string; brief: Brief }>("POST", "/api/calendar/prepare", { key }),

  checkToken: async (token: string) => {
    const res = await fetch("/api/config", { headers: { Authorization: `Bearer ${token}` } });
    return res.ok;
  },
};

/** WebSocket URL for live assist. Browsers can't send headers on sockets, so the token rides in the query. */
export function liveSocketUrl(meetingId: string, role: "capture" | "view", channels = 2): string {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  const params = new URLSearchParams({ token: memoryToken ?? "", role, channels: String(channels) });
  if (memoryWorkspace) params.set("workspace", memoryWorkspace);
  return `${proto}//${location.host}/api/live/${meetingId}?${params}`;
}

/** Download text as a file. */
export function saveText(filename: string, content: string, type = "text/markdown") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}
