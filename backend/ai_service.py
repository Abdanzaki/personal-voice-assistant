import os
from google import genai
from google.genai import types

SYSTEM_INSTRUCTION = (
    "You are Captain, a friendly voice assistant. Answer in at most 2-3 short sentences, "
    "plain spoken language, no markdown, no lists, no code blocks — your answer will be read aloud."
)

FALLBACK_MODELS = [
    "gemini-3.8-flash",
    "gemma-4-26b-a4b-it",
]


def call_model(client: genai.Client, model: str, message: str) -> str:
    """Invokes a specific model via google-genai SDK."""
    response = client.models.generate_content(
        model=model,
        contents=message,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
        ),
    )
    if not response or not response.text:
        raise ValueError(f"Model {model} returned an empty response")
    return response.text.strip()


def generate_reply(message: str, api_key: str | None = None) -> str:
    """
    Attempts to generate a reply using the fallback chain:
    1. 'gemini-3.8-flash'
    2. 'gemma-4-26b-a4b-it'
    Raises RuntimeError if all models fail.
    """
    key = (api_key or os.environ.get("GEMINI_API_KEY", "")).strip()
    if not key:
        raise ValueError("GEMINI_API_KEY is not set or empty")

    client = genai.Client(api_key=key)
    errors = []

    for model in FALLBACK_MODELS:
        try:
            return call_model(client, model, message)
        except Exception as exc:
            errors.append(f"{model}: {exc}")
            continue

    raise RuntimeError(f"All models in fallback chain failed: {'; '.join(errors)}")
