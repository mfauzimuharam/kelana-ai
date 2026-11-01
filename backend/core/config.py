"""Central application settings, read from environment variables (.env)."""

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")


def _bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _database_url() -> str:
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        # Zero-config fallback so the app still boots for quick local tries.
        return f"sqlite:///{BACKEND_DIR / 'jalan_jalan_ai.db'}"
    # Neon / Render often hand out postgres:// or postgresql:// URLs.
    if url.startswith("postgres://"):
        url = "postgresql+psycopg2://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url


def _knowledge_dir() -> Path:
    configured = os.getenv("KNOWLEDGE_DIR")
    if configured:
        return Path(configured).resolve()
    for candidate in (BACKEND_DIR / "knowledge", BACKEND_DIR.parent / "knowledge"):
        if candidate.is_dir():
            return candidate
    return BACKEND_DIR.parent / "knowledge"


DATABASE_URL = _database_url()

# Amazon Bedrock (Session 5) — boto3 reads AWS_BEARER_TOKEN_BEDROCK itself.
AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-2")
MODEL_ID = os.getenv("MODEL_ID") or os.getenv("BEDROCK_MODEL_ID") or "amazon.nova-lite-v1:0"
AI_MOCK_MODE = _bool("AI_MOCK_MODE", False)

# Knowledge Base / RAG (Session 9)
KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID", "").strip()
KB_MODEL_ARN = os.getenv("KB_MODEL_ARN", "").strip()
KNOWLEDGE_DIR = _knowledge_dir()

# Authentication (Session 8)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-only-change-me")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Conversation memory (Session 10)
CHAT_HISTORY_LIMIT = int(os.getenv("CHAT_HISTORY_LIMIT", "20"))

# CORS (Session 6 + 11) — comma-separated list of allowed frontend origins.
CORS_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
# Optional regex, e.g. https://.*\.vercel\.app for Vercel preview deployments.
CORS_ORIGIN_REGEX = os.getenv("CORS_ORIGIN_REGEX") or None
