"""Retrieval-Augmented Generation (Session 9).

Two retrieval backends, same response shape:

1. Amazon Bedrock Knowledge Base (when KNOWLEDGE_BASE_ID is set) — uses the
   RetrieveAndGenerate API; AWS handles chunking, embeddings and retrieval.
2. Local knowledge folder (fallback) — a simple keyword retriever over the
   Markdown/TXT files in knowledge/, then Bedrock generates the answer from the
   retrieved passages. Same "retrieve, then generate" idea, zero AWS setup.
"""

import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from core import config
from services import bedrock_service
from services.bedrock_service import AIServiceError


@dataclass
class Chunk:
    source: str
    heading: str
    text: str


STOPWORDS = {
    "a", "an", "the", "is", "are", "do", "does", "i", "to", "of", "in", "for", "and", "or",
    "on", "my", "me", "we", "you", "it", "can", "what", "which", "how", "need", "with", "be",
    "at", "by", "as", "from", "if", "should", "there", "any", "into", "visit", "about",
    "apa", "yang", "di", "ke", "dan", "untuk", "saya", "bisa", "perlu", "ada", "dengan",
}


def _tokens(text: str) -> set[str]:
    words = re.findall(r"[a-zA-Z0-9]+", text.lower())
    return {w for w in words if w not in STOPWORDS and len(w) > 1}


@lru_cache
def _load_chunks(directory: str) -> list[Chunk]:
    chunks: list[Chunk] = []
    root = Path(directory)
    if not root.is_dir():
        return chunks
    for path in sorted(root.rglob("*")):
        if path.suffix.lower() not in {".md", ".txt"} or path.name.lower() == "readme.md":
            continue
        content = path.read_text(encoding="utf-8")
        title = path.stem
        # Split on Markdown headings so each chunk is one focused section.
        sections = re.split(r"\n(?=#{1,3} )", content)
        for section in sections:
            section = section.strip()
            if not section:
                continue
            first_line = section.splitlines()[0]
            heading = first_line.lstrip("# ").strip() if first_line.startswith("#") else title
            if section.startswith("# ") and len(section.splitlines()) == 1:
                title = heading
                continue
            chunks.append(Chunk(source=path.relative_to(root).as_posix(), heading=heading, text=section))
    return chunks


def retrieve_local(question: str, top_k: int = 3) -> list[Chunk]:
    query = _tokens(question)
    if not query:
        return []
    scored = []
    for chunk in _load_chunks(str(config.KNOWLEDGE_DIR)):
        words = _tokens(chunk.text)
        heading_words = _tokens(chunk.heading + " " + chunk.source)
        score = len(query & words) + 2 * len(query & heading_words)
        if score > 0:
            scored.append((score, chunk))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [chunk for _, chunk in scored[:top_k]]


RAG_SYSTEM_PROMPT = (
    "You are KelanaAI Travel Assistant. Answer the traveler's question using ONLY the "
    "provided context from trusted travel documents. If the context does not contain "
    "the answer, say you could not find it in the knowledge base and suggest checking an "
    "official source. Be concise, answer in the user's language, and use Markdown."
)


def _ask_local(question: str) -> dict:
    chunks = retrieve_local(question)
    sources = _unique_sources(
        [{"name": c.source, "title": c.heading, "excerpt": c.text[:300]} for c in chunks]
    )
    if not chunks:
        return {
            "answer": "I could not find information about that in the KelanaAI knowledge base. "
            "Please check an official source such as the embassy or airline website.",
            "sources": [],
            "mode": "local",
        }
    if config.AI_MOCK_MODE:
        answer = (
            "_AI mock mode is on — showing the most relevant passage from the knowledge base._\n\n"
            + chunks[0].text
        )
        return {"answer": answer, "sources": sources, "mode": "local"}

    context = "\n\n---\n\n".join(f"[Source: {c.source}]\n{c.text}" for c in chunks)
    prompt = f"Context:\n{context}\n\nQuestion: {question}"
    answer = bedrock_service.converse(
        [{"role": "user", "content": prompt}], system=RAG_SYSTEM_PROMPT, max_tokens=1200
    )
    return {"answer": answer, "sources": sources, "mode": "local"}


@lru_cache
def _agent_client():
    return boto3.client("bedrock-agent-runtime", region_name=config.AWS_REGION)


def _model_arn() -> str:
    if config.KB_MODEL_ARN:
        return config.KB_MODEL_ARN
    return f"arn:aws:bedrock:{config.AWS_REGION}::foundation-model/{config.MODEL_ID}"


def _ask_knowledge_base(question: str) -> dict:
    try:
        response = _agent_client().retrieve_and_generate(
            input={"text": question},
            retrieveAndGenerateConfiguration={
                "type": "KNOWLEDGE_BASE",
                "knowledgeBaseConfiguration": {
                    "knowledgeBaseId": config.KNOWLEDGE_BASE_ID,
                    "modelArn": _model_arn(),
                    "retrievalConfiguration": {
                        "vectorSearchConfiguration": {"numberOfResults": 4}
                    },
                },
            },
        )
    except ClientError as exc:
        error = exc.response.get("Error", {})
        raise AIServiceError(
            f"Knowledge Base error ({error.get('Code', 'Unknown')}): {error.get('Message', str(exc))}"
        ) from exc
    except BotoCoreError as exc:
        raise AIServiceError(f"Knowledge Base is unavailable: {exc}") from exc

    sources = []
    for citation in response.get("citations", []):
        for ref in citation.get("retrievedReferences", []):
            uri = ref.get("location", {}).get("s3Location", {}).get("uri", "")
            sources.append({
                "name": uri.rsplit("/", 1)[-1] or "knowledge-base",
                "title": uri,
                "excerpt": ref.get("content", {}).get("text", "")[:300],
            })
    return {
        "answer": response["output"]["text"],
        "sources": _unique_sources(sources),
        "mode": "knowledge_base",
    }


def _unique_sources(sources: list[dict]) -> list[dict]:
    seen, unique = set(), []
    for source in sources:
        if source["name"] not in seen:
            seen.add(source["name"])
            unique.append(source)
    return unique


def ask_knowledge_base(question: str) -> dict:
    """Return {"answer", "sources": [{name, title, excerpt}], "mode"}."""
    if config.KNOWLEDGE_BASE_ID and not config.AI_MOCK_MODE:
        return _ask_knowledge_base(question)
    return _ask_local(question)
