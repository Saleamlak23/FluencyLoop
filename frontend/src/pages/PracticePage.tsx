// src/pages/PracticePage.tsx

import { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  WARMUP_QUESTIONS,
  DUMMY_CONVERSATION,
  DUMMY_SPEAKING_RESULT,
  DUMMY_WRITING_FEEDBACK,
  DUMMY_SESSION_SUMMARY,
  SCENARIOS,
  WRITING_PROMPTS,
} from "../lib/dummy-data";
import type { SessionStep, ConversationTurn, WarmUpQuestion } from "../lib/types";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ProgressBar from "../components/ui/ProgressBar";

// ── Session step config ───────────────────────────────────────────────────

const STEPS: { key: SessionStep; label: string; emoji: string }[] = [
  { key: "warmup",   label: "Warm-up",  emoji: "🧠" },
  { key: "speaking", label: "Speaking", emoji: "🎙️" },
  { key: "writing",  label: "Writing",  emoji: "✍️" },
  { key: "summary",  label: "Summary",  emoji: "✨" },
];

// ── Top progress stepper ──────────────────────────────────────────────────

function SessionStepper({ current }: { current: SessionStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="fl-container pt-8 pb-6">
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const isDone    = i < currentIndex;
          const isActive  = i === currentIndex;
          const isPending = i > currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Step node */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-base
                    transition-all duration-300
                    ${isDone   ? "bg-primary/20 text-primary"         : ""}
                    ${isActive ? "bg-primary text-white shadow-glow"  : ""}
                    ${isPending? "bg-border/40 text-text-subtle"       : ""}
                  `}
                >
                  {isDone ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{step.emoji}</span>
                  )}
                </div>
                <span className={`
                  text-xs font-medium hidden sm:block
                  ${isActive ? "text-primary" : isDone ? "text-text-muted" : "text-text-subtle"}
                `}>
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-2 mb-5 sm:mb-0 transition-all duration-500"
                  style={{
                    background: isDone
                      ? "linear-gradient(to right, #6366F1, #6366F1)"
                      : "rgba(55,65,81,0.6)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 1: Warm-up ───────────────────────────────────────────────────────

function WarmUpStep({
  question,
  onContinue,
}: {
  question: WarmUpQuestion;
  onContinue: (answer: string) => void;
}) {
  const [answer, setAnswer] = useState("");
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const isReady   = wordCount >= 5;

  return (
    <div className="fl-container pb-10 animate-slide-up">
      <div className="max-w-xl mx-auto">

        {/* Intro */}
        <div className="text-center mb-8">
          <span className="text-5xl block mb-4">🧠</span>
          <h2 className="font-display text-display-sm font-bold text-text-primary mb-2">
            Quick warm-up
          </h2>
          <p className="text-sm text-text-muted">
            Write a short answer in English. No pressure — this just gets your
            brain into English-thinking mode.
          </p>
        </div>

        {/* Question card */}
        <div className="fl-card p-5 mb-5 border-primary/20 bg-primary/5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-light mb-2">
            Today's question
          </p>
          <p className="text-base font-display font-semibold text-text-primary leading-snug">
            {question.question}
          </p>
        </div>

        {/* Answer area */}
        <div className="fl-card p-1 mb-2 focus-within:border-primary/50 focus-within:shadow-glow transition-all duration-200">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Write your answer here — aim for at least one full sentence…"
            rows={4}
            className="
              w-full bg-transparent px-4 py-3 text-base text-text-primary
              placeholder:text-text-subtle resize-none outline-none
              font-body leading-relaxed
            "
          />
          <div className="px-4 pb-3 pt-1 border-t border-border/40 flex justify-between items-center">
            <span className="text-xs text-text-subtle">{wordCount} words</span>
            {isReady && (
              <span className="text-xs text-correct animate-fade-in">Ready ✓</span>
            )}
          </div>
        </div>

        <p className="text-xs text-text-subtle mb-6">
          This won't be graded — just write naturally.
        </p>

        <Button
          onClick={() => onContinue(answer)}
          disabled={!isReady}
          size="lg"
          className="w-full justify-center"
          rightIcon={<span>→</span>}
        >
          Continue to Speaking
        </Button>
      </div>
    </div>
  );
}

// ── Step 2: Speaking mini-drill ───────────────────────────────────────────

function SpeakingStep({ onContinue }: { onContinue: () => void }) {
  const scenario   = SCENARIOS[0];
  // Only show first 4 turns (2 exchanges) in the practice flow
  const turns      = DUMMY_CONVERSATION.slice(0, 4);
  const [turnIndex, setTurnIndex]     = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const visibleTurns = turns.slice(0, turnIndex + 1);
  const lastTurn     = visibleTurns[visibleTurns.length - 1];
  const isAiTurn     = lastTurn?.role === "ai";
  const isDone       = turnIndex >= turns.length - 1;
  const progress     = Math.round(((turnIndex + 1) / turns.length) * 100);

  function handleRecord() {
    if (!isRecording) {
      // Real: start MediaRecorder
      // API: POST /api/speaking/transcribe — body: FormData { audio, scenarioId, turnIndex }
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setTurnIndex((prev) => Math.min(prev + 1, turns.length - 1));
      }, 1500);
    } else {
      setIsRecording(false);
      setTurnIndex((prev) => Math.min(prev + 1, turns.length - 1));
    }
  }

  return (
    <div className="fl-container pb-10 animate-slide-up">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">{scenario.emoji}</span>
          <div>
            <h2 className="font-display font-semibold text-text-primary text-sm">
              {scenario.title}
            </h2>
            <p className="text-xs text-text-subtle">Practice mode — 2 exchanges</p>
          </div>
          <Badge variant="primary" dot className="ml-auto">Live</Badge>
        </div>

        <ProgressBar value={progress} variant="primary" size="sm" className="mb-6" />

        {/* Conversation */}
        <div className="flex flex-col gap-4 mb-6">
          {visibleTurns.map((turn) => (
            <div
              key={turn.id}
              className={`flex gap-3 animate-slide-up ${turn.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`
                w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm
                ${turn.role === "ai" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}
              `}>
                {turn.role === "ai" ? "🤖" : "🙂"}
              </div>

              <div className={`
                max-w-[80%] fl-card px-4 py-3
                ${turn.role === "ai" ? "border-border/60" : "border-accent/20 bg-accent/5"}
              `}>
                {/* Word feedback for user turns */}
                {turn.role === "user" && turn.wordFeedback ? (
                  <p className="text-base leading-loose">
                    {turn.wordFeedback.map((wf, i) => (
                      <span
                        key={i}
                        title={wf.suggestion ? `→ ${wf.suggestion}` : undefined}
                        className={`
                          mx-0.5 cursor-default
                          ${wf.status === "correct" ? "word-correct" : ""}
                          ${wf.status === "caution" ? "word-caution" : ""}
                          ${wf.status === "error"   ? "word-error"   : ""}
                        `}
                      >
                        {wf.word}
                      </span>
                    ))}
                  </p>
                ) : (
                  <p className="text-text-primary text-base leading-relaxed">{turn.text}</p>
                )}

                {turn.role === "ai" && turn.hint && (
                  <p className="mt-2 pt-2 border-t border-border/40 text-xs text-text-subtle italic">
                    💡 {turn.hint}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action */}
        {!isDone ? (
          <div className="fl-card p-5 border-primary/20 bg-primary/5 text-center">
            {isAiTurn ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-text-muted">Your turn — tap to respond</p>
                <div className="relative w-14 h-14">
                  {isRecording && <span className="record-ring" />}
                  <button
                    onClick={handleRecord}
                    className={`
                      w-14 h-14 rounded-full flex items-center justify-center text-xl
                      transition-all duration-200 shadow-card
                      ${isRecording
                        ? "bg-error text-white scale-110"
                        : "bg-primary/20 hover:bg-primary/30 text-primary"}
                    `}
                    aria-label={isRecording ? "Stop recording" : "Start recording"}
                  >
                    {isRecording ? "⏹" : "🎙️"}
                  </button>
                </div>
                <p className="text-xs text-text-subtle">
                  {isRecording ? "Recording… tap to stop" : "Tap to speak"}
                </p>
                <button
                  onClick={handleRecord}
                  className="text-xs text-primary-light underline underline-offset-2 opacity-60 hover:opacity-100"
                >
                  Skip (dummy response)
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-text-muted">Waiting for AI…</p>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse-slow"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-text-muted mb-4">
              🎉 Nice work — moving on to writing!
            </p>
            <Button onClick={onContinue} size="lg" className="w-full justify-center">
              Continue to Writing →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 3: Writing mini-drill ────────────────────────────────────────────

function WritingStep({ onContinue }: { onContinue: () => void }) {
  const prompt    = WRITING_PROMPTS[0];
  const [text, setText]     = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);

  const wordCount  = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);
  const sentences  = useMemo(() => {
    const m = text.trim().match(/[^.!?]*[.!?]+/g);
    return m ? m.length : text.trim().length > 0 ? 1 : 0;
  }, [text]);
  const isReady = sentences >= prompt.minSentences && sentences <= prompt.maxSentences;

  function handleSubmit() {
    setLoading(true);
    // API: POST /api/writing/evaluate — body: { promptId: prompt.id, text }
    setTimeout(() => {
      setLoading(false);
      setDone(true);
    }, 1800);
  }

  return (
    <div className="fl-container pb-10 animate-slide-up">
      <div className="max-w-xl mx-auto">

        {/* Prompt card */}
        <div className="fl-card p-5 mb-5 border-accent/20 bg-accent/5 flex items-start gap-4">
          <span className="text-3xl shrink-0">{prompt.emoji}</span>
          <div>
            <p className="font-display font-semibold text-text-primary text-sm mb-1">
              {prompt.title}
            </p>
            <p className="text-sm text-text-muted leading-relaxed">{prompt.instruction}</p>
            <p className="text-xs text-text-subtle mt-1">
              {prompt.minSentences}–{prompt.maxSentences} sentences
            </p>
          </div>
        </div>

        {!done ? (
          <>
            {/* Textarea */}
            <div className="fl-card p-1 mb-3 focus-within:border-accent/50 focus-within:shadow-glow-accent transition-all duration-200">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your answer here…"
                rows={6}
                className="
                  w-full bg-transparent px-4 py-3 text-base text-text-primary
                  placeholder:text-text-subtle resize-none outline-none
                  font-body leading-relaxed
                "
              />
              <div className="px-4 pb-3 pt-1 border-t border-border/40 flex justify-between">
                <span className="text-xs text-text-subtle">
                  {sentences}/{prompt.minSentences}–{prompt.maxSentences} sentences · {wordCount} words
                </span>
                {isReady && (
                  <span className="text-xs text-correct animate-fade-in">Ready ✓</span>
                )}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!isReady}
              loading={loading}
              size="lg"
              className="w-full justify-center"
              rightIcon={<span>→</span>}
            >
              Check my writing
            </Button>
          </>
        ) : (
          /* Lightweight feedback preview (full feedback is on /writing) */
          <div className="animate-slide-up">
            <div className="fl-card p-5 mb-4 border-correct/20 bg-correct/5">
              <p className="text-xs font-semibold uppercase tracking-widest text-correct mb-3">
                Quick feedback
              </p>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-display font-bold text-4xl text-caution">
                  {DUMMY_WRITING_FEEDBACK.overallScore}/5
                </span>
                <div>
                  <p className="text-sm font-medium text-text-primary">Developing</p>
                  <p className="text-xs text-text-muted">
                    {DUMMY_WRITING_FEEDBACK.errors.length} corrections found
                  </p>
                </div>
              </div>
              <ul className="flex flex-col gap-2">
                {DUMMY_WRITING_FEEDBACK.topInsights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-text-muted">
                    <span className="text-accent shrink-0 mt-0.5">→</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-text-subtle mb-5 text-center">
              Full writing breakdown available after your session summary.
            </p>

            <Button
              onClick={onContinue}
              size="lg"
              className="w-full justify-center"
              rightIcon={<span>→</span>}
            >
              See session summary
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 4: Session summary ───────────────────────────────────────────────

function SummaryStep({ onRestart }: { onRestart: () => void }) {
  const summary = DUMMY_SESSION_SUMMARY;
  const speaking = summary.speakingResult;
  const writing  = summary.writingFeedback;

  const levelMessages = {
    stay:      "You're building great habits — keep this level and master it.",
    upgrade:   "You're ready for a challenge — consider moving up a level!",
    encourage: "Every session counts — you're making real progress.",
  };

  return (
    <div className="fl-container pb-14 animate-slide-up">
      <div className="max-w-xl mx-auto">

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-pulse-slow">✨</div>
          <h2 className="font-display text-display-md font-bold text-text-primary mb-2">
            Session complete!
          </h2>
          <p className="text-sm text-text-muted">
            Here's what you achieved in today's 5-minute practice.
          </p>
        </div>

        {/* Streak + sessions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="fl-card p-5 text-center border-accent/20 bg-glow-accent">
            <div className="text-4xl mb-1">🔥</div>
            <div className="font-display font-bold text-3xl text-accent mb-0.5">
              {summary.streak}
            </div>
            <div className="text-xs text-text-subtle">day streak</div>
          </div>
          <div className="fl-card p-5 text-center">
            <div className="text-4xl mb-1">📅</div>
            <div className="font-display font-bold text-3xl text-primary mb-0.5">
              {summary.sessionsCompleted}
            </div>
            <div className="text-xs text-text-subtle">sessions total</div>
          </div>
        </div>

        {/* Speaking vs Writing breakdown */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Speaking */}
          <div className="fl-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎙️</span>
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                Speaking
              </span>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="font-display font-bold text-2xl text-primary">
                {speaking.toneScore}/5
              </span>
              <span className="text-xs text-text-subtle mb-0.5">tone score</span>
            </div>
            <ProgressBar value={(speaking.toneScore / 5) * 100} variant="primary" size="sm" />
            <p className="text-xs text-text-subtle mt-2">
              {speaking.wordsSpoken} words · {speaking.errorsFound} corrections
            </p>
          </div>

          {/* Writing */}
          <div className="fl-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✍️</span>
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                Writing
              </span>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="font-display font-bold text-2xl text-accent">
                {writing.overallScore}/5
              </span>
              <span className="text-xs text-text-subtle mb-0.5">overall score</span>
            </div>
            <ProgressBar value={(writing.overallScore / 5) * 100} variant="accent" size="sm" />
            <p className="text-xs text-text-subtle mt-2">
              {writing.errors.length} corrections found
            </p>
          </div>
        </div>

        {/* Top combined insights */}
        <div className="fl-card p-5 mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-light mb-3">
            Today's top takeaways
          </p>
          <ul className="flex flex-col gap-2.5">
            {summary.topInsights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold">
                  {i + 1}
                </span>
                {insight}
              </li>
            ))}
          </ul>
        </div>

        {/* Level suggestion */}
        <div className="fl-card p-4 mb-8 flex items-start gap-3 border-correct/20 bg-correct/5">
          <span className="text-xl mt-0.5">🎯</span>
          <div>
            <p className="text-sm font-medium text-text-primary mb-0.5">Level suggestion</p>
            <p className="text-xs text-text-muted leading-relaxed">
              {levelMessages[summary.levelSuggestion]}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button onClick={onRestart} size="lg" className="w-full justify-center">
            Start another session →
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <NavLink to="/speaking">
              <Button variant="secondary" size="md" className="w-full justify-center">
                🎙️ Full speaking drill
              </Button>
            </NavLink>
            <NavLink to="/writing">
              <Button variant="secondary" size="md" className="w-full justify-center">
                ✍️ Full writing drill
              </Button>
            </NavLink>
          </div>
          <Button variant="ghost" size="md" className="w-full justify-center text-text-subtle">
            {/* API: POST /api/session/save */}
            Save session to progress
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────

export default function PracticePage() {
  const [step, setStep] = useState<SessionStep>("warmup");

  // Pick a random warm-up question
  const question = useMemo(
    () => WARMUP_QUESTIONS[Math.floor(Math.random() * WARMUP_QUESTIONS.length)],
    []
  );

  function handleRestart() {
    setStep("warmup");
  }

  return (
    <div className="min-h-full">
      {/* Step indicator */}
      <SessionStepper current={step} />

      {/* Divider */}
      <div className="border-t border-border/40 mb-2" />

      {/* Active step */}
      {step === "warmup" && (
        <WarmUpStep
          question={question}
          onContinue={() => setStep("speaking")}
        />
      )}
      {step === "speaking" && (
        <SpeakingStep onContinue={() => setStep("writing")} />
      )}
      {step === "writing" && (
        <WritingStep onContinue={() => setStep("summary")} />
      )}
      {step === "summary" && (
        <SummaryStep onRestart={handleRestart} />
      )}
    </div>
  );
}