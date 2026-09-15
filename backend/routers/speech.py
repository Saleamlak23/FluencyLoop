# backend/routers/speech.py

import os
import json
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request, Depends
from services.ai_client import get_groq_client, GROQ_STT_MODEL, GROQ_CHAT_MODEL
from services.rate_limiter import check_rate_limit

router = APIRouter()

ALLOWED_PREFIXES = (
    "audio/webm",
    "audio/ogg",
    "audio/mpeg",
    "audio/wav",
    "audio/mp4",
    "video/webm",   # some browsers label MediaRecorder output as video/webm
)

# ── Scenario metadata ─────────────────────────────────────────────────────
# Mirrors the frontend SCENARIOS list — used to build the AI system prompt.

SCENARIO_META = {
    "ordering-coffee": {
        "role":        "a friendly barista at a busy London coffee shop called The Daily Grind",
        "description": "The student is ordering a coffee drink at a coffee shop.",
    },
    "asking-directions": {
        "role":        "a helpful local pedestrian on a busy city street",
        "description": "The student is lost and asking for directions to the nearest train station.",
    },
    "job-interview": {
        "role":        "a friendly company receptionist",
        "description": "The student has arrived early for a job interview and is making small talk while waiting.",
    },
}

# ── System prompt ─────────────────────────────────────────────────────────

SPEAKING_SYSTEM_PROMPT = """
You are a friendly English language tutor playing the role of {role}.

The student just said: "{transcript}"

Scenario context: {description}

Your job:
1. Stay in character and reply naturally (1-2 sentences max).
2. Analyse the complete sentence and every word for grammar, vocabulary, and naturalness.
3. Check grammar rules including subject-verb agreement, verb tense and form, sentence structure, word order, articles, prepositions, plurals, pronouns, and countable/uncountable nouns.
4. Flag words as: "correct" (grammatically correct, natural, and accurate), "caution" (grammatically acceptable but less natural or precise), or "error" (grammatically wrong, missing, or incorrectly used).

Respond with ONLY valid JSON in this exact format — no text, no markdown outside the JSON:
{{
  "character_reply": "<your natural in-character response to the student>",
  "word_feedback": [
    {{
      "word":       "<each word from the student's sentence, one entry per word>",
      "status":     "correct" | "caution" | "error",
      "suggestion": "<better alternative if caution or error, otherwise null>",
      "reason":     "<one short explanation if caution or error, otherwise null>"
    }}
  ],
  "corrections": [
    {{
      "original": "<word or phrase the student used>",
      "better":   "<more natural or correct alternative>",
      "why":      "<one clear sentence explaining why>"
    }}
  ]
}}

Important rules:
- word_feedback MUST include EVERY word from the student's sentence — do not skip any.
- Judge grammar in the context of the complete sentence, not each word in isolation.
- If a grammar rule is broken, mark the affected word or words as "error" even when the meaning is understandable.
- Do not mark a word "correct" merely because it is a valid English word; verify its role and form in the sentence.
- Only add entries to corrections[] for words marked caution or error.
- Keep character_reply warm, short, and in character.
- Return pure JSON only — no preamble, no explanation outside the JSON object.
"""


def _ext_from_content_type(content_type: str) -> str:
    """Map MIME content-type to a file extension Groq Whisper accepts."""
    if "ogg"  in content_type: return ".ogg"
    if "mp4"  in content_type: return ".mp4"
    if "wav"  in content_type: return ".wav"
    if "mpeg" in content_type or "mp3" in content_type: return ".mp3"
    return ".webm"   # covers audio/webm and video/webm


@router.post("/transcribe")
async def transcribe(
    request:    Request,
    audio:      UploadFile = File(...),
    scenarioId: str        = Form(default="ordering-coffee"),
    turnIndex:  int        = Form(default=0),
    _=Depends(check_rate_limit),
):
    """
    Full speaking turn pipeline:
      1. Transcribe audio  → Groq Whisper Large v3 Turbo  (free: 2,000 req/day)
    2. Get AI reply      → Groq GPT OSS 20B

    POST /api/speech/transcribe
    Body (multipart/form-data):
      audio      — audio blob (webm/ogg/wav/mp4/mp3)
      scenarioId — string matching a key in SCENARIO_META
      turnIndex  — integer (which turn in the conversation)

    Response:
      {
        transcript:    string,
        word_feedback: [{ word, status, suggestion, reason }],
        ai_reply_text: string,
        corrections:   [{ original, better, why }]
      }
    """
    content_type = audio.content_type or ""

    # ── Validate content type ──────────────────────────────────────────────
    if not any(content_type.startswith(p) for p in ALLOWED_PREFIXES):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported audio format: '{content_type}'. "
                f"Accepted: {', '.join(ALLOWED_PREFIXES)}"
            ),
        )

    contents = await audio.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Audio file is empty.")

    ext      = _ext_from_content_type(content_type)
    tmp_path = None

    try:
        # ── Write to temp file ─────────────────────────────────────────────
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        client = get_groq_client()

        # ── Step 1: Transcribe with Groq Whisper ───────────────────────────
        with open(tmp_path, "rb") as f:
            stt_result = client.audio.transcriptions.create(
                file=(os.path.basename(tmp_path), f.read()),
                model=GROQ_STT_MODEL,        # whisper-large-v3-turbo
                language="en",
                response_format="text",      # plain string — Groq doesn't support verbose_json word timestamps
            )

        # response_format="text" returns the string directly
        transcript = (stt_result if isinstance(stt_result, str) else stt_result.text).strip()

        if not transcript:
            raise HTTPException(
                status_code=400,
                detail="Could not understand the audio. Please speak clearly and try again.",
            )

        print(f"[transcribe] ✅ STT done — scenarioId={scenarioId}, turn={turnIndex}, text='{transcript}'")

        # ── Step 2: AI reply + word feedback via Groq GPT OSS 20B ─────────
        scenario = SCENARIO_META.get(scenarioId, SCENARIO_META["ordering-coffee"])
        prompt   = SPEAKING_SYSTEM_PROMPT.format(
            role=scenario["role"],
            transcript=transcript,
            description=scenario["description"],
        )

        chat_result = client.chat.completions.create(
            model=GROQ_CHAT_MODEL,           # openai/gpt-oss-20b
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.5,
            max_tokens=1000,
        )

        raw    = chat_result.choices[0].message.content
        parsed = json.loads(raw)

        print(f"[transcribe] ✅ LLM done — reply='{parsed.get('character_reply', '')[:60]}...'")

        return {
            "transcript":    transcript,
            "word_feedback": parsed.get("word_feedback", []),
            "ai_reply_text": parsed.get("character_reply", ""),
            "corrections":   parsed.get("corrections", []),
        }

    except HTTPException:
        raise

    except json.JSONDecodeError as e:
        print(f"[transcribe] ❌ JSON parse error: {e}")
        raise HTTPException(
            status_code=500,
            detail="AI returned malformed JSON. Please try again.",
        )

    except Exception as e:
        error_msg = str(e)
        print(f"[transcribe] ❌ ERROR — scenarioId={scenarioId}, turn={turnIndex}: {error_msg}")
        if "429" in error_msg:
            raise HTTPException(
                status_code=429,
                detail="Rate limit reached (2,000 req/day on free tier). Please try again tomorrow.",
            )
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {error_msg}",
        )

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)