export type Status = "created" | "queued" | "processing" | "done" | "failed";

export interface MeetingListItem {
  id: string;
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

export interface Summary {
  overview: string;
  people: PersonUpdate[];
  key_points: { text: string; at: number | null }[];
  decisions: string[];
  action_items: { owner: string | null; text: string; due: string | null; at: number | null }[];
  open_questions: string[];
}

export interface MeetingDetail extends MeetingListItem {
  attendees: string[];
  channel_layout: "mic_system" | "mono";
  consent_confirmed: boolean;
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
  kind: "transcript" | "summary";
  meeting_id: string;
  meeting_title: string;
  started_at: string;
  start: number | null;
  end: number | null;
  speakers: string;
  text: string;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
}

export interface AppConfig {
  owner_name: string;
  profiles: { key: string; label: string }[];
  audio_retention_days: number;
  providers: Record<string, string>;
}
