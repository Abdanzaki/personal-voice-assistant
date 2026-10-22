import pytest
from fastapi.testclient import TestClient

from backend.main import app, UNCONFIGURED_REPLY, ERROR_REPLY
from backend.ai_service import generate_reply, FALLBACK_MODELS


@pytest.fixture
def client():
    return TestClient(app)


# (a) /health returns 200 with status ok
def test_health_endpoint_when_key_unset(client, monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "personal-voice-assistant"
    assert data["ai_configured"] is False


def test_health_endpoint_when_key_set(client, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "fake-test-key")
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "personal-voice-assistant"
    assert data["ai_configured"] is True


# (b) /api/chat with GEMINI_API_KEY unset (monkeypatch env) returns 200, ai_configured=false and friendly reply
def test_chat_unconfigured_when_key_unset(client, monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    response = client.post("/api/chat", json={"message": "Who is Nikola Tesla?"})
    assert response.status_code == 200
    data = response.json()
    assert data["ai_configured"] is False
    assert data["reply"] == UNCONFIGURED_REPLY


def test_chat_unconfigured_when_key_empty(client, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "   ")
    response = client.post("/api/chat", json={"message": "Who is Nikola Tesla?"})
    assert response.status_code == 200
    data = response.json()
    assert data["ai_configured"] is False
    assert data["reply"] == UNCONFIGURED_REPLY


# (c) /api/chat with a fake key + monkeypatched generate_reply returns its text with ai_configured=true
def test_chat_with_configured_key_and_mocked_reply(client, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "fake-test-key-12345")
    mock_reply = "Nikola Tesla was a Serbian-American engineer known for alternating current."

    monkeypatch.setattr("backend.main.generate_reply", lambda msg: mock_reply)

    response = client.post("/api/chat", json={"message": "Who was Tesla?"})
    assert response.status_code == 200
    data = response.json()
    assert data["ai_configured"] is True
    assert data["reply"] == mock_reply
    assert "error" not in data or data.get("error") is False


# (d) fallback: monkeypatched call_model raising for first model -> second model used
def test_ai_service_fallback_first_model_fails_second_succeeds(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "fake-test-key-12345")
    called_models = []

    def mock_call_model(genai_client, model, message):
        called_models.append(model)
        if model == "gemini-3.8-flash":
            raise RuntimeError("Gemini 3.8 flash temporarily unavailable")
        if model == "gemma-4-26b-a4b-it":
            return "This response comes from Gemma fallback model."
        raise RuntimeError(f"Unexpected model {model}")

    monkeypatch.setattr("backend.ai_service.call_model", mock_call_model)

    reply = generate_reply("Tell me something interesting")
    assert reply == "This response comes from Gemma fallback model."
    assert called_models == ["gemini-3.8-flash", "gemma-4-26b-a4b-it"]


def test_chat_fallback_through_endpoint(client, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "fake-test-key-12345")
    called_models = []

    def mock_call_model(genai_client, model, message):
        called_models.append(model)
        if model == "gemini-3.8-flash":
            raise RuntimeError("Quota exceeded for gemini-3.8-flash")
        if model == "gemma-4-26b-a4b-it":
            return "Fallback reply received."
        raise RuntimeError("Unknown model")

    monkeypatch.setattr("backend.ai_service.call_model", mock_call_model)

    response = client.post("/api/chat", json={"message": "Test fallback"})
    assert response.status_code == 200
    data = response.json()
    assert data["ai_configured"] is True
    assert data["reply"] == "Fallback reply received."
    assert called_models == ["gemini-3.8-flash", "gemma-4-26b-a4b-it"]


def test_chat_all_models_fail_returns_friendly_error(client, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "fake-test-key-12345")

    def mock_call_model_fail_all(genai_client, model, message):
        raise RuntimeError("Service unavailable on model " + model)

    monkeypatch.setattr("backend.ai_service.call_model", mock_call_model_fail_all)

    response = client.post("/api/chat", json={"message": "Test error response"})
    assert response.status_code == 200
    data = response.json()
    assert data["ai_configured"] is True
    assert data["error"] is True
    assert data["reply"] == ERROR_REPLY


# (e) empty message -> 422
def test_chat_empty_message_returns_422(client):
    response = client.post("/api/chat", json={"message": ""})
    assert response.status_code == 422


def test_chat_whitespace_only_message_returns_422(client):
    response = client.post("/api/chat", json={"message": "   "})
    assert response.status_code == 422


def test_chat_missing_message_field_returns_422(client):
    response = client.post("/api/chat", json={})
    assert response.status_code == 422


def test_chat_non_string_message_returns_422(client):
    response = client.post("/api/chat", json={"message": 12345})
    assert response.status_code == 422


# CORS verification
def test_cors_headers_allowed_origin(client):
    response = client.options(
        "/api/chat",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
