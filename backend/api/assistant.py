"""Session 9 — RAG travel assistant grounded in trusted documents."""

from fastapi import APIRouter, Depends, HTTPException, status

from api.deps import get_current_user
from models import User
from schemas.assistant import AnswerResponse, QuestionRequest
from services.bedrock_service import AIServiceError
from services.kb_service import ask_knowledge_base

router = APIRouter(prefix="/api/v1", tags=["Travel Assistant (RAG)"])


def _answer(request: QuestionRequest) -> AnswerResponse:
    try:
        result = ask_knowledge_base(request.question)
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return AnswerResponse(question=request.question, **result)


@router.post("/assistant", response_model=AnswerResponse)
def assistant(request: QuestionRequest, _: User = Depends(get_current_user)):
    return _answer(request)


@router.post("/ask", response_model=AnswerResponse)
def ask(request: QuestionRequest, _: User = Depends(get_current_user)):
    """Alias of /assistant (both names appear in the Session 9 material)."""
    return _answer(request)
