// src/lib/types.ts

// ── Shared ────────────────────────────────────────────────────────────────

export type Level = "foundation" | "everyday" | "free";

export type FeedbackStatus = "correct" | "caution" | "error";

export type SessionStep = "warmup" | "speaking" | "writing" | "summary";

// ── Speaking Module ────────────────────────────────────────────────────────

export interface Scenario {
  id: string;
  emoji: string;
  title: string;
  description: string;
  level: Level;
  totalTurns: number;
}

export interface WordFeedback {
  word: string;
  status: FeedbackStatus;
  suggestion?: string;
  reason?: string;
}

export interface ConversationTurn {
  id: string;
  role: "ai" | "user";
  text: string;
  wordFeedback?: WordFeedback[]; // only on user turns
  hint?: string;                 // next prompt hint shown after AI turn
}

export interface CorrectionRow {
  original: string;
  better: string;
  why: string;
}

export interface SpeakingResult {
  scenarioId: string;
  turnsCompleted: number;
  totalTurns: number;
  wordsSpoken: number;
  errorsFound: number;
  errorBreakdown: { grammar: number; style: number };
  toneScore: number; // out of 5
  topInsights: string[];
  corrections: CorrectionRow[];
}

// ── Writing Module ─────────────────────────────────────────────────────────

export interface WritingPrompt {
  id: string;
  emoji: string;
  title: string;
  instruction: string;
  level: Level;
  minSentences: number;
  maxSentences: number;
}

export interface InlineError {
  original: string;
  corrected: string;
  type: "grammar" | "spelling" | "style" | "vocabulary";
  explanation: string;
}

export interface WritingFeedback {
  promptId: string;
  originalText: string;
  rewrittenText: string;
  errors: InlineError[];
  overallScore: number; // out of 5
  topInsights: string[];
}

// ── Daily Practice ─────────────────────────────────────────────────────────

export interface WarmUpQuestion {
  id: string;
  question: string;
}

export interface DailySession {
  step: SessionStep;
  warmUpAnswer: string;
  speakingResult: SpeakingResult | null;
  writingFeedback: WritingFeedback | null;
  completedAt: string | null;
}

// ── Session Summary ────────────────────────────────────────────────────────

export interface SessionSummaryData {
  streak: number;
  sessionsCompleted: number;
  speakingResult: SpeakingResult;
  writingFeedback: WritingFeedback;
  topInsights: string[];        // merged across speaking + writing
  levelSuggestion: "stay" | "upgrade" | "encourage";
}

// ── Word of the Day ────────────────────────────────────────────────────────

export interface WordExample {
  context: string;   // e.g. "In a meeting", "In a formal email"
  sentence: string;
}

export interface WordDefinition {
  partOfSpeech: "noun" | "verb" | "adjective" | "adverb" | "phrase";
  meaning: string;
  examples: WordExample[];
}

export interface WordChallenge {
  instruction: string;        // e.g. "Use 'meticulous' to describe how you do your job"
  hints: string[];            // revealed one at a time
  exampleAnswer: string;      // shown after submission
}

export interface WordOfTheDay {
  id: string;
  word: string;
  phonetic: string;           // e.g. /məˈtɪk.jʊ.ləs/
  definitions: WordDefinition[];
  challenge: WordChallenge;
}

// ── API response shapes (for when backend is integrated) ──────────────────

// POST /api/speaking/transcribe
// Body: FormData { audio: Blob, scenarioId: string, turnIndex: number }
// Response:
// {
//   transcript: string;
//   word_feedback: WordFeedback[];
//   ai_reply_text: string;
//   ai_reply_audio_url: string;
//   corrections: CorrectionRow[];
//   turn_complete: boolean;
// }

// POST /api/writing/evaluate
// Body: { promptId: string; text: string }
// Response:
// {
//   errors: InlineError[];
//   rewritten_text: string;
//   overall_score: number;
//   top_insights: string[];
// }

// POST /api/session/save
// Body: DailySession
// Response: { saved: boolean; session_id: string }

// GET /api/user/progress
// Response: { streak: number; sessions_completed: number; level: Level }