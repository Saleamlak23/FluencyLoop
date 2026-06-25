import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import speech, conversation, writing, vocabulary

# ── Load environment variables ───────────────────────────────────────────────
# Reads backend/.env automatically when running locally with uvicorn.
# In production (Railway / Render) these are set via the platform dashboard.
load_dotenv()


# ── Lifespan (startup / shutdown hooks) ─────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Validate that all required API keys are present on startup."""
    missing = []
    for key in ("GROQ_API_KEY", "GEMINI_API_KEY", "MISTRAL_API_KEY"):
        if not os.getenv(key):
            missing.append(key)
    if missing:
        print(
            f"⚠️  WARNING: The following environment variables are not set: "
            f"{', '.join(missing)}. "
            f"Some endpoints may fail at runtime."
        )
    else:
        print("✅  All API keys loaded successfully.")
    yield
    # Shutdown: nothing to clean up for MVP


# ── App instance ─────────────────────────────────────────────────────────────

app = FastAPI(
    title="FluentLoop API",
    description=(
        "Backend for FluentLoop — an AI-powered English learning web app. "
        "Provides speech transcription (Groq Whisper), role-play conversation "
        "(Groq Llama 3.3 70B), writing evaluation (Groq → Gemini → Mistral fallback), "
        "and vocabulary endpoints."
    ),
    version="0.1.0",
    lifespan=lifespan,
)


# ── CORS middleware ──────────────────────────────────────────────────────────
# ALLOWED_ORIGINS is a comma-separated string in .env:
#   http://localhost:5173,https://your-production-domain.com

allowed_origins = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routers ──────────────────────────────────────────────────────────────────

app.include_router(
    speech.router,
    prefix="/api/speech",
    tags=["Speech"],
)
app.include_router(
    conversation.router,
    prefix="/api/conversation",
    tags=["Conversation"],
)
app.include_router(
    writing.router,
    prefix="/api/writing",
    tags=["Writing"],
)
app.include_router(
    vocabulary.router,
    prefix="/api/vocabulary",
    tags=["Vocabulary"],
)


# ── Health check ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
def health():
    """
    Simple liveness probe.
    Used by Docker Compose, Railway, and Render to confirm the server is running.
    """
    return {"status": "ok", "version": "0.1.0"}


# ── Dev entrypoint ───────────────────────────────────────────────────────────
# Run locally with:
#   cd backend
#   uvicorn main:app --reload --port 8000
#
# API docs available at:
#   http://localhost:8000/docs      (Swagger UI)
#   http://localhost:8000/redoc     (ReDoc)