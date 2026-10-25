import json
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from backend.ai_service import generate_reply

DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]


def get_cors_origins() -> list[str]:
    raw = os.environ.get("CORS_ORIGINS", "").strip()
    if not raw:
        return list(DEFAULT_CORS_ORIGINS)
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list) and all(isinstance(origin, str) for origin in parsed):
            return parsed
    except Exception:
        pass
    return list(DEFAULT_CORS_ORIGINS)


app = FastAPI(
    title="Captain Voice Assistant Backend",
    description="Backend API with AI fallback for Captain Voice Assistant",
    version="1.0.0",
)

# Configure CORS origins (defaults to Vite dev ports, or overridden via CORS_ORIGINS env var)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str = Field(..., description="The user voice or text input")

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        if not isinstance(v, str) or not v.strip():
            raise ValueError("Message cannot be empty or whitespace only")
        return v.strip()


UNCONFIGURED_REPLY = (
    "My AI brain isn't configured yet — a Gemini API key needs to be added on the server. "
    "Meanwhile, try asking me the time, the weather, or to open a website."
)

ERROR_REPLY = "I'm having trouble thinking right now. Please try again in a moment."


@app.get("/health")
def health():
    ai_configured = bool(os.environ.get("GEMINI_API_KEY", "").strip())
    return {
        "status": "ok",
        "service": "personal-voice-assistant",
        "ai_configured": ai_configured,
    }


@app.post("/api/chat")
def chat(request: ChatRequest):
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()

    if not api_key:
        return {
            "reply": UNCONFIGURED_REPLY,
            "ai_configured": False,
        }

    try:
        reply_text = generate_reply(request.message)
        return {
            "reply": reply_text,
            "ai_configured": True,
        }
    except Exception:
        return {
            "reply": ERROR_REPLY,
            "ai_configured": True,
            "error": True,
        }
