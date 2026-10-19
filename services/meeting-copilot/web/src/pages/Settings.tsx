import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ApiError, api, setWorkspace } from "../api";
import { useConfig, useMe } from "../App";
import { fullDate } from "../lib/format";
import type { ApiTokenRow, AuditEntry, CustomProfile, DocumentRow, GlossaryTerm, Integrations, Member } from "../types";

const SECTIONS = [
  { key: "account", label: "Account" },
  { key: "workspace", label: "Workspace" },
  { key: "integrations", label: "Integrations" },
  { key: "glossary", label: "Glossary" },
  { key: "profiles", label: "Meeting types" },
  { key: "documents", label: "Docs and runbooks" },
  { key: "audit", label: "Audit log" },
] as const;

const errText = (e: unknown) => (e instanceof ApiError ? e.message : String(e));
const list = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const section = params.get("s") || "account";
  return (
    <div className="page settings">
      <div className="page-head">
        <h1>Settings</h1>
      </div>
      <div className="settings-grid">
        <nav className="settings-nav" aria-label="Settings sections">
          {SECTIONS.map((s) => (
            <button key={s.key} className={section === s.key ? "on" : ""} onClick={() => setParams({ s: s.key })}>
              {s.label}
            </button>
          ))}
        </nav>
        <div>
          {section === "account" && <Account />}
          {section === "workspace" && <WorkspaceSection />}
          {section === "integrations" && <IntegrationsSection />}
          {section === "glossary" && <GlossarySection />}
          {section === "profiles" && <ProfilesSection />}
          {section === "documents" && <DocumentsSection />}
          {section === "audit" && <AuditSection />}
        </div>
      </div>
    </div>
  );
}

function Account() {
  const { me, reload } = useMe();
  const [name, setName] = useState("");
  const [aliases, setAliases] = useState("");
  const [keywords, setKeywords] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!me) return;
    setName(me.display_name);
    setAliases(me.aliases.join(", "));
    setKeywords(me.watched_keywords.join(", "));
  }, [me]);
  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      await api.updateMe({ display_name: name.trim(), aliases: list(aliases), watched_keywords: list(keywords) });
      setMsg("Saved.");
      reload();
    } catch (err) {
      setMsg(errText(err));
    }
  }
  return (
    <section>
      <h2>You</h2>
      <form onSubmit={save} className="stack">
        <label htmlFor="me-name">Your name in transcripts</label>
        <input id="me-name" value={name} onChange={(e) => setName(e.target.value)} />
        <label htmlFor="me-aliases">Other names people call you</label>
        <input id="me-aliases" value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="Nicknames, short names" />
        <p className="muted small">Hearing any of these in a meeting raises an answer card.</p>
        <label htmlFor="me-kw">Watched keywords</label>
        <input id="me-kw" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Systems, projects or clients you own" />
        <button className="button primary">Save</button>
        {msg && <p className="muted">{msg}</p>}
      </form>
      <Tokens />
    </section>
  );
}

function Tokens() {
  const [rows, setRows] = useState<ApiTokenRow[]>([]);
  const [name, setName] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = () => api.tokens().then(setRows).catch((e) => setError(errText(e)));
  useEffect(() => {
    load();
  }, []);
  return (
    <>
      <h2>Access tokens</h2>
      <p className="muted">For the desktop recorder, the phone app or scripts. Shown once; stored only as a hash.</p>
      <form
        className="inline-form"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const t = await api.createToken(name.trim());
            setFresh(t.token ?? null);
            setName("");
            load();
          } catch (err) {
            setError(errText(err));
          }
        }}
      >
        <input aria-label="Token name" placeholder="e.g. Desktop recorder" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="button" disabled={!name.trim()}>
          Create token
        </button>
      </form>
      {fresh && (
        <p className="banner">
          <code className="secret">{fresh}</code> Copy it now; it won't be shown again.
        </p>
      )}
      {error && <p className="error">{error}</p>}
      <ul className="plain rows">
        {rows.map((t) => (
          <li key={t.id}>
            <strong>{t.name}</strong> <code>{t.prefix}…</code>{" "}
            <span className="muted small">
              created {fullDate(t.created_at)}
              {t.last_used_at && `, last used ${fullDate(t.last_used_at)}`}
            </span>
            {t.revoked_at ? (
              <span className="tag">revoked</span>
            ) : (
              <button className="link danger" onClick={() => api.revokeToken(t.id).then(load)}>
                Revoke
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

function WorkspaceSection() {
  const { me } = useMe();
  const config = useConfig();
  const [members, setMembers] = useState<Member[]>([]);
  const [teamName, setTeamName] = useState("");
  const [email, setEmail] = useState("");
  const [invite, setInvite] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const current = me?.workspaces.find((w) => w.id === me.workspace_id);
  const load = () => api.members().then(setMembers).catch((e) => setError(errText(e)));
  useEffect(() => {
    load();
  }, []);
  return (
    <section>
      <h2>{current?.name ?? "Workspace"}</h2>
      <p className="muted">
        {current?.is_personal
          ? "Your personal workspace: only you can see its meetings and memory."
          : "A shared team workspace: every member sees its meetings, people and memory."}
      </p>
      {!current?.is_personal && (
        <>
          <h3>Members</h3>
          <ul className="plain rows">
            {members.map((m) => (
              <li key={m.user_id}>
                <strong>{m.display_name}</strong> <span className="muted">{m.email}</span> <span className="tag">{m.role}</span>
                {config?.role === "owner" && m.user_id !== me?.id && (
                  <button className="link danger" onClick={() => api.removeMember(m.user_id).then(load).catch((e) => setError(errText(e)))}>
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
          {config?.role === "owner" && (
            <form
              className="inline-form"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const m = await api.addMember(email.trim(), "", "member", true);
                  setInvite(m.token ?? null);
                  setEmail("");
                  load();
                } catch (err) {
                  setError(errText(err));
                }
              }}
            >
              <input type="email" aria-label="Email" placeholder="colleague@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="button" disabled={!email.trim()}>
                Add member
              </button>
            </form>
          )}
          {invite && (
            <p className="banner">
              Their sign-in token: <code className="secret">{invite}</code> (or they can sign in with SSO using that email).
            </p>
          )}
        </>
      )}
      <h3>New team workspace</h3>
      <form
        className="inline-form"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const ws = await api.createWorkspace(teamName.trim());
            setWorkspace(ws.id);
            location.reload();
          } catch (err) {
            setError(errText(err));
          }
        }}
      >
        <input aria-label="Team name" placeholder="Team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
        <button className="button" disabled={!teamName.trim()}>
          Create and switch
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}

function IntegrationsSection() {
  const config = useConfig();
  const [cfg, setCfg] = useState<Integrations | null>(null);
  const [draft, setDraft] = useState<Partial<Integrations>>({});
  const [results, setResults] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api.integrations().then(setCfg).catch((e) => setError(errText(e)));
  }, []);
  if (!cfg) return <p className="muted">{error ?? "Loading…"}</p>;
  const v = (k: keyof Integrations) => (draft[k] ?? cfg[k]) as string;
  const field = (k: keyof Integrations, label: string, placeholder = "", type = "text") => (
    <label key={k} className="field">
      {label}
      <input type={type} value={v(k)} placeholder={placeholder} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))} disabled={config?.role !== "owner"} />
    </label>
  );
  const test = async (target: string) => {
    const r = await api.testIntegration(target);
    setResults((x) => ({ ...x, [target]: `${r.ok ? "✓" : "✕"} ${r.detail}` }));
  };
  return (
    <section>
      {config?.role !== "owner" && <p className="banner">Only workspace owners can change integrations.</p>}
      <h2>Slack and Teams</h2>
      {field("slack_webhook_url", "Slack incoming webhook URL", "https://hooks.slack.com/services/…")}
      {field("teams_webhook_url", "Teams workflow webhook URL", "https://…")}
      <label className="check">
        <input type="checkbox" checked={draft.auto_post_summaries ?? cfg.auto_post_summaries} onChange={(e) => setDraft((d) => ({ ...d, auto_post_summaries: e.target.checked }))} />
        Post every summary automatically
      </label>
      <div className="test-row">
        <button className="button" onClick={() => test("slack")}>Test Slack</button>
        <button className="button" onClick={() => test("teams")}>Test Teams</button>
        <span className="muted small">{results.slack ?? results.teams}</span>
      </div>
      <h2>Jira</h2>
      {field("jira_base_url", "Site URL", "https://your-company.atlassian.net")}
      {field("jira_email", "Account email")}
      {field("jira_api_token", "API token", "", "password")}
      <div className="row">
        {field("jira_project_key", "Project key", "OPS")}
        {field("jira_issue_type", "Issue type", "Task")}
      </div>
      <label className="check">
        <input type="checkbox" checked={draft.auto_draft_jira ?? cfg.auto_draft_jira} onChange={(e) => setDraft((d) => ({ ...d, auto_draft_jira: e.target.checked }))} />
        Draft a ticket for every action item (you still file each one)
      </label>
      <div className="test-row">
        <button className="button" onClick={() => test("jira")}>Test Jira</button>
        <span className="muted small">{results.jira}</span>
      </div>
      <h2>GitHub and CI</h2>
      <p className="muted small">Your recent PRs, commits and failing runs feed the pre-drafted standup update.</p>
      {field("github_username", "GitHub username")}
      {field("github_token", "Token (read-only)", "", "password")}
      {field("github_repos", "Repositories to watch for CI", "owner/repo, owner/repo")}
      <div className="test-row">
        <button className="button" onClick={() => test("github")}>Test GitHub</button>
        <span className="muted small">{results.github}</span>
      </div>
      <h2>Calendar</h2>
      <p className="muted small">An ICS/webcal link from Outlook or Google Calendar. Upcoming meetings show on the Meetings page.</p>
      {field("calendar_ics_url", "Calendar feed URL", "https://outlook.office365.com/owa/calendar/…/calendar.ics", "password")}
      <div className="test-row">
        <button className="button" onClick={() => test("calendar")}>Test calendar</button>
        <span className="muted small">{results.calendar}</span>
      </div>
      {config?.role === "owner" && (
        <button
          className="button primary"
          onClick={async () => {
            try {
              setCfg(await api.saveIntegrations(draft));
              setDraft({});
              setError("Saved.");
            } catch (e) {
              setError(errText(e));
            }
          }}
          disabled={!Object.keys(draft).length}
        >
          Save integrations
        </button>
      )}
      {error && <p className="muted">{error}</p>}
    </section>
  );
}

function GlossarySection() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [form, setForm] = useState({ term: "", kind: "term", definition: "", aliases: "", watched: false });
  const [error, setError] = useState<string | null>(null);
  const load = () => api.glossary().then(setTerms).catch((e) => setError(errText(e)));
  useEffect(() => {
    load();
  }, []);
  return (
    <section>
      <h2>Team glossary</h2>
      <p className="muted">
        Spelled right by the transcriber, merged into entities, explained on request during meetings, and (when watched) raises a
        card whenever it comes up.
      </p>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api.addGlossary({ ...form, aliases: list(form.aliases), definition: form.definition || null });
            setForm({ term: "", kind: "term", definition: "", aliases: "", watched: false });
            load();
          } catch (err) {
            setError(errText(err));
          }
        }}
      >
        <div className="row">
          <input aria-label="Term" placeholder="Term" value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} required />
          <select aria-label="Kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            {["term", "system", "project", "org", "topic"].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <input aria-label="Other spellings" placeholder="Other spellings" value={form.aliases} onChange={(e) => setForm({ ...form, aliases: e.target.value })} />
        </div>
        <input aria-label="Definition" placeholder="What it means (for explain-a-term)" value={form.definition} onChange={(e) => setForm({ ...form, definition: e.target.value })} />
        <label className="check">
          <input type="checkbox" checked={form.watched} onChange={(e) => setForm({ ...form, watched: e.target.checked })} />
          Watch this term during meetings
        </label>
        <button className="button">Add term</button>
      </form>
      {error && <p className="error">{error}</p>}
      <table className="table">
        <tbody>
          {terms.map((t) => (
            <tr key={t.id}>
              <td>
                <strong>{t.term}</strong> <span className="tag">{t.kind}</span>
                {t.watched && <span className="tag ok">watched</span>}
                {t.aliases.length > 0 && <div className="muted small">also {t.aliases.join(", ")}</div>}
              </td>
              <td className="muted">{t.definition}</td>
              <td className="row-actions">
                <button className="link" onClick={() => api.updateGlossary(t.id, { ...t, watched: !t.watched }).then(load)}>
                  {t.watched ? "Unwatch" : "Watch"}
                </button>
                <button className="link danger" onClick={() => api.deleteGlossary(t.id).then(load)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const EMPTY_PROFILE: CustomProfile = { key: "", label: "", instructions: "", fields: [], live_prompt: "", keywords: [], per_person: false };

function ProfilesSection() {
  const config = useConfig();
  const [rows, setRows] = useState<CustomProfile[]>([]);
  const [p, setP] = useState<CustomProfile>(EMPTY_PROFILE);
  const [fields, setFields] = useState("");
  const [error, setError] = useState<string | null>(null);
  const load = () => api.customProfiles().then(setRows).catch((e) => setError(errText(e)));
  useEffect(() => {
    load();
  }, []);
  return (
    <section>
      <h2>Meeting types</h2>
      <p className="muted">Built in: {config?.profiles.filter((x) => !x.custom).map((x) => x.label).join(", ")}.</p>
      {rows.length > 0 && (
        <ul className="plain rows">
          {rows.map((r) => (
            <li key={r.key}>
              <strong>{r.label}</strong> <code>{r.key}</code> <span className="muted small">{r.fields.map((f) => f.label).join(", ")}</span>
              <button className="link danger" onClick={() => api.deleteProfile(r.key).then(load)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
      <h3>Add a custom type</h3>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const parsed = fields
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
            .map((l) => {
              const [label, hint = ""] = l.split(":").map((x) => x.trim());
              return { key: label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "field", label, hint, type: "list" as const };
            });
          try {
            await api.createProfile({ ...p, fields: parsed });
            setP(EMPTY_PROFILE);
            setFields("");
            load();
          } catch (err) {
            setError(errText(err));
          }
        }}
      >
        <div className="row">
          <input aria-label="Name" placeholder="Name, e.g. Sprint retro" value={p.label} onChange={(e) => setP({ ...p, label: e.target.value, key: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) })} required />
          <input aria-label="Detection keywords" placeholder="Title keywords: retro, retrospective" value={p.keywords.join(", ")} onChange={(e) => setP({ ...p, keywords: list(e.target.value) })} />
        </div>
        <textarea aria-label="Summary instructions" rows={3} placeholder="What the summary should capture" value={p.instructions} onChange={(e) => setP({ ...p, instructions: e.target.value })} required />
        <textarea aria-label="Fields" rows={3} placeholder={"One field per line, as Label: hint\nWent well: things the team liked\nTo change: what to do differently"} value={fields} onChange={(e) => setFields(e.target.value)} />
        <input aria-label="Live assist prompt" placeholder="Live assist focus (optional)" value={p.live_prompt} onChange={(e) => setP({ ...p, live_prompt: e.target.value })} />
        <label className="check">
          <input type="checkbox" checked={p.per_person} onChange={(e) => setP({ ...p, per_person: e.target.checked })} />
          Per-person updates (like a standup)
        </label>
        <button className="button">Add meeting type</button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}

function DocumentsSection() {
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [form, setForm] = useState({ title: "", url: "", kind: "runbook", text: "" });
  const [error, setError] = useState<string | null>(null);
  const load = () => api.documents().then(setDocs).catch((e) => setError(errText(e)));
  useEffect(() => {
    load();
  }, []);
  return (
    <section>
      <h2>Docs and runbooks</h2>
      <p className="muted">Paste the text of runbooks and reference docs. Incident bridges surface matching runbooks; briefs and answers can cite them.</p>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api.addDocument({ ...form, url: form.url || undefined });
            setForm({ title: "", url: "", kind: "runbook", text: "" });
            load();
          } catch (err) {
            setError(errText(err));
          }
        }}
      >
        <div className="row">
          <input aria-label="Title" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <select aria-label="Kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            <option value="runbook">Runbook</option>
            <option value="doc">Doc</option>
          </select>
          <input aria-label="Link" placeholder="Link (optional)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        </div>
        <textarea aria-label="Text" rows={5} placeholder="The text to search" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
        <button className="button">Add</button>
      </form>
      {error && <p className="error">{error}</p>}
      <ul className="plain rows">
        {docs.map((d) => (
          <li key={d.id}>
            <strong>{d.url ? <a href={d.url} target="_blank" rel="noreferrer">{d.title}</a> : d.title}</strong> <span className="tag">{d.kind}</span>
            <div className="muted small">{d.excerpt}</div>
            <button className="link danger" onClick={() => api.deleteDocument(d.id).then(load)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AuditSection() {
  const config = useConfig();
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  const [action, setAction] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (config?.role !== "owner") return;
    api.audit(action || undefined).then(setRows).catch((e) => setError(errText(e)));
  }, [action, config?.role]);
  if (config?.role !== "owner") return <p className="muted">Only workspace owners can read the audit log.</p>;
  return (
    <section>
      <h2>Audit log</h2>
      <p className="muted">Who viewed, exported, listened to or deleted what.</p>
      <select aria-label="Action" value={action} onChange={(e) => setAction(e.target.value)}>
        <option value="">All actions</option>
        {["view", "export", "listen", "delete", "voiceprint_enroll", "voiceprint_delete", "jira_create", "member_add", "integrations_update"].map((a) => (
          <option key={a}>{a}</option>
        ))}
      </select>
      {error && <p className="error">{error}</p>}
      <table className="table">
        <tbody>
          {rows?.map((r) => (
            <tr key={r.id}>
              <td className="muted small">{fullDate(r.at)}</td>
              <td>
                <span className="tag">{r.action}</span> {r.target_type} <code>{r.target_id?.slice(0, 8)}</code>
              </td>
              <td className="muted small">{r.user_id?.slice(0, 8)}</td>
              <td className="muted small">{r.ip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
