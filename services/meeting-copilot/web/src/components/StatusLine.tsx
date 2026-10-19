import type { Status } from "../types";

const LABELS: Record<Status, string> = {
  created: "Waiting for audio",
  live: "Live now",
  queued: "Waiting for the worker",
  processing: "Processing",
  done: "Ready",
  failed: "Failed",
};

export function StatusLine({ status, stage }: { status: Status; stage: string | null }) {
  if (status === "done") return null;
  const busy = status === "queued" || status === "processing" || status === "live";
  const text = status === "processing" && stage ? stage[0].toUpperCase() + stage.slice(1) : LABELS[status];
  return (
    <span className={`status status-${status}`} role="status">
      {busy && <span className="pulse" aria-hidden="true" />}
      {text}
      {busy && "…"}
    </span>
  );
}

export const isBusy = (s: Status) => s === "queued" || s === "processing" || s === "live";
