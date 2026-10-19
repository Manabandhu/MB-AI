import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { api, getToken, getWorkspace, onUnauthorized, setToken, setWorkspace } from "./api";
import { finishSso } from "./lib/oidc";
import { AskPage } from "./pages/Ask";
import { CommitmentsPage } from "./pages/Commitments";
import { InsightsPage } from "./pages/Insights";
import { LiveSessionPage, LiveSetupPage } from "./pages/Live";
import { LoginPage } from "./pages/Login";
import { MeetingDetailPage } from "./pages/MeetingDetail";
import { MeetingsPage } from "./pages/Meetings";
import { PeoplePage } from "./pages/People";
import { RecordPage } from "./pages/Record";
import { SettingsPage } from "./pages/Settings";
import type { AppConfig, Me } from "./types";

const ConfigContext = createContext<AppConfig | null>(null);
export const useConfig = () => useContext(ConfigContext);

const MeContext = createContext<{ me: Me | null; reload: () => void }>({ me: null, reload: () => undefined });
export const useMe = () => useContext(MeContext);

function SsoCallback({ onSignedIn }: { onSignedIn: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    finishSso()
      .then((token) => {
        setToken(token);
        onSignedIn();
        navigate("/", { replace: true });
      })
      .catch((e) => setError(String(e.message ?? e)));
  }, [navigate, onSignedIn]);
  return <div className="login">{error ? <p className="error">{error}</p> : <p className="muted">Signing you in…</p>}</div>;
}

export default function App() {
  const [authed, setAuthed] = useState(() => !!getToken());
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(
    () =>
      onUnauthorized(() => {
        setToken(null);
        setAuthed(false);
      }),
    [],
  );

  const reload = useCallback(() => {
    api.config().then(setConfig).catch(() => undefined);
    api.me().then(setMe).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (authed) reload();
  }, [authed, reload]);

  const signedIn = useCallback(() => setAuthed(true), []);

  if (location.pathname === "/auth/callback") return <SsoCallback onSignedIn={signedIn} />;
  if (!authed) {
    return (
      <LoginPage
        onSignedIn={() => {
          setAuthed(true);
          navigate("/");
        }}
      />
    );
  }

  const workspaces = me?.workspaces ?? [];
  return (
    <ConfigContext.Provider value={config}>
      <MeContext.Provider value={{ me, reload }}>
        <header className="topbar">
          <NavLink to="/" className="brand" end>
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <rect x="3" y="7" width="26" height="4" rx="2" fill="var(--voice-owner)" />
              <rect x="3" y="14" width="16" height="4" rx="2" fill="var(--voice-1)" />
              <rect x="11" y="21" width="18" height="4" rx="2" fill="var(--voice-2)" />
            </svg>
            Meeting Copilot
          </NavLink>
          <nav aria-label="Main">
            <NavLink to="/" end>
              Meetings
            </NavLink>
            <NavLink to="/ask">Ask</NavLink>
            <NavLink to="/commitments">Commitments</NavLink>
            <NavLink to="/people">People</NavLink>
            <NavLink to="/insights">Insights</NavLink>
            <NavLink to="/settings">Settings</NavLink>
          </nav>
          {workspaces.length > 1 && (
            <select
              className="workspace-switch"
              aria-label="Workspace"
              value={getWorkspace() ?? me?.workspace_id ?? ""}
              onChange={(e) => {
                const ws = workspaces.find((w) => w.id === e.target.value);
                setWorkspace(ws?.is_personal ? null : e.target.value);
                navigate("/");
                location.pathname === "/" ? window.location.reload() : setTimeout(() => window.location.reload(), 0);
              }}
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.is_personal ? "Personal" : w.name}
                </option>
              ))}
            </select>
          )}
          <NavLink to="/live" className="button live-link">
            Live
          </NavLink>
          <NavLink to="/record" className="button primary record-link">
            <span className="rec-dot" aria-hidden="true" />
            Record
          </NavLink>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<MeetingsPage />} />
            <Route path="/meetings/:id" element={<MeetingDetailPage />} />
            <Route path="/ask" element={<AskPage />} />
            <Route path="/commitments" element={<CommitmentsPage />} />
            <Route path="/action-items" element={<Navigate to="/commitments" replace />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/record" element={<RecordPage />} />
            <Route path="/live" element={<LiveSetupPage />} />
            <Route path="/live/:id" element={<LiveSessionPage />} />
            <Route path="*" element={<p className="empty">That page doesn't exist.</p>} />
          </Routes>
        </main>
      </MeContext.Provider>
    </ConfigContext.Provider>
  );
}
