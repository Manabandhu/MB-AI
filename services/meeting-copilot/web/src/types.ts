export type Status = "created" | "live" | "queued" | "processing" | "done" | "failed";

export interface MeetingListItem {
  id: string;
  user_id: string | null;
  title: string;
  profile: string;
  started_at: string;
  duration_s: number | null;
  status: Status;
  stage: string | null;
  error: string | null;
  overview: string | null;
  open_action_items: number;
}

export interface Speaker {
  label: string;
  display_name: string;
  is_owner: boolean;
  person_id: string | null;
  match_source: "owner" | "platform" | "voiceprint" | "manual" | null;
  match_score: number | null;
}

export interface Segment {
  id: number;
  speaker_label: string;
  start: number;
  end: number;
  text: string;
}

export interface ActionItem {
  id: number;
  meeting_id: string;
  owner: string | null;
  text: string;
  due: string | null;
  at: number | null;
  done: boolean;
}

export interface PersonUpdate {
  name: string;
  yesterday: string[];
  today: string[];
  blockers: string[];
}

export interface DecisionItem {
  text: string;
  owner?: string | null;
  at?: number | null;
}

export interface FieldMeta {
  key: string;
  label: string;
  hint: string;
  type: "list" | "text";
}

export interface Summary {
  overview: string;
  people: PersonUpdate[];
  key_points: { text: string; at: number | null }[];
  decisions: (string | DecisionItem)[];
  action_items: { owner: string | null; text: string; due: string | null; at: number | null }[];
  open_questions: string[];
  entities?: { kind: string; name: string }[];
  fields?: Record<string, string[] | string>;
  fields_meta?: FieldMeta[];
}

export interface ConsentEntry {
  method: string;
  at: string;
  by: string;
  note?: string;
}

export interface MeetingDetail extends MeetingListItem {
  attendees: string[];
  channel_layout: "mic_system" | "mono";
  consent_confirmed: boolean;
  consent_state: "pending" | "confirmed";
  consent_log: ConsentEntry[];
  source: string;
  local_only: boolean;
  off_record: [number, number][];
  links: { title: string; url: string }[];
  calendar_event_id: string | null;
  profile_source: "user" | "auto";
  bot_id: string | null;
  bot_status: string | null;
  meeting_url: string | null;
  platform_labels: boolean;
  processed_at: string | null;
  has_audio: boolean;
  audio_deleted_at: string | null;
  speakers: Speaker[];
  segments: Segment[];
  summary: Summary | null;
  summary_model: string | null;
  action_items: ActionItem[];
}

export interface Source {
  n: number;
  kind: "transcript" | "summary" | "commitment" | "decision" | "document";
  meeting_id: string | null;
  meeting_title: string;
  started_at: string | null;
  start: number | null;
  end: number | null;
  speakers: string;
  text: string;
  url?: string | null;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  grounded: boolean;
  unsupported: string[];
  confidence: number;
}

export interface ProfileInfo {
  key: string;
  label: string;
  per_person: boolean;
  fields: FieldMeta[];
  live_assist: string;
  custom: boolean;
}

export interface AppConfig {
  owner_name: string;
  user_id: string;
  workspace_id: string;
  role: "owner" | "member";
  profiles: ProfileInfo[];
  audio_retention_days: number;
  providers: Record<string, string>;
}

export interface Workspace {
  id: string;
  name: string;
  is_personal: boolean;
  role: string;
}

export interface Me {
  id: string;
  display_name: string;
  email: string | null;
  aliases: string[];
  watched_keywords: string[];
  via: string;
  workspace_id: string;
  role: string;
  workspaces: Workspace[];
}

export interface ApiTokenRow {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  token?: string;
}

export interface Member {
  user_id: string;
  display_name: string;
  email: string | null;
  role: string;
  token?: string | null;
}

export interface Person {
  id: string;
  display_name: string;
  email: string | null;
  aliases: string[];
  is_you: boolean;
  has_voiceprint: boolean;
  consent_at: string | null;
  voiceprint_seconds: number;
  meetings: number;
  last_seen: string | null;
}

export interface Mention {
  meeting_id: string;
  meeting_title: string;
  said_at: string;
  at: number | null;
  kind: "made" | "progress" | "done";
}

export interface Commitment {
  id: number;
  owner: string | null;
  owner_person_id: string | null;
  text: string;
  due: string | null;
  due_date: string | null;
  status: "open" | "done" | "dropped";
  stuck: boolean;
  overdue: boolean;
  mine: boolean;
  first_mentioned_at: string;
  last_mentioned_at: string;
  mention_count: number;
  done_at: string | null;
  jira_key: string | null;
  mentions: Mention[];
}

export interface Decision {
  id: number;
  meeting_id: string;
  meeting_title: string;
  text: string;
  owner: string | null;
  decided_at: string;
  at: number | null;
}

export interface Entity {
  id: number;
  kind: string;
  name: string;
  aliases: string[];
  meetings: number;
  mentions: number;
  last_seen: string | null;
}

export interface GlossaryTerm {
  id: number;
  term: string;
  kind: string;
  definition: string | null;
  aliases: string[];
  watched: boolean;
}

export interface CustomProfile {
  id?: number;
  key: string;
  label: string;
  instructions: string;
  fields: { key: string; label: string; hint: string; type: "list" | "text" }[];
  live_prompt: string;
  keywords: string[];
  per_person: boolean;
}

export interface DocumentRow {
  id: number;
  title: string;
  url: string | null;
  kind: "doc" | "runbook";
  excerpt: string;
  indexed: boolean;
  created_at: string;
}

export interface CardSource {
  n: number;
  kind: string;
  meeting_id: string | null;
  meeting_title: string;
  started_at: string | null;
  start: number | null;
  url: string | null;
  text: string;
}

export interface LiveCard {
  id: number | null;
  kind: "answer" | "explain" | "nudge" | "keyword" | "update";
  trigger: string;
  trigger_text: string;
  question?: string;
  speaker?: string;
  at: number | null;
  answer: string;
  facts: string[];
  sources: CardSource[];
  grounded: boolean;
  confidence: number;
  timings_ms: Record<string, number>;
  feedback?: number;
}

export interface LiveLine {
  id: number;
  speaker: string;
  is_owner: boolean;
  start: number;
  end: number;
  text: string;
  channel: number | null;
}

export interface BriefCommitment {
  id: number;
  owner: string | null;
  text: string;
  due: string | null;
  due_date: string | null;
  stuck: boolean;
  meeting_id: string | null;
}

export interface Brief {
  meeting: { id: string; title: string; started_at: string; profile: string };
  profile: { key: string; label: string; live_assist: string };
  attendees: {
    person_id: string;
    name: string;
    email: string | null;
    has_voiceprint: boolean;
    last_meeting: { id: string; title: string; started_at: string } | null;
    meetings_together: number;
    open_commitments: BriefCommitment[];
  }[];
  your_open_commitments: BriefCommitment[];
  last_meeting_with_them: { id: string; title: string; started_at: string; overview: string | null } | null;
  linked_docs: { title: string; url: string }[];
  focus: { kind: string; text: string; meeting_id?: string; url?: string | null; at?: number | null }[];
}

export interface StandupDraft {
  yesterday: string[];
  today: string[];
  blockers: string[];
  text: string;
}

export interface Rehearsal {
  text: string;
  words_before: number;
  words_after: number;
  seconds_before: number;
  seconds_after: number;
  under_a_minute: boolean;
}

export interface Gate {
  phase: number;
  name: string;
  target: string;
  value: string;
  passed: boolean | null;
  detail: string;
}

export interface SpeakerMetrics {
  meetings: number;
  turns: number;
  corrected_turns: number;
  accuracy: number | null;
  voiceprint_matches: number;
  voiceprint_wrong: number;
  suggested_threshold: number | null;
}

export interface LiveMetrics {
  cards: number;
  within_target: number | null;
  rated: number;
  useful: number | null;
  median_ms: number | null;
  p90_ms: number | null;
  not_in_history: number;
}

export interface RollupRef {
  id: number;
  text: string;
  due: string | null;
  status: string;
}

export interface Rollup {
  since: string;
  until: string;
  meetings: { id: string; title: string; profile: string; started_at: string; minutes: number }[];
  people: {
    name: string;
    meetings: number;
    talk_minutes: number;
    made: RollupRef[];
    done: RollupRef[];
    open: RollupRef[];
    stuck: RollupRef[];
    blockers: { text: string; meeting_id: string }[];
  }[];
  decisions: { text: string; owner: string | null; meeting_id: string; meeting_title: string }[];
  timesheet: { total_minutes: number; by_day: Record<string, number>; by_profile: Record<string, number> };
  totals: { made: number; done: number; open: number; stuck: number };
}

export interface RadarItem {
  topic: string;
  entities: string[];
  standups: number;
  people: string[];
  first_seen: string;
  last_seen: string;
  days_open: number;
  examples: string[];
  nudge: string;
}

export interface Digest {
  meeting: { id: string; title: string; started_at: string };
  overview: string | null;
  mentions: { segment_id: number; start: number; speaker: string; text: string; why: string[] }[];
  your_action_items: { id: number; text: string; due: string | null; at: number | null }[];
  your_update: PersonUpdate | null;
  decisions_about_your_work: string[];
  nothing_for_you: boolean;
}

export interface CalendarEventRow {
  key: string;
  title: string;
  start: string;
  end: string | null;
  attendees: string[];
  organizer: string | null;
  location: string;
  meeting_url: string | null;
  links: string[];
  profile: string;
  profile_confidence: number;
  meeting_id: string | null;
}

export interface Integrations {
  slack_webhook_url: string;
  teams_webhook_url: string;
  jira_base_url: string;
  jira_email: string;
  jira_api_token: string;
  jira_project_key: string;
  jira_issue_type: string;
  github_token: string;
  github_username: string;
  github_repos: string;
  calendar_ics_url: string;
  auto_post_summaries: boolean;
  auto_draft_jira: boolean;
  jira_enabled: boolean;
}

export interface AuditEntry {
  id: number;
  user_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  meta: Record<string, unknown>;
  ip: string | null;
  at: string;
}

export interface JiraDraft {
  project: string;
  issue_type: string;
  summary: string;
  description: string;
  owner: string | null;
  due_date: string | null;
}

export interface AuthConfig {
  token: boolean;
  oidc: { issuer: string; client_id: string; scopes: string } | null;
}
