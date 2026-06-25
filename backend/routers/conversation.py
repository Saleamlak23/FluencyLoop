import json
from fastapi import APIRouter, HTTPException, Request, Depends
from models.schemas import ConversationRequest, ConversationResponse
from services.ai_client import get_groq_client, get_gemini_model, GROQ_CHAT_MODEL
from services.rate_limiter import check_rate_limit

router = APIRouter()

# ── System prompt ────────────────────────────────────────────────────────────

SPEAKING_SYSTEM_PROMPT = """You are a friendly and encouraging English language tutor playing the role of a [SCENARIO_ROLE] (e.g., "a barista at a busy coffee shop").

Your goals:
1. Stay in character and keep the conversation natural and flowing.
2. After each student message, gently correct any grammar, vocabulary, or unnatural phrasing.
3. Suggest a more natural way to say what the student meant.
4. Then continue the role-play with your next line as the character.

Current scenario: [SCENARIO_DESCRIPTION]
Student level: [LEVEL]

You MUST respond in the following JSON format. Do not add any text outside the JSON:

{
  "character_reply": "<your in-character response to the student>",
  "corrections": [
    {
      "original": "<the word or phrase the student used>",
      "correction": "<the better version>",
      "explanation": "<one short sentence explaining why>",
      "severity": "error" | "suggestion"
    }
  ],
  "word_feedback": [
    {
      "word": "<each word in the student's sentence>",
      "status": "correct" | "caution" | "error"
    }
  ],
  "next_prompt": "<a gentle cue to keep the conversation going>",
  "session_note": "<one insight about the student's performance, or null>"
}"""


# ── Helper ───────────────────────────────────────────────────────────────────

def _build_system_prompt(payload: ConversationRequest) -> str:
    return (
        SPEAKING_SYSTEM_PROMPT
        .replace("[SCENARIO_ROLE]",        payload.scenario_role)
        .replace("[SCENARIO_DESCRIPTION]", payload.scenario_description)
        .replace("[LEVEL]",                payload.level)
    )


def _parse_response(raw: str) -> dict:
    """Strip accidental markdown fences before parsing JSON."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    return json.loads(cleaned.strip())


# ── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ConversationResponse)
async def chat(
    payload: ConversationRequest,
    request: Request,
    _=Depends(check_rate_limit),
):
    """
    Role-play conversation turn using Groq Llama 3.3 70B (primary).
    Falls back to Gemini 2.5 Flash on Groq 429 rate-limit error.

    Free tier limits:
      - Groq Llama 3.3 70B:  1,000 req/day · 30 RPM · 12K TPM
      - Gemini 2.5 Flash:    1,500 req/day · 15 RPM (fallback)

    Called by the frontend after transcription:
      POST /api/conversation/chat
      Body: ConversationRequest
    """
    system = _build_system_prompt(payload)

    # Build message history: system + prior turns + latest transcript
    messages = (
        [{"role": "system", "content": system}]
        + [{"role": m.role, "content": m.content} for m in payload.history]
        + [{"role": "user",   "content": payload.transcript}]
    )

    # ── Primary: Groq Llama 3.3 70B ─────────────────────────────────────────
    try:
        client = get_groq_client()
        response = client.chat.completions.create(
            model=GROQ_CHAT_MODEL,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.5,
            max_tokens=1024,
        )
        return _parse_response(response.choices[0].message.content)

    except Exception as groq_error:
        if "429" not in str(groq_error):
            raise HTTPException(
                status_code=500,
                detail=f"Conversation error (Groq): {groq_error}",
            )

    # ── Fallback: Gemini 2.5 Flash ───────────────────────────────────────────
    try:
        gemini = get_gemini_model()
        full_prompt = (
            system
            + "\n\nConversation so far:\n"
            + "\n".join(
                f"{m.role.upper()}: {m.content}" for m in payload.history
            )
            + f"\n\nSTUDENT (latest): {payload.transcript}"
            + "\n\nRespond ONLY with the JSON object described above."
        )
        result = gemini.generate_content(full_prompt)
        return _parse_response(result.text)

    except Exception as gemini_error:
        raise HTTPException(
            status_code=502,
            detail=f"All AI providers failed. Groq rate-limited; Gemini error: {gemini_error}",
        )