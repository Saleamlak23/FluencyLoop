import json
from datetime import date
import httpx
from fastapi import APIRouter, HTTPException, Request, Depends
from models.schemas import SentenceEvalRequest, SentenceEvalResponse
from services.ai_client import get_groq_client, GROQ_FAST_MODEL
from services.rate_limiter import check_rate_limit

router = APIRouter()

# ── Word bank ────────────────────────────────────────────────────────────────
# Mirrors the frontend WORDS_OF_THE_DAY list in src/lib/content-data.ts.
# Both use the same deterministic day-index rotation so they always agree.
# Expand this list in V2 — the rotation logic handles any length automatically.

WORDS = [
    {
        "id": "meticulous",
        "word": "Meticulous",
        "phonetic": "/məˈtɪk.jʊ.ləs/",
        "definitions": [
            {
                "partOfSpeech": "adjective",
                "meaning": "Showing great attention to detail; very careful and precise.",
                "examples": [
                    {
                        "context": "Work",
                        "sentence": "She was meticulous in her research, checking every source twice.",
                    },
                    {
                        "context": "Daily life",
                        "sentence": "He kept meticulous records of every expense.",
                    },
                ],
            }
        ],
        "challenge": {
            "instruction": "Write a sentence using the word 'meticulous'.",
            "hints": [
                "Think of someone who pays close attention to small details.",
                "It is often used to describe work, planning, or a person's nature.",
            ],
            "exampleAnswer": "The architect was meticulous about every measurement before construction began.",
        },
    },
    {
        "id": "negotiate",
        "word": "Negotiate",
        "phonetic": "/nɪˈɡəʊ.ʃi.eɪt/",
        "definitions": [
            {
                "partOfSpeech": "verb",
                "meaning": "To discuss something formally in order to reach an agreement.",
                "examples": [
                    {
                        "context": "Business",
                        "sentence": "The two companies negotiated a deal that benefited both sides.",
                    },
                    {
                        "context": "Daily life",
                        "sentence": "She managed to negotiate a lower price for the car.",
                    },
                ],
            }
        ],
        "challenge": {
            "instruction": "Write a sentence using the word 'negotiate'.",
            "hints": [
                "Think of a situation where two people need to reach an agreement.",
                "It is commonly used in business, politics, and everyday bargaining.",
            ],
            "exampleAnswer": "He had to negotiate with his landlord to extend the lease by six months.",
        },
    },
    {
        "id": "concise",
        "word": "Concise",
        "phonetic": "/kənˈsaɪs/",
        "definitions": [
            {
                "partOfSpeech": "adjective",
                "meaning": "Giving a lot of information clearly and in a few words; brief but complete.",
                "examples": [
                    {
                        "context": "Writing",
                        "sentence": "A good email should be concise and easy to read.",
                    },
                    {
                        "context": "Speaking",
                        "sentence": "His concise explanation helped everyone understand the problem quickly.",
                    },
                ],
            }
        ],
        "challenge": {
            "instruction": "Write a sentence using the word 'concise'.",
            "hints": [
                "Think about communication — speaking or writing in a short, clear way.",
                "The opposite of concise is wordy or long-winded.",
            ],
            "exampleAnswer": "Her concise summary covered all the key points in just three sentences.",
        },
    },
    {
        "id": "persistent",
        "word": "Persistent",
        "phonetic": "/pəˈsɪs.tənt/",
        "definitions": [
            {
                "partOfSpeech": "adjective",
                "meaning": "Continuing firmly despite difficulty or opposition.",
                "examples": [
                    {
                        "context": "Personal growth",
                        "sentence": "Her persistent effort over months finally paid off when she passed the exam.",
                    },
                    {
                        "context": "Problem solving",
                        "sentence": "He was persistent in trying to fix the bug until he found the solution.",
                    },
                ],
            }
        ],
        "challenge": {
            "instruction": "Write a sentence using the word 'persistent'.",
            "hints": [
                "Think of someone who keeps trying even when things are difficult.",
                "It can describe a person, an effort, or even a problem that won't go away.",
            ],
            "exampleAnswer": "Despite several rejections, she remained persistent and eventually landed the job.",
        },
    },
    {
        "id": "clarify",
        "word": "Clarify",
        "phonetic": "/ˈklær.ɪ.faɪ/",
        "definitions": [
            {
                "partOfSpeech": "verb",
                "meaning": "To make something easier to understand by explaining it more fully.",
                "examples": [
                    {
                        "context": "Workplace",
                        "sentence": "Could you clarify what you mean by the deadline — is it end of day Friday?",
                    },
                    {
                        "context": "Learning",
                        "sentence": "The teacher clarified the grammar rule with several examples.",
                    },
                ],
            }
        ],
        "challenge": {
            "instruction": "Write a sentence using the word 'clarify'.",
            "hints": [
                "Think of a moment when something was confusing and needed more explanation.",
                "It is often used in questions: 'Can you clarify...?'",
            ],
            "exampleAnswer": "I asked my manager to clarify the project requirements before I started working.",
        },
    },
    {
        "id": "substantial",
        "word": "Substantial",
        "phonetic": "/səbˈstæn.ʃəl/",
        "definitions": [
            {
                "partOfSpeech": "adjective",
                "meaning": "Large in size, value, or importance; considerable.",
                "examples": [
                    {
                        "context": "Finance",
                        "sentence": "The project required a substantial investment before it could begin.",
                    },
                    {
                        "context": "Progress",
                        "sentence": "She made substantial improvements to her pronunciation after two weeks of practice.",
                    },
                ],
            }
        ],
        "challenge": {
            "instruction": "Write a sentence using the word 'substantial'.",
            "hints": [
                "Think of something large, significant, or more than expected.",
                "It is often used with nouns like improvement, amount, evidence, or difference.",
            ],
            "exampleAnswer": "There is a substantial difference between knowing grammar rules and speaking fluently.",
        },
    },
    {
        "id": "initiative",
        "word": "Initiative",
        "phonetic": "/ɪˈnɪʃ.ə.tɪv/",
        "definitions": [
            {
                "partOfSpeech": "noun",
                "meaning": "The ability to assess and take action independently without being told to.",
                "examples": [
                    {
                        "context": "Work",
                        "sentence": "She showed great initiative by identifying the problem before anyone else noticed.",
                    },
                    {
                        "context": "Leadership",
                        "sentence": "Taking initiative is one of the most valued qualities in a team leader.",
                    },
                ],
            }
        ],
        "challenge": {
            "instruction": "Write a sentence using the word 'initiative'.",
            "hints": [
                "Think of a situation where someone acted without being asked.",
                "Common phrases: 'take the initiative', 'show initiative', 'on your own initiative'.",
            ],
            "exampleAnswer": "He took the initiative to organise the meeting agenda before the manager asked.",
        },
    },
]

# ── Rotation logic ───────────────────────────────────────────────────────────

def _get_todays_word() -> dict:
    """
    Deterministic daily rotation — same word for the entire UTC day.
    Uses days elapsed since 2024-01-01 modulo word bank length.
    Matches the frontend getTodaysWord() logic exactly.
    """
    start = date(2024, 1, 1)
    days_since = (date.today() - start).days
    return WORDS[days_since % len(WORDS)]


PUBLIC_WORD_CANDIDATES = (
    "meticulous",
    "negotiate",
    "concise",
    "persistent",
    "clarify",
    "substantial",
    "initiative",
)


async def _get_live_word() -> dict:
    """Build today's lesson from the public Dictionary API."""
    start = date(2024, 1, 1)
    days_since = (date.today() - start).days
    word = PUBLIC_WORD_CANDIDATES[days_since % len(PUBLIC_WORD_CANDIDATES)]

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
            )
            response.raise_for_status()
            entry = response.json()[0]
    except (httpx.HTTPError, IndexError, KeyError, TypeError, ValueError) as error:
        # Keep the feature available during a public API outage. The live API
        # remains the primary source; this is only the deterministic fallback.
        print(
            f"[vocabulary] public dictionary lookup failed: "
            f"{type(error).__name__}: {error!r}"
        )
        return _get_todays_word()

    phonetic = next(
        (
            item.get("text")
            for item in entry.get("phonetics", [])
            if isinstance(item, dict) and item.get("text")
        ),
        "",
    )
    definitions = []
    for meaning in entry.get("meanings", []):
        part_of_speech = meaning.get("partOfSpeech", "phrase")
        if part_of_speech not in {"noun", "verb", "adjective", "adverb", "phrase"}:
            part_of_speech = "phrase"
        examples = [
            {
                "context": "Example",
                "sentence": definition["example"],
            }
            for definition in meaning.get("definitions", [])
            if definition.get("example")
        ][:3]
        definitions.append(
            {
                "partOfSpeech": part_of_speech,
                "meaning": meaning.get("definitions", [{}])[0].get(
                    "definition", "A useful English word to practise today."
                ),
                "examples": examples,
            }
        )

    return {
        "id": word,
        "word": entry.get("word", word).title(),
        "phonetic": phonetic,
        "definitions": definitions,
        "challenge": {
            "instruction": f"Write a sentence using the word '{word}'.",
            "hints": [
                f"Use '{word}' in a sentence about work, study, or daily life.",
                "Make sure the sentence shows the word's meaning clearly.",
            ],
            "exampleAnswer": f"I used the word {word} naturally in a sentence today.",
        },
    }


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/word-of-the-day")
async def word_of_the_day():
    """
    Return today's word using the public Dictionary API.
    The candidate word is deterministic, while its definition is live.

    GET /api/vocabulary/word-of-the-day
    Response: WordOfTheDay object
    """
    return await _get_live_word()


@router.post("/evaluate-sentence", response_model=SentenceEvalResponse)
async def evaluate_sentence(
    payload: SentenceEvalRequest,
    request: Request,
    _=Depends(check_rate_limit),
):
    """
    Evaluate whether the student used today's word correctly in a sentence.
    Uses Groq Llama 3.1 8B Instant (fast model, 14,400 RPD free) — lightweight task.

    POST /api/vocabulary/evaluate-sentence
    Body: { word: str, sentence: str }
    """
    if not payload.sentence or len(payload.sentence.strip()) < 5:
        raise HTTPException(
            status_code=400,
            detail="Sentence is too short. Please write a complete sentence.",
        )

    prompt = f"""The student was asked to use the word "{payload.word}" in a sentence.
Their sentence: "{payload.sentence}"

Respond ONLY with valid JSON — no markdown, no preamble:
{{
  "contains_word": true | false,
  "used_correctly": true | false,
  "feedback": "<one encouraging sentence of feedback>",
  "improvement": "<a slightly improved version of their sentence, or null if it is already good>"
}}"""

    try:
        client = get_groq_client()
        response = client.chat.completions.create(
            model=GROQ_FAST_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=256,
        )
        raw = response.choices[0].message.content
        return json.loads(raw)

    except Exception as e:
        if "429" in str(e):
            raise HTTPException(
                status_code=429,
                detail="AI rate limit reached. Please try again in a moment.",
            )
        raise HTTPException(
            status_code=500,
            detail=f"Sentence evaluation failed: {e}",
        )