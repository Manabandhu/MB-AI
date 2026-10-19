import { createContext, useContext, useEffect, useState } from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { api, getToken, onUnauthorized, setToken } from "./api";
import { ActionItemsPage } from "./pages/ActionItems";
import { AskPage } from "./pages/Ask";
import { LoginPage } from "./pages/Login";
import { MeetingDetailPage } from "./pages/MeetingDetail";
import { MeetingsPage } from "./pages/Meetings";
import { RecordPage } from "./pages/Record";
import type { AppConfig } from "./types";

const ConfigContext = createContext<AppConfig | null>(null);
export const useConfig = () => useContext(ConfigContext);

export default function App() {
  const [authed, setAuthed] = useState(() => !!getToken());
  const [config, setConfig] = useState<AppConfig | null>(null);
  const navigate = useNavigate();

  useEffect(
    () =>
      onUnauthorized(() => {
        setToken(null);
        setAuthed(false);
      }),
    [],
  );

  useEffect(() => {
    if (authed) api.config().then(setConfig).catch(() => undefined);
  }, [authed]);

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

  return (
    <ConfigContext.Provider value={config}>
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
          <NavLink to="/action-items">Action items</NavLink>
        </nav>
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
          <Route path="/action-items" element={<ActionItemsPage />} />
          <Route path="/record" element={<RecordPage />} />
          <Route path="*" element={<p className="empty">That page doesn't exist.</p>} />
        </Routes>
      </main>
    </ConfigContext.Provider>
  );
}
