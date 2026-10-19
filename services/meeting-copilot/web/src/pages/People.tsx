import { FormEvent, useEffect, useRef, useState } from "react";
import { ApiError, api } from "../api";
import { fullDate } from "../lib/format";
import type { Person } from "../types";

const PROMPTS = [
  "The quick brown fox jumps over the lazy dog. I'm reading this so Meeting Copilot can tell my voice apart in our meetings.",
  "Yesterday I reviewed the deployment pipeline, today I'm pairing on the gateway, and I have no blockers right now.",
  "Please call me back at the number I left earlier. We'll meet on Thursday at half past ten to go over the plan.",
];
const CLIP_SECONDS = 10;

export function PeoplePage() {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [enrolling, setEnrolling] = useState<Person | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const load = () =>
    api
      .people()
      .then(setPeople)
      .catch((e) => setError(e instanceof ApiError ? e.message : String(e)));
  useEffect(() => {
    load();
  }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    try {
      await api.createPerson({ display_name: name.trim(), email: email.trim() || undefined });
      setName("");
      setEmail("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
    }
  }

  async function act(fn: () => Promise<unknown>) {
    try {
      await fn();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>People</h1>
      </div>
      <p className="muted lede">
        Everyone seen in your meetings. A voiceprint lets Meeting Copilot label someone automatically. It is opt-in, needs that
        person's consent, stores an embedding only (never the audio), and anyone can delete it.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <form className="inline-form wide" onSubmit={add}>
        <input aria-label="Name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input aria-label="Email" placeholder="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="button" disabled={!name.trim()}>
          Add person
        </button>
      </form>
      {people === null && !error && <p className="muted">Loading…</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Also called</th>
            <th>Meetings</th>
            <th>Voiceprint</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {people?.map((p) => (
            <tr key={p.id}>
              <td>
                <strong>{p.display_name}</strong>
                {p.is_you && <span className="tag">you</span>}
                {p.email && <div className="muted small">{p.email}</div>}
              </td>
              <td>
                {editing === p.id ? (
                  <input
                    autoFocus
                    defaultValue={p.aliases.join(", ")}
                    aria-label={`Other names for ${p.display_name}`}
                    onBlur={(e) => {
                      setEditing(null);
                      act(() => api.updatePerson(p.id, { aliases: e.target.value.split(",").map((a) => a.trim()).filter(Boolean) }));
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  />
                ) : (
                  <button className="link" onClick={() => setEditing(p.id)}>
                    {p.aliases.length ? p.aliases.join(", ") : "Add"}
                  </button>
                )}
              </td>
              <td>
                {p.meetings}
                {p.last_seen && <div className="muted small">last {fullDate(p.last_seen)}</div>}
              </td>
              <td>
                {p.has_voiceprint ? (
                  <>
                    <span className="tag ok">enrolled</span>
                    <div className="muted small">
                      {p.voiceprint_seconds}s, consent {p.consent_at ? fullDate(p.consent_at) : ""}
                    </div>
                  </>
                ) : (
                  <span className="muted">none</span>
                )}
              </td>
              <td className="row-actions">
                {p.has_voiceprint ? (
                  <button className="button" onClick={() => confirm(`Delete ${p.display_name}'s voiceprint?`) && act(() => api.deleteVoiceprint(p.id))}>
                    Delete voiceprint
                  </button>
                ) : (
                  <button className="button" onClick={() => setEnrolling(p)}>
                    Enroll voice
                  </button>
                )}
                {!p.is_you && (
                  <button className="link danger" onClick={() => confirm(`Remove ${p.display_name} from People?`) && act(() => api.deletePerson(p.id))}>
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {enrolling && (
        <EnrollDialog
          person={enrolling}
          onClose={() => setEnrolling(null)}
          onDone={() => {
            setEnrolling(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function EnrollDialog({ person, onClose, onDone }: { person: Person; onClose: () => void; onDone: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [consent, setConsent] = useState(false);
  const [clips, setClips] = useState<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [left, setLeft] = useState(CLIP_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => ref.current?.showModal(), []);

  async function record() {
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access was blocked.");
      return;
    }
    const rec = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      setClips((c) => [...c, new Blob(chunks, { type: rec.mimeType || "audio/webm" })]);
      setRecording(false);
    };
    rec.start();
    setRecording(true);
    setLeft(CLIP_SECONDS);
    const started = Date.now();
    const timer = window.setInterval(() => {
      const remaining = CLIP_SECONDS - Math.floor((Date.now() - started) / 1000);
      setLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(timer);
        rec.stop();
      }
    }, 250);
  }

  async function save() {
    setSaving(true);
    try {
      await api.enrollVoiceprint(person.id, clips);
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
      setSaving(false);
    }
  }

  const step = clips.length;
  return (
    <dialog ref={ref} className="dialog" onClose={onClose}>
      <h2>Enroll {person.display_name}'s voice</h2>
      <p className="muted">
        About 30 seconds of reading, in three clips. Only a mathematical embedding is kept; the recordings are deleted as soon as
        they're processed.
      </p>
      <label className="check consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        {person.is_you ? "I agree" : `${person.display_name} agreed`} to having a voiceprint saved, and knows it can be deleted at any time.
      </label>
      {step < 3 ? (
        <div className="enroll-step">
          <p className="muted small">Clip {step + 1} of 3. Read this aloud:</p>
          <blockquote>{PROMPTS[step]}</blockquote>
          <button className="button primary" onClick={record} disabled={!consent || recording}>
            {recording ? `Recording… ${left}s` : `Record clip ${step + 1}`}
          </button>
        </div>
      ) : (
        <p>All three clips are recorded.</p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="dialog-actions">
        <button className="button" onClick={() => ref.current?.close()}>
          Cancel
        </button>
        <button className="button primary" disabled={!consent || step < 3 || saving} onClick={save}>
          {saving ? "Saving…" : "Save voiceprint"}
        </button>
      </div>
    </dialog>
  );
}
