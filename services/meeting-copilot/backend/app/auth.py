"""Who is calling, and which workspace they are acting in.

Three ways to sign in, all as `Authorization: Bearer <token>`:
  1. API_TOKEN: the bootstrap owner (Phase 1's single-user token keeps working).
  2. Personal access tokens (`mc_...`) created in Settings; stored as SHA-256 hashes only.
  3. SSO: an OIDC access or ID token from Keycloak, Cognito, Entra ID, Okta... (OIDC_ISSUER).
     First sign-in creates the user and their personal workspace.

`X-Workspace-Id` picks a shared workspace the user belongs to; otherwise their personal one.
Short-lived signed links (HMAC) let the <audio> element play files without the header.
"""

import hashlib
import hmac
import logging
import secrets
import threading
import time
from collections.abc import Iterator
from dataclasses import dataclass

import httpx
from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import Settings, get_settings
from .db import SYSTEM, Scope, new_session
from .models import ApiToken, AuditLog, Membership, Person, User, Workspace, utcnow

log = logging.getLogger(__name__)

TOKEN_PREFIX = "mc_"


@dataclass(frozen=True)
class Principal:
    user_id: str
    display_name: str
    email: str | None
    workspace_id: str
    role: str  # owner | member
    via: str  # bootstrap | token | oidc

    @property
    def scope(self) -> Scope:
        return Scope(self.workspace_id, self.user_id)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def new_token() -> str:
    return TOKEN_PREFIX + secrets.token_urlsafe(32)


# -------------------------------------------------------------------------------- provisioning


def create_user_with_workspace(
    session: Session, display_name: str, email: str | None = None, *, is_bootstrap: bool = False,
    oidc_sub: str | None = None, workspace_name: str | None = None,
) -> tuple[User, Workspace]:  # fmt: skip
    """A new user always gets a personal workspace, and a Person row for themselves in it."""
    user = User(display_name=display_name, email=email, is_bootstrap=is_bootstrap, oidc_sub=oidc_sub)
    ws = Workspace(name=workspace_name or get_settings().default_workspace_name, is_personal=True)
    session.add_all([user, ws])
    session.flush()
    session.add(Membership(workspace_id=ws.id, user_id=user.id, role="owner"))
    session.add(
        Person(workspace_id=ws.id, user_id=user.id, display_name=display_name, email=email, account_user_id=user.id)
    )
    session.flush()
    return user, ws


def ensure_bootstrap_user(session: Session) -> User:
    user = session.scalars(select(User).where(User.is_bootstrap.is_(True))).first()
    if user is None:
        user, _ws = create_user_with_workspace(session, get_settings().owner_name, is_bootstrap=True)
        session.commit()
    return user


def _membership(session: Session, user_id: str, workspace_id: str | None) -> Membership | None:
    stmt = select(Membership).where(Membership.user_id == user_id)
    if workspace_id:
        return session.scalars(stmt.where(Membership.workspace_id == workspace_id)).first()
    # Default: the personal workspace, else the oldest membership.
    rows = (
        session.execute(
            stmt.join(Workspace, Workspace.id == Membership.workspace_id).order_by(
                Workspace.is_personal.desc(), Membership.created_at
            )
        )
        .scalars()
        .all()
    )
    return rows[0] if rows else None


# ------------------------------------------------------------------------------------------ OIDC


class OidcVerifier:
    """Validates OIDC JWTs against the issuer's published keys (discovered once, then cached)."""

    def __init__(self, settings: Settings, http: httpx.Client | None = None):
        self.settings = settings
        self.http = http or httpx.Client(timeout=10.0)
        self._jwks_client = None
        self._discovery: dict | None = None
        self._lock = threading.Lock()

    def discovery(self) -> dict:
        with self._lock:
            if self._discovery is None:
                url = self.settings.oidc_issuer.rstrip("/") + "/.well-known/openid-configuration"
                resp = self.http.get(url)
                resp.raise_for_status()
                self._discovery = resp.json()
        return self._discovery

    def _signing_key(self, token: str):
        import jwt

        if self._jwks_client is None:
            self._jwks_client = jwt.PyJWKClient(self.discovery()["jwks_uri"], cache_keys=True)
        return self._jwks_client.get_signing_key_from_jwt(token).key

    def verify(self, token: str) -> dict:
        import jwt

        key = self._signing_key(token)
        aud = self.settings.effective_oidc_audience or None
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256", "RS384", "RS512", "ES256", "ES384", "PS256"],
            audience=aud,
            issuer=self.settings.oidc_issuer.rstrip("/"),
            options={"verify_aud": aud is not None},
            leeway=30,
        )
        allowed = {d.strip().lower() for d in self.settings.oidc_allowed_domains.split(",") if d.strip()}
        email = (claims.get("email") or "").lower()
        if allowed and email.rsplit("@", 1)[-1] not in allowed:
            raise PermissionError("this email domain is not allowed to sign in")
        return claims


_oidc: OidcVerifier | None = None


def get_oidc() -> OidcVerifier:
    global _oidc
    if _oidc is None:
        _oidc = OidcVerifier(get_settings())
    return _oidc


def set_oidc(verifier: OidcVerifier | None) -> None:
    """Tests: plug in a verifier with a local key set."""
    global _oidc
    _oidc = verifier


def _user_from_oidc(session: Session, claims: dict) -> User:
    sub = str(claims["sub"])
    user = session.scalars(select(User).where(User.oidc_sub == sub)).first()
    if user is not None:
        return user
    email = (claims.get("email") or None) and str(claims["email"]).lower()
    if email:  # an owner may have added this person by email before their first SSO sign-in
        user = session.scalars(select(User).where(User.email == email)).first()
        if user is not None:
            user.oidc_sub = sub
            session.commit()
            return user
    name = claims.get("name") or claims.get("preferred_username") or email or "New user"
    user, _ws = create_user_with_workspace(session, str(name)[:120], email, oidc_sub=sub)
    session.commit()
    log.info("provisioned SSO user %s", user.id)
    return user


# ------------------------------------------------------------------------------ authentication


def _unauthorized(detail: str = "invalid or missing token") -> HTTPException:
    return HTTPException(status.HTTP_401_UNAUTHORIZED, detail, {"WWW-Authenticate": "Bearer"})


def authenticate(session: Session, token: str, workspace_id: str | None) -> Principal:
    settings = get_settings()
    user: User | None = None
    via = ""
    if settings.api_token and hmac.compare_digest(token.encode(), settings.api_token.encode()):
        user, via = ensure_bootstrap_user(session), "bootstrap"
    elif token.startswith(TOKEN_PREFIX):
        row = session.scalars(select(ApiToken).where(ApiToken.token_hash == hash_token(token))).first()
        if row is None or row.revoked_at is not None:
            raise _unauthorized()
        row.last_used_at = utcnow()
        session.commit()
        user, via = session.get(User, row.user_id), "token"
    elif settings.oidc_enabled and token.count(".") == 2:
        try:
            claims = get_oidc().verify(token)
        except PermissionError as e:
            raise HTTPException(status.HTTP_403_FORBIDDEN, str(e)) from e
        except Exception as e:  # expired, wrong issuer/audience, bad signature, discovery down
            log.info("rejected SSO token: %s", e)
            raise _unauthorized("your sign-in expired or is not valid here; sign in again") from e
        user, via = _user_from_oidc(session, claims), "oidc"
    if user is None:
        raise _unauthorized()

    membership = _membership(session, user.id, workspace_id)
    if membership is None:
        if workspace_id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "you are not a member of that workspace")
        raise HTTPException(status.HTTP_403_FORBIDDEN, "your account has no workspace")
    return Principal(
        user_id=user.id,
        display_name=user.display_name,
        email=user.email,
        workspace_id=membership.workspace_id,
        role=membership.role,
        via=via,
    )


def current_principal(
    authorization: str | None = Header(default=None),
    x_workspace_id: str | None = Header(default=None),
) -> Principal:
    settings = get_settings()
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token:
        if not settings.api_token and not settings.oidc_enabled:
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE, "API_TOKEN (or OIDC_ISSUER) is not configured on the server"
            )
        raise _unauthorized()
    session = new_session(SYSTEM)
    try:
        return authenticate(session, token, x_workspace_id or None)
    finally:
        session.close()


# Phase 1 name; routers use it as a dependency.
require_token = current_principal


def require_owner(principal: Principal = Depends(current_principal)) -> Principal:
    if principal.role != "owner":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "only a workspace owner can do that")
    return principal


def get_db(principal: Principal = Depends(current_principal)) -> Iterator[Session]:
    """A session that can only see the caller's workspace."""
    session = new_session(principal.scope)
    session.info["principal"] = principal
    try:
        yield session
    finally:
        session.close()


def audit(
    db: Session, principal: Principal, action: str, target_type: str, target_id: str | None = None,
    request: Request | None = None, **meta,
) -> None:  # fmt: skip
    """Record who viewed, exported or deleted what. Commits with the caller's transaction."""
    db.add(
        AuditLog(
            action=action,
            target_type=target_type,
            target_id=target_id,
            meta=meta,
            ip=(request.client.host if request and request.client else None),
        )
    )


# --------------------------------------------------------------------------------- signed links


def _key(purpose: str) -> bytes:
    return hashlib.sha256(f"{purpose}:".encode() + get_settings().signing_secret.encode()).digest()


def sign_media(meeting_id: str, ttl_s: int = 3600, now: float | None = None) -> tuple[int, str]:
    exp = int((now or time.time()) + ttl_s)
    sig = hmac.new(_key("media-link"), f"{meeting_id}:{exp}".encode(), hashlib.sha256).hexdigest()
    return exp, sig


def verify_media(meeting_id: str, exp: int, sig: str, now: float | None = None) -> bool:
    if exp < (now or time.time()):
        return False
    expected = hmac.new(_key("media-link"), f"{meeting_id}:{exp}".encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, sig)


def sign_value(purpose: str, value: str) -> str:
    return hmac.new(_key(purpose), value.encode(), hashlib.sha256).hexdigest()
