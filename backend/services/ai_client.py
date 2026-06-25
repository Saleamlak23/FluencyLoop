import os
from groq import Groq
import google.generativeai as genai
from openai import OpenAI


# ── Model constants ─────────────────────────────────────────────────────────

GROQ_CHAT_MODEL = "llama-3.3-70b-versatile"   # free: 1,000 RPD, 30 RPM
GROQ_FAST_MODEL = "llama-3.1-8b-instant"       # free: 14,400 RPD, 30 RPM
GROQ_STT_MODEL  = "whisper-large-v3-turbo"     # free: 2,000 req/day
GEMINI_MODEL    = "gemini-2.5-flash"           # fallback 1: 1,500 RPD free
MISTRAL_MODEL   = "mistral-large-latest"       # fallback 2: ~1B tokens/month free


# ── Client factories ────────────────────────────────────────────────────────

def get_groq_client() -> Groq:
    """
    Primary provider — Groq free tier.
    Covers STT (Whisper Large v3 Turbo) and chat (Llama 3.3 70B / 3.1 8B).
    TTS is handled client-side via Browser Web Speech API (no key needed).
    Sign up at console.groq.com — no credit card required.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set in environment variables.")
    return Groq(api_key=api_key)


def get_gemini_model():
    """
    Fallback 1 — Google Gemini 2.5 Flash free tier (chat/writing only).
    1,500 RPD free. Sign up at aistudio.google.com — no credit card required.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set in environment variables.")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(GEMINI_MODEL)


def get_mistral_client() -> OpenAI:
    """
    Fallback 2 — Mistral via OpenAI-compatible SDK (writing only).
    ~1B tokens/month free. Sign up at console.mistral.ai — no credit card required.
    Note: 2 RPM limit — strictly a last-resort fallback.
    """
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        raise RuntimeError("MISTRAL_API_KEY is not set in environment variables.")
    return OpenAI(
        api_key=api_key,
        base_url="https://api.mistral.ai/v1",
    )