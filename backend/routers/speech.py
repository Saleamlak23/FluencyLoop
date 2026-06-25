import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Depends
from services.ai_client import get_groq_client, GROQ_STT_MODEL
from services.rate_limiter import check_rate_limit

router = APIRouter()

ALLOWED_CONTENT_TYPES = {
    "audio/webm",
    "audio/ogg",
    "audio/mpeg",
    "audio/wav",
    "audio/mp4",
}


@router.post("/transcribe")
async def transcribe(
    request: Request,
    audio: UploadFile = File(...),
    _=Depends(check_rate_limit),
):
    """
    Transcribe an audio file using Groq Whisper Large v3 Turbo.

    Free tier limits:
      - 2,000 requests/day
      - 7,200 audio seconds/hour
      - 25 MB max file size

    Accepts: audio/webm (MediaRecorder default), audio/ogg, audio/wav, audio/mpeg
    Returns: { text: str, words: list }

    Called by the frontend after the user stops recording:
      POST /api/speech/transcribe
      Body: FormData { audio: Blob }
    """
    if audio.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format: {audio.content_type}. "
                   f"Accepted formats: {', '.join(ALLOWED_CONTENT_TYPES)}",
        )

    # Read the uploaded audio into a temp file
    # Groq SDK requires a real file path, not an in-memory buffer
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        contents = await audio.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Audio file is empty.")
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        client = get_groq_client()
        with open(tmp_path, "rb") as f:
            result = client.audio.transcriptions.create(
                file=(os.path.basename(tmp_path), f.read()),
                model=GROQ_STT_MODEL,
                language="en",
                response_format="verbose_json",
                timestamp_granularities=["word"],
            )

        # verbose_json returns .text and .words (word-level timestamps)
        words = result.words if hasattr(result, "words") and result.words else []

        return {
            "text": result.text.strip(),
            "words": [
                {
                    "word":  w.word,
                    "start": w.start,
                    "end":   w.end,
                }
                for w in words
            ],
        }

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg:
            raise HTTPException(
                status_code=429,
                detail="Groq Whisper rate limit reached (2,000 req/day). Try again tomorrow.",
            )
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {error_msg}",
        )
    finally:
        # Always clean up the temp file
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


# ── TTS NOTE ────────────────────────────────────────────────────────────────
# The MVP uses the Browser Web Speech API (SpeechSynthesisUtterance) for TTS.
# The backend returns text only; the frontend speaks it client-side for free.
#
# Upgrade path when budget is available:
#   Groq Orpheus V1 English — $22 per million characters (PAID).
#   Uncomment the endpoint below and update the frontend to call /api/speech/speak.
#
# @router.post("/speak")
# async def speak(payload: dict, _=Depends(check_rate_limit)):
#     """PAID: Groq Orpheus V1 English TTS — $22/M chars. Enable when budget allows."""
#     from fastapi.responses import Response
#     text  = payload.get("text", "")[:1000]
#     voice = payload.get("voice", "luna")
#     client = get_groq_client()
#     response = client.audio.speech.create(
#         model="canopylabs/orpheus-v1-english",
#         voice=voice,
#         input=text,
#         response_format="wav",
#     )
#     return Response(content=response.content, media_type="audio/wav")