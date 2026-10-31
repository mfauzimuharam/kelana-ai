from services.chat_service import build_prompt_messages, make_title

TRIP = {"destination": "Japan", "days": 5, "budget": 2000, "travel_style": "Family"}


# ─── General & catalog ──────────────────────────────────────────────────────

def test_home_and_health(client):
    assert client.get("/").json() == {"message": "Welcome to Jalan-Jalan AI"}
    assert client.get("/health").json() == {"status": "OK"}


def test_catalog_endpoints(client):
    assert client.get("/api/v1/trip-categories").json() == ["Backpacker", "Standard", "Luxury"]
    assert client.get("/api/v1/transportations").json() == ["Bus", "Train", "Flight"]
    assert client.get("/api/v1/recommendations").json()[0] == "Tokyo Tower"
    assert "Ubud" in client.get("/api/v1/recommendations", params={"destination": "bali"}).json()


# ─── Authentication ─────────────────────────────────────────────────────────

def test_register_hides_password(client):
    response = client.post(
        "/api/v1/auth/register", json={"name": "Alice", "email": "Alice@Email.com", "password": "password123"}
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "alice@email.com"
    assert "password" not in body and "password_hash" not in body


def test_register_duplicate_email(client, alice):
    response = client.post(
        "/api/v1/auth/register", json={"name": "A2", "email": "alice@email.com", "password": "password123"}
    )
    assert response.status_code == 409


def test_login_wrong_password(client, alice):
    response = client.post("/api/v1/auth/login", json={"email": "alice@email.com", "password": "wrongpass"})
    assert response.status_code == 401


def test_protected_routes_require_token(client):
    assert client.get("/api/v1/trips").status_code == 401
    assert client.get("/api/v1/trips", headers={"Authorization": "Bearer nope"}).status_code == 401
    assert client.get("/api/v1/auth/me").status_code == 401


def test_me(client, alice):
    client.post("/api/v1/trips", json=TRIP, headers=alice)
    body = client.get("/api/v1/auth/me", headers=alice).json()
    assert body["name"] == "Alice"
    assert body["total_trips"] == 1


# ─── Trips CRUD ─────────────────────────────────────────────────────────────

def test_create_trip_applies_rules(client, alice):
    response = client.post("/api/v1/trips", json={**TRIP, "travel_month": "dec"}, headers=alice)
    assert response.status_code == 201
    trip = response.json()
    assert trip["category"] == "Standard"
    assert trip["daily_budget"] == 400
    assert trip["recommended_transport"] == "Train"
    assert trip["recommendation_transport"] == "Train"
    assert trip["travel_month"] == "December"
    assert trip["season"] == "Peak Season"
    assert trip["ai_recommendation"] is None


def test_create_trip_ignores_user_id_from_client(client, alice, bob):
    trip = client.post("/api/v1/trips", json={**TRIP, "user_id": 999}, headers=alice).json()
    me = client.get("/api/v1/auth/me", headers=alice).json()
    assert trip["user_id"] == me["id"]


def test_create_trip_validation(client, alice):
    assert client.post("/api/v1/trips", json={**TRIP, "days": 0}, headers=alice).status_code == 422
    assert client.post("/api/v1/trips", json={**TRIP, "budget": -5}, headers=alice).status_code == 422
    assert client.post("/api/v1/trips", json={**TRIP, "destination": "  "}, headers=alice).status_code == 422


def test_create_and_generate(client, alice):
    trip = client.post("/api/v1/trips", json={**TRIP, "generate": True}, headers=alice).json()
    assert "## Day 5" in trip["ai_recommendation"]


def test_generate_endpoint_saves_recommendation(client, alice):
    trip = client.post("/api/v1/trips", json=TRIP, headers=alice).json()
    response = client.post(f"/api/v1/trips/{trip['id']}/generate", headers=alice)
    assert response.status_code == 200
    body = response.json()
    assert body["trip_id"] == trip["id"] and body["destination"] == "Japan"
    assert "## Day 1" in body["recommendation"]
    saved = client.get(f"/api/v1/trips/{trip['id']}", headers=alice).json()
    assert saved["ai_recommendation"] == body["recommendation"]


def test_list_search_and_sort(client, alice):
    client.post("/api/v1/trips", json=TRIP, headers=alice)
    client.post("/api/v1/trips", json={**TRIP, "destination": "Bali", "budget": 700, "travel_style": "Solo"}, headers=alice)
    client.post("/api/v1/trips", json={**TRIP, "destination": "Singapore", "budget": 5000}, headers=alice)

    latest = client.get("/api/v1/trips", headers=alice).json()
    assert [t["destination"] for t in latest] == ["Singapore", "Bali", "Japan"]
    oldest = client.get("/api/v1/trips", params={"sort": "oldest"}, headers=alice).json()
    assert oldest[0]["destination"] == "Japan"
    by_budget = client.get("/api/v1/trips", params={"sort": "budget_desc"}, headers=alice).json()
    assert by_budget[0]["budget"] == 5000
    solo = client.get("/api/v1/trips", params={"q": "solo"}, headers=alice).json()
    assert [t["destination"] for t in solo] == ["Bali"]


def test_update_recalculates(client, alice):
    trip = client.post("/api/v1/trips", json=TRIP, headers=alice).json()
    response = client.put(f"/api/v1/trips/{trip['id']}", json={"budget": 6000}, headers=alice)
    assert response.status_code == 200
    updated = response.json()
    assert updated["category"] == "Luxury"
    assert updated["daily_budget"] == 1200
    assert updated["recommended_transport"] == "Flight"
    assert updated["destination"] == "Japan"


def test_delete_trip(client, alice):
    trip = client.post("/api/v1/trips", json=TRIP, headers=alice).json()
    assert client.delete(f"/api/v1/trips/{trip['id']}", headers=alice).status_code == 204
    assert client.get(f"/api/v1/trips/{trip['id']}", headers=alice).status_code == 404
    assert client.delete(f"/api/v1/trips/{trip['id']}", headers=alice).status_code == 404


def test_users_cannot_access_each_others_trips(client, alice, bob):
    trip = client.post("/api/v1/trips", json=TRIP, headers=alice).json()
    assert client.get("/api/v1/trips", headers=bob).json() == []
    assert client.get(f"/api/v1/trips/{trip['id']}", headers=bob).status_code == 403
    assert client.put(f"/api/v1/trips/{trip['id']}", json={"budget": 1}, headers=bob).status_code == 403
    assert client.delete(f"/api/v1/trips/{trip['id']}", headers=bob).status_code == 403
    assert client.post(f"/api/v1/trips/{trip['id']}/generate", headers=bob).status_code == 403
    assert client.get(f"/api/v1/trips/{trip['id']}", headers=alice).status_code == 200


# ─── RAG assistant ──────────────────────────────────────────────────────────

def test_assistant_answers_from_knowledge(client, alice):
    response = client.post("/api/v1/assistant", json={"question": "Do I need a visa to visit Japan?"}, headers=alice)
    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "local"
    assert any(s["name"] == "visa-japan.md" for s in body["sources"])
    assert client.post("/api/v1/ask", json={"question": "baggage allowance standard package"}, headers=alice).json()[
        "sources"
    ][0]["name"] == "jalan-jalan-travel-policy.md"


def test_assistant_requires_auth(client):
    assert client.post("/api/v1/assistant", json={"question": "visa?"}).status_code == 401


# ─── Conversations ──────────────────────────────────────────────────────────

def test_conversation_flow(client, alice):
    created = client.post("/api/v1/conversations", json={}, headers=alice)
    assert created.status_code == 201
    conversation_id = created.json()["conversation_id"]

    first = client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        json={"content": "Plan a family trip to Japan."},
        headers=alice,
    ).json()
    assert first["conversation"]["title"] == "Plan a family trip to Japan."
    assert first["assistant_message"]["role"] == "assistant"

    second = client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        json={"content": "What should we do on Day 2?"},
        headers=alice,
    ).json()
    # The mock model echoes how much history it received — proves context was rebuilt.
    assert "Plan a family trip to Japan" in second["assistant_message"]["content"]
    assert "2 previous message(s)" in second["assistant_message"]["content"]

    detail = client.get(f"/api/v1/conversations/{conversation_id}", headers=alice).json()
    assert [m["role"] for m in detail["messages"]] == ["user", "assistant", "user", "assistant"]

    renamed = client.patch(f"/api/v1/conversations/{conversation_id}", json={"title": "Japan Family Trip"}, headers=alice)
    assert renamed.json()["title"] == "Japan Family Trip"
    listed = client.get("/api/v1/conversations", headers=alice).json()
    assert listed[0]["title"] == "Japan Family Trip" and listed[0]["message_count"] == 4

    assert client.delete(f"/api/v1/conversations/{conversation_id}", headers=alice).status_code == 204
    assert client.get("/api/v1/conversations", headers=alice).json() == []


def test_conversations_are_private(client, alice, bob):
    conversation_id = client.post("/api/v1/conversations", json={}, headers=alice).json()["id"]
    assert client.get(f"/api/v1/conversations/{conversation_id}", headers=bob).status_code == 403
    assert client.post(
        f"/api/v1/conversations/{conversation_id}/messages", json={"content": "hi"}, headers=bob
    ).status_code == 403
    assert client.get("/api/v1/conversations", headers=bob).json() == []


# ─── Prompt builder ─────────────────────────────────────────────────────────

class Msg:
    def __init__(self, role, content):
        self.role, self.content = role, content


def test_prompt_builder_trims_and_alternates():
    history = [Msg("assistant", "orphan")] + [
        Msg("user" if i % 2 == 0 else "assistant", f"m{i}") for i in range(30)
    ] + [Msg("user", "extra")]
    messages = build_prompt_messages(history, limit=10)
    assert messages[0]["role"] == "user"
    assert len(messages) <= 10
    assert all(a["role"] != b["role"] for a, b in zip(messages, messages[1:]))
    assert messages[-1]["content"].endswith("extra")


def test_make_title():
    assert make_title("  Plan   a trip  ") == "Plan a trip"
    assert len(make_title("word " * 40)) <= 60
