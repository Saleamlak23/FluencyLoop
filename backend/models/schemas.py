from pydantic import BaseModel
from typing import Optional, Literal


# ── Shared ─────────────────────────────────────────────────────────────────

Level = Literal["foundation", "everyday", "free"]
FeedbackStatus = Literal["correct", "caution", "error"]


# ── Speaking / Conversation ─────────────────────────────────────────────────

class WordFeedback(BaseModel):
    word: str
    status: FeedbackStatus


class CorrectionRow(BaseModel):
    original: str
    correction: str
    explanation: str
    severity: Literal["error", "suggestion"]


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ConversationRequest(BaseModel):
    scenario_role: str
    scenario_description: str
    level: Level
    history: list[ConversationMessage]
    transcript: str


class ConversationResponse(BaseModel):
    character_reply: str
    corrections: list[CorrectionRow]
    word_feedback: list[WordFeedback]
    next_prompt: str
    session_note: Optional[str] = None


# ── Writing ─────────────────────────────────────────────────────────────────

class InlineError(BaseModel):
    original: str
    corrected: str
    explanation: str
    type: Literal["grammar", "spelling", "style", "vocabulary"]


class WritingRequest(BaseModel):
    prompt_id: str
    text: str


class WritingResponse(BaseModel):
    errors: list[InlineError]
    rewritten_text: str
    overall_score: int
    top_insights: list[str]


# ── Vocabulary ──────────────────────────────────────────────────────────────

class SentenceEvalRequest(BaseModel):
    word: str
    sentence: str


class SentenceEvalResponse(BaseModel):
    contains_word: bool
    used_correctly: bool
    feedback: str
    improvement: Optional[str] = None


# ── Session ─────────────────────────────────────────────────────────────────

class SessionSaveRequest(BaseModel):
    level: Level
    warm_up_answer: str
    words_spoken: int
    errors_found: int
    overall_writing_score: int
    top_insights: list[str]
    completed_at: str