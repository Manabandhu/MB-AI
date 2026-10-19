"""Your account, access tokens, shared workspaces, members and the audit log."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import (
    Principal,
    create_user_with_workspace,
    current_principal,
    get_db,
    hash_token,
    new_token,
    require_owner,
)
from ..db import SYSTEM, new_session
from ..models import ApiToken, AuditLog, Membership, Person, User, Workspace, utcnow

router = APIRouter(prefix="/api", dependencies=[Depends(current_principal)])


class WorkspaceOut(BaseModel):
    id: str
    name: str
    is_personal: bool
    role: str


class MeOut(BaseModel):
    id: str
    display_name: str
    email: str | None
    aliases: list[str]
    watched_keywords: list[str]
    via: str
    workspace_id: str
    role: str
    workspaces: list[WorkspaceOut]


class MeUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=120)
    aliases: list[str] | None = None
    watched_keywords: list[str] | None = None


class TokenOut(BaseModel):
    id: str
    name: str
    prefix: str
    created_at: datetime
    last_used_at: datetime | None
    revoked_at: datetime | None


class TokenCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class TokenCreated(TokenOut):
    token: str  # shown once


class WorkspaceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class MemberOut(BaseModel):
    user_id: str
    display_name: str
    email: str | None
    role: str


class MemberAdd(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    display_name: str = Field(default="", max_length=120)
    role: str = Field(default="member", pattern="^(owner|member)$")
    issue_token: bool = False  # for people who won't use SSO


class MemberAdded(MemberOut):
    token: str | None = None


class AuditOut(BaseModel):
    id: int
    user_id: str | None
    action: str
    target_type: str
    target_id: str | None
    meta: dict
    ip: str | None
    at: datetime


def _clean(items: list[str]) -> list[str]:
    return list(dict.fromkeys(i.strip() for i in items if i.strip()))[:50]


def _me(principal: Principal) -> MeOut:
    with new_session(SYSTEM) as s:
        user = s.get(User, principal.user_id)
        rows = s.execute(
            select(Workspace, Membership.role)
            .join(Membership, Membership.workspace_id == Workspace.id)
            .where(Membership.user_id == principal.user_id)
            .order_by(Workspace.is_personal.desc(), Workspace.name)
        ).all()
        return MeOut(
            id=user.id,
            display_name=user.display_name,
            email=user.email,
            aliases=user.aliases or [],
            watched_keywords=user.watched_keywords or [],
            via=principal.via,
            workspace_id=principal.workspace_id,
            role=principal.role,
            workspaces=[WorkspaceOut(id=w.id, name=w.name, is_personal=w.is_personal, role=r) for w, r in rows],
        )


@router.get("/me", response_model=MeOut)
def me(principal: Principal = Depends(current_principal)):
    return _me(principal)


@router.patch("/me", response_model=MeOut)
def update_me(body: MeUpdate, principal: Principal = Depends(current_principal)):
    with new_session(SYSTEM) as s:
        user = s.get(User, principal.user_id)
        if body.display_name is not None:
            user.display_name = body.display_name.strip()
            for person in s.scalars(select(Person).where(Person.account_user_id == user.id)):
                person.display_name = user.display_name
        if body.aliases is not None:
            user.aliases = _clean(body.aliases)
        if body.watched_keywords is not None:
            user.watched_keywords = _clean(body.watched_keywords)
        s.commit()
    return _me(principal)


# ---------------------------------------------------------------------------------------- tokens


@router.get("/tokens", response_model=list[TokenOut])
def list_tokens(principal: Principal = Depends(current_principal)):
    with new_session(SYSTEM) as s:
        rows = s.scalars(
            select(ApiToken).where(ApiToken.user_id == principal.user_id).order_by(ApiToken.created_at.desc())
        ).all()
        return [TokenOut.model_validate(r, from_attributes=True) for r in rows]


@router.post("/tokens", response_model=TokenCreated, status_code=status.HTTP_201_CREATED)
def create_token(body: TokenCreate, principal: Principal = Depends(current_principal)):
    token = new_token()
    with new_session(SYSTEM) as s:
        row = ApiToken(
            user_id=principal.user_id, name=body.name.strip(), token_hash=hash_token(token), prefix=token[:8]
        )
        s.add(row)
        s.commit()
        return TokenCreated(**TokenOut.model_validate(row, from_attributes=True).model_dump(), token=token)


@router.delete("/tokens/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_token(token_id: str, principal: Principal = Depends(current_principal)):
    with new_session(SYSTEM) as s:
        row = s.get(ApiToken, token_id)
        if row is None or row.user_id != principal.user_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "token not found")
        row.revoked_at = row.revoked_at or utcnow()
        s.commit()


# ---------------------------------------------------------------------------- shared workspaces


@router.post("/workspaces", response_model=WorkspaceOut, status_code=status.HTTP_201_CREATED)
def create_workspace(body: WorkspaceCreate, principal: Principal = Depends(current_principal)):
    """A shared team workspace. Its meetings, people and memory are visible to every member."""
    with new_session(SYSTEM) as s:
        ws = Workspace(name=body.name.strip(), is_personal=False)
        s.add(ws)
        s.flush()
        s.add(Membership(workspace_id=ws.id, user_id=principal.user_id, role="owner"))
        user = s.get(User, principal.user_id)
        s.add(
            Person(
                workspace_id=ws.id,
                user_id=user.id,
                display_name=user.display_name,
                email=user.email,
                account_user_id=user.id,
            )  # fmt: skip
        )
        s.commit()
        return WorkspaceOut(id=ws.id, name=ws.name, is_personal=False, role="owner")


@router.get("/workspace/members", response_model=list[MemberOut])
def list_members(principal: Principal = Depends(current_principal)):
    with new_session(SYSTEM) as s:
        rows = s.execute(
            select(User, Membership.role)
            .join(Membership, Membership.user_id == User.id)
            .where(Membership.workspace_id == principal.workspace_id)
            .order_by(User.display_name)
        ).all()
        return [MemberOut(user_id=u.id, display_name=u.display_name, email=u.email, role=r) for u, r in rows]


@router.post("/workspace/members", response_model=MemberAdded, status_code=status.HTTP_201_CREATED)
def add_member(body: MemberAdd, request: Request, principal: Principal = Depends(require_owner)):
    email = body.email.strip().lower()
    with new_session(SYSTEM) as s:
        ws = s.get(Workspace, principal.workspace_id)
        if ws.is_personal:
            raise HTTPException(422, "personal workspaces can't be shared; create a team workspace first")
        user = s.scalars(select(User).where(User.email == email)).first()
        if user is None:
            user, _personal = create_user_with_workspace(s, body.display_name.strip() or email.split("@")[0], email)
        if s.get(Membership, (ws.id, user.id)) is None:
            s.add(Membership(workspace_id=ws.id, user_id=user.id, role=body.role))
            s.add(
                Person(
                    workspace_id=ws.id,
                    user_id=principal.user_id,
                    display_name=user.display_name,
                    email=user.email,
                    account_user_id=user.id,
                )  # fmt: skip
            )
        token = None
        if body.issue_token:
            token = new_token()
            s.add(
                ApiToken(user_id=user.id, name=f"invite to {ws.name}", token_hash=hash_token(token), prefix=token[:8])
            )
        s.add(
            AuditLog(
                workspace_id=ws.id,
                user_id=principal.user_id,
                action="member_add",
                target_type="user",
                target_id=user.id,
                meta={"email": email, "role": body.role},
                ip=request.client.host if request.client else None,
            )  # fmt: skip
        )
        s.commit()
        return MemberAdded(
            user_id=user.id, display_name=user.display_name, email=user.email, role=body.role, token=token
        )


@router.delete("/workspace/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(user_id: str, principal: Principal = Depends(require_owner)):
    with new_session(SYSTEM) as s:
        ws = s.get(Workspace, principal.workspace_id)
        m = s.get(Membership, (principal.workspace_id, user_id))
        if m is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "not a member")
        if ws.is_personal or user_id == principal.user_id:
            raise HTTPException(422, "you can't remove yourself or anyone from a personal workspace")
        s.delete(m)
        s.commit()


@router.get("/audit", response_model=list[AuditOut])
def audit_log(
    action: str | None = None, limit: int = Query(200, le=1000), db: Session = Depends(get_db),
    principal: Principal = Depends(require_owner),
):  # fmt: skip
    stmt = select(AuditLog).order_by(AuditLog.at.desc()).limit(limit)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    return [AuditOut.model_validate(r, from_attributes=True) for r in db.scalars(stmt)]
