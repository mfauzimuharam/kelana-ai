"""Conversation memory (Session 10).

LLMs are stateless — the application owns the memory. Before every Bedrock
call we rebuild the prompt from the conversation history stored in PostgreSQL,
trimmed to the most recent messages to control cost and context length.
"""

from core.config import CHAT_HISTORY_LIMIT
from services.bedrock_service import SYSTEM_PROMPT

DEFAULT_TITLE = "New conversation"


def build_system_prompt(user_name: str, trips: list) -> str:
    """Give the model light, useful context about who it is talking to."""
    prompt = SYSTEM_PROMPT + f"\nYou are chatting with {user_name}."
    if trips:
        summary = "; ".join(
            f"{t.destination} ({t.days} days, {t.budget:,.0f} {t.currency}, {t.travel_style or 'general'})"
            for t in trips[:5]
        )
        prompt += f"\nTheir saved KelanaAI trips: {summary}."
    return prompt


def build_prompt_messages(history: list, limit: int = CHAT_HISTORY_LIMIT) -> list[dict]:
    """Turn stored Message rows into a Bedrock-ready message list.

    Rules enforced for the Converse API:
    - only the last `limit` messages are sent (context-window trimming)
    - the list must start with a "user" message
    - roles must alternate; consecutive same-role messages are merged
    """
    recent = [{"role": m.role, "content": m.content} for m in history][-limit:]
    while recent and recent[0]["role"] != "user":
        recent.pop(0)

    merged: list[dict] = []
    for message in recent:
        if merged and merged[-1]["role"] == message["role"]:
            merged[-1]["content"] += "\n\n" + message["content"]
        else:
            merged.append(dict(message))
    return merged


def make_title(first_message: str, max_length: int = 60) -> str:
    """Auto-title a conversation from its first user message."""
    text = " ".join(first_message.split())
    if len(text) <= max_length:
        return text or DEFAULT_TITLE
    return text[: max_length - 1].rsplit(" ", 1)[0] + "…"
