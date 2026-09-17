# backend/models/schemas.py

from pydantic import BaseModel
from typing import Optional, Literal


# ── Shared ──────────────────────────────────────────────────────────────────

Level = Literal["foundation", "everyday", "free"]
FeedbackStatus = Literal["correct", "caution", "error"]


# ── Speaking / Word Feedback ─────────────────────────────────────────────────

class WordFeedback(BaseModel):
    """
    Per-word feedback returned by the transcribe endpoint.
    Matches the WordFeedback TypeScript interface on the frontend exactly.
    suggestion and reason are optional — only present for caution/error words.
    """
    word:       str
    status:     FeedbackStatus
    suggestion: Optional[str] = None   # better alternative if caution or error
    reason:     Optional[str] = None   # short explanation if caution or error


class SpeechCorrectionRow(BaseModel):
    """
    Correction shape returned by routers/speech.py transcribe endpoint.
    Matches the CorrectionRow TypeScript interface on the frontend:
      { original: string; better: string; why: string }
    """
    original: str
    better:   str
    why:      str


# ── Conversation (routers/conversation.py) ───────────────────────────────────

class ConversationCorrectionRow(BaseModel):
    """
    Correction shape returned by routers/conversation.py chat endpoint.
    Different from SpeechCorrectionRow — this router is not called directly
    by the frontend in the current implementation (speech.py handles everything).
    """
    original:    str
    correction:  str
    explanation: str
    severity:    Literal["error", "suggestion"]


class ConversationMessage(BaseModel):
    role:    Literal["user", "assistant"]
    content: str


class ConversationRequest(BaseModel):
    scenario_role:        str
    scenario_description: str
    level:                Level
    history:              list[ConversationMessage]
    transcript:           str


class ConversationResponse(BaseModel):
    character_reply: str
    corrections:     list[ConversationCorrectionRow]
    word_feedback:   list[WordFeedback]
    next_prompt:     str
    session_note:    Optional[str] = None


# ── Writing ──────────────────────────────────────────────────────────────────

class InlineError(BaseModel):
    """
    Matches the InlineError TypeScript interface on the frontend exactly.
    All four fields are required — the AI prompt guarantees they are present.
    """
    original:    str
    corrected:   str
    explanation: str
    type:        Literal["grammar", "spelling", "style", "vocabulary"]


class WritingRequest(BaseModel):
    """
    FIX: frontend sends camelCase 'promptId', not snake_case 'prompt_id'.
    Changing the field name to promptId resolves the 422 Unprocessable Content error.

    Frontend call (WritingPage.tsx / PracticePage.tsx):
      fetch('/api/writing/evaluate', {
        body: JSON.stringify({ promptId: prompt.id, text }),
      })
    """
    promptId: str   # was: prompt_id — caused 422 because frontend sends camelCase
    promptInstruction: str
    text:     str


class WritingResponse(BaseModel):
    errors:         list[InlineError]
    rewritten_text: str
    overall_score:  int
    context_score:  int
    context_feedback: str
    top_insights:   list[str]


# ── Vocabulary ───────────────────────────────────────────────────────────────

class SentenceEvalRequest(BaseModel):
    word:     str
    sentence: str


class SentenceEvalResponse(BaseModel):
    contains_word:  bool
    used_correctly: bool
    feedback:       str
    improvement:    Optional[str] = None


# ── Session ──────────────────────────────────────────────────────────────────

class SessionSaveRequest(BaseModel):
    """
    Body shape for POST /api/session/save (not yet implemented in main.py).
    Accepts either speakingResult or writingFeedback or both — all optional
    so the frontend can call it after either module completes.
    """
    speaking_result:        Optional[dict] = None
    writing_feedback:       Optional[dict] = None
    warm_up_answer:         Optional[str]  = None
    completed_at:           Optional[str]  = None