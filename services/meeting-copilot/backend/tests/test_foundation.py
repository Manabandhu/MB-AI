"""Tenancy, auth, row-level security, consent, audit, export and privacy."""

import time

import pytest
from sqlalchemy import create_engine, text

from app.auth import OidcVerifier, set_oidc
from app.config import get_settings
from app.db import SYSTEM, Scope, ScopeError, get_engine, new_session, session_scope
from app.models import AuditLog, Meeting
from app.privacy import is_remote_url, redact_pii, third_party_providers
from app.worker import build_providers, run_once

from .conftest import AUTH


def _token(client, headers=AUTH, name="t") -> str:
    r = client.post("/api/tokens", json={"name": name}, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()["token"]


def _meeting(client, headers, **kw):
    body = {"title": "Sync", "profile": "general", "consent_confirmed": True} | kw
    r = client.post("/api/meetings", json=body, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def test_bootstrap_token_and_me(client):
    me = client.get("/api/me", headers=AUTH).json()
    assert me["display_name"] == "Sai" and me["via"] == "bootstrap" and me["role"] == "owner"
    assert len(me["workspaces"]) == 1 and me["workspaces"][0]["is_personal"]
    r = client.patch("/api/me", json={"aliases": ["Sai K", " "], "watched_keywords": ["VPN"]}, headers=AUTH)
    assert r.json()["aliases"] == ["Sai K"] and r.json()["watched_keywords"] == ["VPN"]


def test_personal_tokens_are_hashed_and_revocable(client):
    token = _token(client)
    h = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/me", headers=h).json()["via"] == "token"
    with session_scope() as s:
        assert token not in str(s.execute(text("SELECT token_hash, prefix FROM api_tokens")).all())
    tid = client.get("/api/tokens", headers=AUTH).json()[0]["id"]
    assert client.delete(f"/api/tokens/{tid}", headers=AUTH).status_code == 204
    assert client.get("/api/me", headers=h).status_code == 401


def test_workspaces_are_isolated_and_shared_workspaces_share(client):
    # Bootstrap owner creates a team workspace and adds a colleague with a token.
    team = client.post("/api/workspaces", json={"name": "Platform team"}, headers=AUTH).json()
    owner_team = AUTH | {"X-Workspace-Id": team["id"]}
    added = client.post(
        "/api/workspace/members",
        json={"email": "Priya@Example.com", "display_name": "Priya", "issue_token": True},
        headers=owner_team,
    ).json()
    assert added["email"] == "priya@example.com" and added["token"]
    priya = {"Authorization": f"Bearer {added['token']}"}
    priya_team = priya | {"X-Workspace-Id": team["id"]}

    private = _meeting(client, AUTH, title="My private 1:1")
    shared = _meeting(client, owner_team, title="Team standup")
    priyas_own = _meeting(client, priya, title="Priya's notes")

    # Priya's default workspace is her own personal one.
    assert [m["title"] for m in client.get("/api/meetings", headers=priya).json()] == ["Priya's notes"]
    assert [m["title"] for m in client.get("/api/meetings", headers=priya_team).json()] == ["Team standup"]
    assert client.get(f"/api/meetings/{private['id']}", headers=priya).status_code == 404
    assert client.get(f"/api/meetings/{private['id']}", headers=priya_team).status_code == 404
    assert client.get(f"/api/meetings/{shared['id']}", headers=priya_team).status_code == 200
    assert client.delete(f"/api/meetings/{priyas_own['id']}", headers=AUTH).status_code == 404

    # A workspace you don't belong to is refused outright.
    me_personal = client.get("/api/me", headers=AUTH).json()["workspace_id"]
    assert client.get("/api/meetings", headers=priya | {"X-Workspace-Id": me_personal}).status_code == 403
    # Only owners manage members.
    r = client.post("/api/workspace/members", json={"email": "x@example.com"}, headers=priya_team)
    assert r.status_code == 403
    members = client.get("/api/workspace/members", headers=priya_team).json()
    assert {m["display_name"] for m in members} == {"Sai", "Priya"}


def test_orm_refuses_cross_workspace_writes_and_unscoped_sessions(client):
    m = _meeting(client, AUTH)
    with new_session(SYSTEM) as s:
        ws = s.get(Meeting, m["id"]).workspace_id
    with new_session(Scope("other-workspace", None)) as s:
        assert s.get(Meeting, m["id"]) is None
        s.add(Meeting(title="x", workspace_id=ws))
        with pytest.raises(ScopeError):
            s.flush()
    s = get_engine()  # a session with no scope at all fails closed
    from sqlalchemy.orm import Session

    with Session(s) as raw, pytest.raises(ScopeError):
        raw.query(Meeting).all()


def test_row_level_security_for_a_non_owner_role(client):
    """With the app connected as an ordinary role, Postgres itself hides other workspaces' rows."""
    m = _meeting(client, AUTH)
    other = client.post("/api/workspaces", json={"name": "Other"}, headers=AUTH).json()
    _meeting(client, AUTH | {"X-Workspace-Id": other["id"]}, title="Other meeting")
    with new_session(SYSTEM) as s:
        ws = s.get(Meeting, m["id"]).workspace_id
    with get_engine().begin() as conn:
        conn.execute(text("DROP ROLE IF EXISTS copilot_app_test"))
        conn.execute(text("CREATE ROLE copilot_app_test LOGIN PASSWORD 'x' NOSUPERUSER NOBYPASSRLS"))
        conn.execute(text("GRANT USAGE ON SCHEMA public TO copilot_app_test"))
        conn.execute(text("GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO copilot_app_test"))
    url = get_engine().url.set(username="copilot_app_test", password="x")
    app_engine = create_engine(url)
    try:
        with app_engine.begin() as conn:
            assert conn.execute(text("SELECT count(*) FROM meetings")).scalar() == 0  # no scope set: nothing
            conn.execute(text("SELECT set_config('app.workspace_id', :w, true)"), {"w": ws})
            titles = conn.execute(text("SELECT title FROM meetings")).scalars().all()
            assert titles == ["Sync"]
            with pytest.raises(Exception):  # noqa: B017 - the policy's WITH CHECK rejects it
                conn.execute(
                    text(
                        "INSERT INTO meetings (id, title, profile, profile_source, started_at, attendees, "
                        "channel_layout, consent_confirmed, status, requested_stage, attempts, created_at, "
                        "updated_at, workspace_id) VALUES ('x', 'sneaky', 'general', 'user', now(), '[]', 'mono', "
                        "false, 'created', 'full', 0, now(), now(), :w)"
                    ),
                    {"w": other["id"]},
                )
    finally:
        app_engine.dispose()
        with get_engine().begin() as conn:
            conn.execute(text("DROP OWNED BY copilot_app_test"))
            conn.execute(text("DROP ROLE copilot_app_test"))


def test_upload_requires_consent_and_consent_is_logged(client, tmp_audio):
    m = _meeting(client, AUTH, consent_confirmed=False)
    assert m["consent_state"] == "pending"
    path = tmp_audio("a.wav", 3.0, [[(0.5, 2.0, 400)]])
    with open(path, "rb") as fh:
        r = client.put(f"/api/meetings/{m['id']}/audio", files={"file": ("a.wav", fh)}, headers=AUTH)
    assert r.status_code == 409 and "consent" in r.json()["detail"]
    r = client.post(
        f"/api/meetings/{m['id']}/consent", json={"method": "verbal", "note": "asked at start"}, headers=AUTH
    )
    d = r.json()
    assert d["consent_state"] == "confirmed" and d["consent_log"][0]["method"] == "verbal"
    assert d["consent_log"][0]["by"] == "Sai"
    with open(path, "rb") as fh:
        assert (
            client.put(f"/api/meetings/{m['id']}/audio", files={"file": ("a.wav", fh)}, headers=AUTH).status_code == 200
        )


def test_audit_log_and_export(client, tmp_audio):
    m = _meeting(client, AUTH, channel_layout="mono")
    path = tmp_audio("a.wav", 6.0, [[(0.5, 2.0, 400), (3.0, 5.0, 800)]])
    with open(path, "rb") as fh:
        client.put(f"/api/meetings/{m['id']}/audio", files={"file": ("a.wav", fh)}, headers=AUTH)
    assert run_once(build_providers())
    client.get(f"/api/meetings/{m['id']}", headers=AUTH)
    md = client.get(f"/api/meetings/{m['id']}/export", params={"format": "md"}, headers=AUTH)
    assert md.status_code == 200 and md.text.startswith("# Sync") and "## Transcript" in md.text
    js = client.get(f"/api/meetings/{m['id']}/export", params={"format": "json"}, headers=AUTH).json()
    assert js["transcript"] and js["speakers"]
    client.get(f"/api/meetings/{m['id']}/audio-url", headers=AUTH)
    log = client.get("/api/audit", headers=AUTH).json()
    actions = [e["action"] for e in log]
    assert {"view", "export", "listen"} <= set(actions)
    assert all(e["target_id"] == m["id"] for e in log)
    with session_scope() as s:
        assert s.query(AuditLog).count() == len(log)


def test_pii_redaction():
    cats = {"email", "phone", "card", "ssn"}
    out = redact_pii(
        "Mail priya@corp.com or call +1 (555) 123-4567, card 4111 1111 1111 1111, ssn 123-45-6789, "
        "ticket 4111 1111 1111 1112 and 3 people at 10:30",
        cats,
    )
    assert "[email]" in out and "[phone]" in out and "[card]" in out and "[ssn]" in out
    assert "4111 1111 1111 1112" in out  # fails the Luhn check, so it isn't a card number
    assert "3 people at 10:30" in out
    assert redact_pii("priya@corp.com", {"phone"}) == "priya@corp.com"


def test_redaction_applies_to_stored_transcripts(client, tmp_audio, monkeypatch):
    from app.providers import fakes

    monkeypatch.setattr(fakes, "DEMO_LINES", ["Reach me at sam@example.com after this."])
    m = _meeting(client, AUTH, channel_layout="mono")
    path = tmp_audio("a.wav", 3.0, [[(0.5, 2.0, 400)]])
    with open(path, "rb") as fh:
        client.put(f"/api/meetings/{m['id']}/audio", files={"file": ("a.wav", fh)}, headers=AUTH)
    assert run_once(build_providers())
    d = client.get(f"/api/meetings/{m['id']}", headers=AUTH).json()
    assert d["segments"][0]["text"] == "Reach me at [email] after this."


def test_local_only_meetings_refuse_third_party_providers(client, tmp_audio, monkeypatch):
    settings = get_settings()
    assert is_remote_url("https://api.openai.com/v1") and not is_remote_url("http://ollama:11434/v1")
    assert not is_remote_url("http://10.0.0.5:8000/v1")
    providers = build_providers()  # the fakes; only the setting says "bedrock"
    monkeypatch.setattr(settings, "llm_provider", "bedrock")
    assert third_party_providers(settings) == ["LLM_PROVIDER=bedrock"]
    m = _meeting(client, AUTH, channel_layout="mono", local_only=True)
    path = tmp_audio("a.wav", 3.0, [[(0.5, 2.0, 400)]])
    with open(path, "rb") as fh:
        client.put(f"/api/meetings/{m['id']}/audio", files={"file": ("a.wav", fh)}, headers=AUTH)
    assert run_once(providers)
    d = client.get(f"/api/meetings/{m['id']}", headers=AUTH).json()
    assert d["status"] == "failed" and "local-only" in d["error"] and "bedrock" in d["error"]


# ------------------------------------------------------------------------------------------- SSO


class _LocalOidc(OidcVerifier):
    def __init__(self, settings, public_key):
        super().__init__(settings)
        self.public_key = public_key

    def _signing_key(self, token):
        return self.public_key


@pytest.fixture
def oidc(monkeypatch):
    import jwt
    from cryptography.hazmat.primitives.asymmetric import rsa

    settings = get_settings()
    monkeypatch.setattr(settings, "oidc_issuer", "https://sso.example.com/realms/team")
    monkeypatch.setattr(settings, "oidc_client_id", "copilot-web")
    monkeypatch.setattr(settings, "oidc_allowed_domains", "example.com")
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    set_oidc(_LocalOidc(settings, key.public_key()))

    def issue(sub="u-1", email="dev@example.com", name="Dev", aud="copilot-web", exp=None, issuer=None):
        claims = {
            "sub": sub, "email": email, "name": name, "aud": aud,
            "iss": issuer or settings.oidc_issuer, "exp": exp or int(time.time()) + 300,
        }  # fmt: skip
        return jwt.encode(claims, key, algorithm="RS256")

    yield issue
    set_oidc(None)


def test_sso_provisions_users_and_rejects_bad_tokens(client, oidc):
    h = {"Authorization": f"Bearer {oidc()}"}
    me = client.get("/api/me", headers=h).json()
    assert me["via"] == "oidc" and me["email"] == "dev@example.com" and me["display_name"] == "Dev"
    assert client.get("/api/me", headers=h).json()["id"] == me["id"]  # same user next time
    assert client.get("/api/me", headers={"Authorization": f"Bearer {oidc(aud='other')}"}).status_code == 401
    assert (
        client.get("/api/me", headers={"Authorization": f"Bearer {oidc(exp=int(time.time()) - 600)}"}).status_code
        == 401
    )
    assert client.get("/api/me", headers={"Authorization": f"Bearer {oidc(issuer='https://evil')}"}).status_code == 401
    r = client.get("/api/me", headers={"Authorization": f"Bearer {oidc(sub='u-2', email='x@gmail.com')}"})
    assert r.status_code == 403
    cfg = client.get("/api/auth-config").json()
    assert cfg["oidc"]["client_id"] == "copilot-web"


def test_sso_links_to_an_invited_email(client, oidc):
    team = client.post("/api/workspaces", json={"name": "Team"}, headers=AUTH).json()
    client.post(
        "/api/workspace/members", json={"email": "new@example.com"}, headers=AUTH | {"X-Workspace-Id": team["id"]}
    )
    h = {"Authorization": f"Bearer {oidc(sub='u-9', email='new@example.com')}"}
    me = client.get("/api/me", headers=h).json()
    assert team["id"] in {w["id"] for w in me["workspaces"]}


# ---------------------------------------------------------------------------- Phase 1 upgrade


def test_phase1_database_is_upgraded_in_place(db):
    """A database created by the Phase 1 build (no alembic_version) keeps its meetings."""
    from alembic import command

    from app.db import _alembic_config, init_db

    engine = get_engine()
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    with engine.connect() as conn:
        command.upgrade(_alembic_config(conn), "0001")
        conn.commit()
        conn.execute(text("DROP TABLE alembic_version"))  # Phase 1 used create_all, no version table
        conn.execute(
            text(
                "INSERT INTO meetings (id, title, profile, started_at, attendees, channel_layout, consent_confirmed, "
                "status, requested_stage, attempts, created_at, updated_at) VALUES ('old', 'Old standup', 'standup', "
                "now(), '[]', 'mono', true, 'done', 'full', 1, now(), now())"
            )
        )
        conn.commit()
    init_db()
    with session_scope() as s:
        m = s.get(Meeting, "old")
        assert m.workspace_id and m.user_id and m.consent_state == "confirmed"
