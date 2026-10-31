"""Session 10 — conversational AI chat with memory stored in PostgreSQL."""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from api.deps import get_current_user
from database import get_db
from models import Conversation, Message, Trip, User
from schemas.conversation import (
    ConversationCreate,
    ConversationCreated,
    ConversationDetail,
    ConversationResponse,
    ConversationUpdate,
    MessageCreate,
    MessageResponse,
    SendMessageResponse,
)
from services import bedrock_service
from services.bedrock_service import AIServiceError
from services.chat_service import DEFAULT_TITLE, build_prompt_messages, build_system_prompt, make_title

router = APIRouter(prefix="/api/v1/conversations", tags=["Conversations"])


def get_owned_conversation(conversation_id: int, user: User, db: Session) -> Conversation:
    conversation = db.get(Conversation, conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail=f"Conversation with id {conversation_id} not found")
    if conversation.user_id != user.id:
        raise HTTPException(status_code=403, detail="You do not have access to this conversation")
    return conversation


def to_response(conversation: Conversation, db: Session) -> ConversationResponse:
    count = db.scalar(select(func.count(Message.id)).where(Message.conversation_id == conversation.id))
    last = db.scalar(
        select(Message.content)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.id.desc())
        .limit(1)
    )
    return ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=count or 0,
        last_message=last[:120] if last else None,
    )


@router.post("", response_model=ConversationCreated, status_code=status.HTTP_201_CREATED)
def create_conversation(
    request: ConversationCreate | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    title = (request.title or "").strip() if request else ""
    conversation = Conversation(user_id=user.id, title=title or DEFAULT_TITLE)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return ConversationCreated(**to_response(conversation, db).model_dump(), conversation_id=conversation.id)


@router.get("", response_model=list[ConversationResponse])
def list_conversations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conversations = db.scalars(
        select(Conversation)
        .where(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc(), Conversation.id.desc())
    ).all()
    return [to_response(c, db) for c in conversations]


@router.get("/{conversation_id}", response_model=ConversationDetail)
def get_conversation(
    conversation_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    conversation = get_owned_conversation(conversation_id, user, db)
    return ConversationDetail(
        **to_response(conversation, db).model_dump(),
        messages=[MessageResponse.model_validate(m) for m in conversation.messages],
    )


@router.patch("/{conversation_id}", response_model=ConversationResponse)
def rename_conversation(
    conversation_id: int,
    request: ConversationUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = get_owned_conversation(conversation_id, user, db)
    conversation.title = request.title.strip() or conversation.title
    db.commit()
    db.refresh(conversation)
    return to_response(conversation, db)


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    conversation = get_owned_conversation(conversation_id, user, db)
    db.delete(conversation)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{conversation_id}/messages", response_model=SendMessageResponse)
def send_message(
    conversation_id: int,
    request: MessageCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Receive -> save -> load history -> build prompt -> Bedrock -> save reply -> return."""
    conversation = get_owned_conversation(conversation_id, user, db)
    content = request.content.strip()
    if not content:
        raise HTTPException(status_code=422, detail="Message must not be empty")

    # 1-2. Receive and save the user's message
    user_message = Message(conversation_id=conversation.id, role="user", content=content)
    db.add(user_message)
    if conversation.title == DEFAULT_TITLE:
        conversation.title = make_title(content)
    db.commit()
    db.refresh(user_message)

    # 3-4. Load previous messages and rebuild the prompt (the app owns memory)
    history = db.scalars(
        select(Message).where(Message.conversation_id == conversation.id).order_by(Message.id)
    ).all()
    trips = db.scalars(
        select(Trip).where(Trip.user_id == user.id).order_by(Trip.created_at.desc()).limit(5)
    ).all()
    prompt_messages = build_prompt_messages(history)
    system_prompt = build_system_prompt(user.name, trips)

    # 5. Ask Amazon Bedrock
    try:
        reply = bedrock_service.chat(prompt_messages, system=system_prompt)
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    # 6. Save the AI response
    assistant_message = Message(conversation_id=conversation.id, role="assistant", content=reply)
    db.add(assistant_message)
    conversation.updated_at = func.now()
    db.commit()
    db.refresh(assistant_message)
    db.refresh(conversation)

    # 7. Return response
    return SendMessageResponse(
        conversation=to_response(conversation, db),
        user_message=MessageResponse.model_validate(user_message),
        assistant_message=MessageResponse.model_validate(assistant_message),
    )
