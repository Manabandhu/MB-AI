from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..auth import Principal, current_principal, get_db, require_token
from ..config import get_settings
from ..providers import ProviderError, get_embedder, get_llm
from ..retrieval import answer, search
from ..schemas import ChatRequest, ChatResponse, SearchHit

router = APIRouter(prefix="/api", dependencies=[Depends(require_token)])


@router.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest, db: Session = Depends(get_db), principal: Principal = Depends(current_principal)):
    try:
        return answer(db, get_llm(), get_embedder(), body, get_settings(), owner_name=principal.display_name)
    except ProviderError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e)) from e


@router.get("/search", response_model=list[SearchHit])
def search_route(
    q: str = Query(min_length=1, max_length=500), limit: int = Query(10, le=50), db: Session = Depends(get_db)
):
    try:
        return search(db, get_embedder(), q, limit)
    except ProviderError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e)) from e
