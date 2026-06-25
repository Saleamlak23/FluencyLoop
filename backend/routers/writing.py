import json
from fastapi import APIRouter, HTTPException, Request, Depends
from models.schemas import WritingRequest, WritingResponse
from services.ai_client import (
    get_groq_client,
    get_gemini_model,
    get_mistral_client,
    GROQ_CHAT_MODEL,
    MISTRAL_MODEL,
)
from services.rate_limiter import check_rate_limit

router = APIRouter()

# ── System prompt ────────────────────────────────────────────────────────────

WRITING_SYSTEM_PROMPT = """You are an expert English writing coach helping an intermediate English learner improve their written expression. Your feedback is specific, constructive, and encouraging.

Analyse the student's text and respond ONLY with valid JSON in the following format.
Do not add any markdown, preamble, or explanation outside the JSON object:

{
  "errors": [
    {
      "original": "<the incorrect or unnatural phrase, verbatim from the student's text>",
      "corrected": "<the corrected version>",
      "explanation": "<one clear sentence explaining the rule or improvement>",
      "type": "grammar" | "spelling" | "style" | "vocabulary"
    }
  ],
  "rewritten_text": "<a fully rewritten, natural version of the student's text>",
  "overall_score": <integer 1-5>,
  "top_insights": ["<insight 1>", "<insight 2>", "<insight 3>"]
}

Be thorough but kind. If the text has no errors, say so warmly in top_insights and give a score of 5."""


# ── Helper ───────────────────────────────────────────────────────────────────

def _parse_response(raw: str) -> dict:
    """Strip accidental markdown fences before parsing JSON."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    return json.loads(cleaned.strip())


def _validate_scores(data: dict) -> dict:
    """Clamp overall_score to 1–5 in case the model drifts out of range."""
    score = data.get("overall_score", 3)
    data["overall_score"] = max(1, min(5, int(score)))
    return data


# ── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/evaluate", response_model=WritingResponse)
async def evaluate_writing(
    payload: WritingRequest,
    request: Request,
    _=Depends(check_rate_limit),
):
    """
    Evaluate student writing using a three-provider fallback chain.

    Provider chain:
      1. Groq Llama 3.3 70B   — primary   (1,000 req/day free)
      2. Gemini 2.5 Flash     — fallback 1 (1,500 req/day free)
      3. Mistral Large        — fallback 2 (~1B tokens/month free, 2 RPM)

    Called by the frontend on writing submission:
      POST /api/writing/evaluate
      Body: { prompt_id: str, text: str }
    """
    if not payload.text or len(payload.text.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Text is too short to evaluate. Please write at least a sentence.",
        )

    messages = [
        {"role": "system", "content": WRITING_SYSTEM_PROMPT},
        {"role": "user",   "content": f"Please evaluate this text:\n\n{payload.text}"},
    ]

    # ── Primary: Groq Llama 3.3 70B ─────────────────────────────────────────
    try:
        client = get_groq_client()
        response = client.chat.completions.create(
            model=GROQ_CHAT_MODEL,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=1024,
        )
        data = _parse_response(response.choices[0].message.content)
        return _validate_scores(data)

    except Exception as groq_error:
        if "429" not in str(groq_error):
            raise HTTPException(
                status_code=500,
                detail=f"Writing evaluation error (Groq): {groq_error}",
            )

    # ── Fallback 1: Gemini 2.5 Flash ────────────────────────────────────────
    try:
        gemini = get_gemini_model()
        full_prompt = (
            WRITING_SYSTEM_PROMPT
            + f"\n\nPlease evaluate this text:\n\n{payload.text}"
        )
        result = gemini.generate_content(full_prompt)
        data = _parse_response(result.text)
        return _validate_scores(data)

    except Exception as gemini_error:
        if "429" not in str(gemini_error):
            raise HTTPException(
                status_code=502,
                detail=f"Writing evaluation error (Gemini): {gemini_error}",
            )

    # ── Fallback 2: Mistral Large ────────────────────────────────────────────
    try:
        mistral = get_mistral_client()
        response = mistral.chat.completions.create(
            model=MISTRAL_MODEL,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=1024,
        )
        data = _parse_response(response.choices[0].message.content)
        return _validate_scores(data)

    except Exception as mistral_error:
        raise HTTPException(
            status_code=503,
            detail=(
                "All AI providers are currently rate-limited. "
                f"Last error (Mistral): {mistral_error}. Please try again in a minute."
            ),
        )