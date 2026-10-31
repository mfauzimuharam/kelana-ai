"""Amazon Bedrock integration (Session 5) using the Converse API.

Authentication: boto3 automatically reads AWS_BEARER_TOKEN_BEDROCK (Bedrock
API key) from the environment — or standard IAM credentials in production.

AI_MOCK_MODE=true returns clearly-labelled sample text instead of calling
Bedrock, so the app can be developed and tested without AWS access.
"""

from functools import lru_cache

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from core import config
from services.trip_service import get_recommended_places


class AIServiceError(Exception):
    """Raised when Amazon Bedrock cannot produce a response."""


SYSTEM_PROMPT = (
    "You are Jalan-Jalan AI, an experienced and friendly travel planner. "
    "Give practical, specific and budget-aware travel advice. "
    "Always answer in the same language the user writes in. "
    "Format answers as Markdown."
)


@lru_cache
def get_client():
    """Create the Bedrock Runtime client once and reuse it everywhere."""
    return boto3.client(
        service_name="bedrock-runtime",
        region_name=config.AWS_REGION,
        config=Config(read_timeout=90, retries={"max_attempts": 2}),
    )


def converse(messages: list[dict], system: str = SYSTEM_PROMPT, max_tokens: int = 3000) -> str:
    """Send a list of {"role", "content": str} messages and return the reply text."""
    bedrock_messages = [
        {"role": m["role"], "content": [{"text": m["content"]}]} for m in messages
    ]
    try:
        response = get_client().converse(
            modelId=config.MODEL_ID,
            system=[{"text": system}],
            messages=bedrock_messages,
            inferenceConfig={"maxTokens": max_tokens, "temperature": 0.7},
        )
        return response["output"]["message"]["content"][0]["text"]
    except ClientError as exc:
        error = exc.response.get("Error", {})
        raise AIServiceError(
            f"Amazon Bedrock error ({error.get('Code', 'Unknown')}): {error.get('Message', str(exc))}"
        ) from exc
    except (BotoCoreError, KeyError, IndexError) as exc:
        raise AIServiceError(f"Amazon Bedrock is unavailable: {exc}") from exc


# ─── Trip itinerary generation ──────────────────────────────────────────────

def build_trip_prompt(trip) -> str:
    """Session 5 challenge + homework: a rich prompt asking for Markdown output."""
    places = get_recommended_places(trip.destination)
    lines = [
        f"Create a {trip.days}-day travel itinerary for {trip.destination}"
        + (f", {trip.country}" if trip.country else "")
        + ".",
        "",
        "Trip details:",
        f"- Destination: {trip.destination}",
        f"- Number of days: {trip.days}",
        f"- Total budget: {trip.budget:,.0f} {trip.currency}",
        f"- Daily budget: {trip.daily_budget:,.0f} {trip.currency} per day",
        f"- Travel style: {trip.travel_style or 'General'}",
        f"- Trip category: {trip.category}",
        f"- Suggested main transportation: {trip.recommended_transport}",
    ]
    if trip.travel_month:
        lines.append(f"- Month of travel: {trip.travel_month} ({trip.season})")
    if places:
        lines.append(f"- Places the traveler may like: {', '.join(places)}")
    lines += [
        "",
        "Format your response as Markdown using exactly this structure:",
        "## Overview",
        "A short 2-3 sentence summary of the trip.",
        "## Day 1: <theme>  (repeat one section per day, for every day)",
        "- **Morning:** 2-3 activities, including cultural sites or experiences",
        "- **Afternoon:** activities",
        "- **Evening:** dinner spots and nightlife suggestions",
        "- **Estimated cost:** amount in the trip currency",
        "## Local Food",
        "Bullet list of local dishes and where to try them.",
        "## Transportation",
        "Bullet list of transportation advice.",
        "## Budget Breakdown",
        "Bullet list: accommodation, food, transportation, activities, miscellaneous — must fit the total budget.",
        "## Travel Tips",
        "Bullet list of practical tips.",
        "Do not add any text before the Overview heading.",
    ]
    return "\n".join(lines)


def generate_itinerary(trip) -> str:
    if config.AI_MOCK_MODE:
        return _mock_itinerary(trip)
    return converse([{"role": "user", "content": build_trip_prompt(trip)}], max_tokens=4000)


def chat(messages: list[dict], system: str = SYSTEM_PROMPT) -> str:
    if config.AI_MOCK_MODE:
        return _mock_chat(messages)
    return converse(messages, system=system, max_tokens=2000)


# ─── Mock responses (AI_MOCK_MODE) ──────────────────────────────────────────

def _mock_itinerary(trip) -> str:
    places = get_recommended_places(trip.destination) or [
        f"{trip.destination} Old Town", f"{trip.destination} Central Market",
        f"{trip.destination} Museum", f"{trip.destination} Viewpoint",
    ]
    per_day = trip.daily_budget
    parts = [
        "## Overview",
        f"> _Sample itinerary generated in AI mock mode — connect Amazon Bedrock for a real AI plan._",
        "",
        f"A {trip.days}-day {(trip.travel_style or 'general').lower()} trip to {trip.destination} "
        f"on a {trip.category.lower()} budget of {trip.budget:,.0f} {trip.currency}.",
    ]
    for day in range(1, trip.days + 1):
        place = places[(day - 1) % len(places)]
        parts += [
            "",
            f"## Day {day}: Discover {place}",
            f"- **Morning:** Visit {place} early to avoid the crowds.",
            "- **Afternoon:** Explore the surrounding neighbourhood and a local market.",
            "- **Evening:** Dinner at a popular local restaurant, then an evening walk.",
            f"- **Estimated cost:** {per_day:,.0f} {trip.currency}",
        ]
    parts += [
        "",
        "## Local Food",
        f"- Try the signature street food of {trip.destination}.",
        "- Visit a night market for affordable local dishes.",
        "",
        "## Transportation",
        f"- Main recommendation: **{trip.recommended_transport}**.",
        "- Use public transport passes to save money.",
        "",
        "## Budget Breakdown",
        f"- Accommodation: {trip.budget * 0.4:,.0f} {trip.currency}",
        f"- Food: {trip.budget * 0.25:,.0f} {trip.currency}",
        f"- Transportation: {trip.budget * 0.15:,.0f} {trip.currency}",
        f"- Activities: {trip.budget * 0.15:,.0f} {trip.currency}",
        f"- Miscellaneous: {trip.budget * 0.05:,.0f} {trip.currency}",
        "",
        "## Travel Tips",
        "- Check visa requirements before you book.",
        "- Keep digital copies of your passport and insurance.",
    ]
    return "\n".join(parts)


def _mock_chat(messages: list[dict]) -> str:
    last = messages[-1]["content"] if messages else ""
    earlier = [m["content"] for m in messages[:-1] if m["role"] == "user"]
    context = f' Earlier you mentioned: "{earlier[0][:80]}".' if earlier else ""
    return (
        "_AI mock mode is on — this is a sample reply, not Amazon Bedrock._\n\n"
        f'You asked: "{last[:200]}".{context} '
        f"I can see {len(messages) - 1} previous message(s) in this conversation."
    )
