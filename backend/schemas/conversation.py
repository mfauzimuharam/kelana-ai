from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ConversationCreate(BaseModel):
    title: str | None = Field(default=None, max_length=256, examples=["Japan Family Trip"])


class ConversationUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=256, examples=["Japan Family Trip"])


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=8000, examples=["Plan a family trip to Japan."])


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    role: str
    content: str
    created_at: datetime


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    created_at: datetime
    updated_at: datetime | None
    message_count: int = 0
    last_message: str | None = None


class ConversationCreated(ConversationResponse):
    conversation_id: int


class ConversationDetail(ConversationResponse):
    messages: list[MessageResponse]


class SendMessageResponse(BaseModel):
    conversation: ConversationResponse
    user_message: MessageResponse
    assistant_message: MessageResponse
