from pydantic import BaseModel, Field


class QuestionRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000, examples=["Do I need a visa to visit Japan?"])


class Source(BaseModel):
    name: str
    title: str | None = None
    excerpt: str | None = None


class AnswerResponse(BaseModel):
    question: str
    answer: str
    sources: list[Source]
    mode: str = Field(description='"knowledge_base" (Amazon Bedrock KB) or "local" (knowledge/ folder)')
