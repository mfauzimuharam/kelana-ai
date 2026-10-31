import os
import sys
from pathlib import Path

# Configure before the app is imported: isolated SQLite DB and no real AWS calls.
TEST_DB = Path(__file__).parent / "test_kelana.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["AI_MOCK_MODE"] = "true"
os.environ["KNOWLEDGE_BASE_ID"] = ""
os.environ["JWT_SECRET_KEY"] = "test-secret"
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from database import Base, engine  # noqa: E402
from main import app  # noqa: E402


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)


def register_and_login(client, name="Alice", email="alice@email.com", password="password123"):
    response = client.post("/api/v1/auth/register", json={"name": name, "email": email, "password": password})
    assert response.status_code == 201, response.text
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture()
def alice(client):
    return register_and_login(client)


@pytest.fixture()
def bob(client):
    return register_and_login(client, name="Bob", email="bob@email.com")


def pytest_sessionfinish(session, exitstatus):
    engine.dispose()
    TEST_DB.unlink(missing_ok=True)
