// src/pages/PracticePage.tsx

import { useState, useMemo, useRef } from "react";
import { NavLink } from "react-router-dom";
import {
  WARMUP_QUESTIONS,
  DUMMY_SPEAKING_RESULT,
  DUMMY_SESSION_SUMMARY,
  SCENARIOS,
  WRITING_PROMPTS,
} from "../lib/dummy-data";
import type {
  SessionStep,
  WarmUpQuestion,
  WritingFeedback,
  ConversationTurn,
} from "../lib/types";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ProgressBar from "../components/ui/ProgressBar";

// ── Audio recorder hook ────────────────────────────────────────────────────
// Used by SpeakingStep to capture mic audio and send to the transcribe API.

function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.start();
    mediaRecorderRef.current = recorder;
  }

  function stop(): Promise<Blob> {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current!;
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        resolve(blob);
      };
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    });
  }

  return { start, stop };
}

// ── Session step config ───────────────────────────────────────────────────

const STEPS: { key: SessionStep; label: string; emoji: string }[] = [
  { key: "warmup", label: "Warm-up", emoji: "🧠" },
  { key: "speaking", label: "Speaking", emoji: "🎙️" },
  { key: "writing", label: "Writing", emoji: "✍️" },
  { key: "summary", label: "Summary", emoji: "✨" },
];

// ── Top progress stepper ──────────────────────────────────────────────────

function SessionStepper({ current }: { current: SessionStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="fl-container pt-8 pb-6">
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;
          const isPending = i > currentIndex;

          return (
            <div
              key={step.key}
              className="flex items-center flex-1 last:flex-none"
            >
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-base
                    transition-all duration-300
                    ${isDone ? "bg-primary/20 text-primary" : ""}
                    ${isActive ? "bg-primary text-white shadow-glow" : ""}
                    ${isPending ? "bg-border/40 text-text-subtle" : ""}
                  `}
                >
                  {isDone ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span>{step.emoji}</span>
                  )}
                </div>
                <span
                  className={`
                  text-xs font-medium hidden sm:block
                  ${isActive ? "text-primary" : isDone ? "text-text-muted" : "text-text-subtle"}
                `}
                >
                  {step.label}
                </span>
              </div>

              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-px mx-2 mb-5 sm:mb-0 transition-all duration-500"
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
  const isReady = wordCount >= 5;

  return (
    <div className="fl-container pb-10 animate-slide-up">
      <div className="max-w-xl mx-auto">
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

        <div className="fl-card p-5 mb-5 border-primary/20 bg-primary/5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-light mb-2">
            Today's question
          </p>
          <p className="text-base font-display font-semibold text-text-primary leading-snug">
            {question.question}
          </p>
        </div>

        <div className="fl-card p-1 mb-2 focus-within:border-primary/50 focus-within:shadow-glow transition-all duration-200">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Write your answer here — aim for at least one full sentence…"
            rows={4}
            className="
              w-full bg-transparent px-4 py-3 text-base text-text-primary
              placeholder:text-text-subtle resize-none outline-none font-body leading-relaxed
            "
          />
          <div className="px-4 pb-3 pt-1 border-t border-border/40 flex justify-between items-center">
            <span className="text-xs text-text-subtle">{wordCount} words</span>
            {isReady && (
              <span className="text-xs text-correct animate-fade-in">
                Ready ✓
              </span>
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
  const scenario = SCENARIOS[0];
  const audioRecorder = useAudioRecorder();

  // turns as state so we can patch real transcript + word_feedback from API
  const [turns, setTurns] = useState<ConversationTurn[]>([
    {
      id: "practice-turn-1-ai",
      role: "ai",
      text: scenario.initialPrompt ?? "Tell me about your recent work.",
      hint: scenario.initialHint,
    },
  ]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const visibleTurns = turns;
  const lastTurn = visibleTurns[visibleTurns.length - 1];
  const isAiTurn = lastTurn?.role === "ai";
  const userTurns = turns.filter((turn) => turn.role === "user");
  const isDone = userTurns.length >= 2 && isAiTurn;
  const progress = Math.round((userTurns.length / 2) * 100);

  async function handleRecord() {
    if (!isRecording) {
      setIsRecording(true);
      await audioRecorder.start();
    } else {
      setIsRecording(false);
      const blob = await audioRecorder.stop();
      const form = new FormData();
      form.append("audio", blob, "turn.webm");
      form.append("scenarioId", scenario.id);
      form.append("turnIndex", String(turnIndex));

      // API: POST /api/speech/transcribe
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/speech/transcribe`,
        { method: "POST", body: form },
      );
      const data = await res.json();

      const userTurn: ConversationTurn = {
        id: `practice-turn-${userTurns.length + 1}-user`,
        role: "user",
        text: data.transcript,
        wordFeedback: data.word_feedback,
      };
      const aiTurn: ConversationTurn = {
        id: `practice-turn-${userTurns.length + 2}-ai`,
        role: "ai",
        text: data.ai_reply_text ?? "Thanks for sharing. Tell me more.",
      };
      setTurns((prev) => [...prev, userTurn, aiTurn]);
      setTurnIndex((prev) => prev + 2);

      // Speak AI reply via browser Web Speech API — free, no API key
      if (data.ai_reply_text) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(data.ai_reply_text);
        utt.lang = "en-GB";
        utt.rate = 0.9;
        window.speechSynthesis.speak(utt);
      }
    }
  }

  return (
    <div className="fl-container pb-10 animate-slide-up">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">{scenario.emoji}</span>
          <div>
            <h2 className="font-display font-semibold text-text-primary text-sm">
              {scenario.title}
            </h2>
            <p className="text-xs text-text-subtle">
              Practice mode — 2 exchanges
            </p>
          </div>
          <Badge variant="primary" dot className="ml-auto">
            Live
          </Badge>
        </div>

        <ProgressBar
          value={progress}
          variant="primary"
          size="sm"
          className="mb-6"
        />

        <div className="flex flex-col gap-4 mb-6">
          {visibleTurns.map((turn) => (
            <div
              key={turn.id}
              className={`flex gap-3 animate-slide-up ${turn.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`
                w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm
                ${turn.role === "ai" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}
              `}
              >
                {turn.role === "ai" ? "🤖" : "🙂"}
              </div>

              <div
                className={`
                max-w-[80%] fl-card px-4 py-3
                ${turn.role === "ai" ? "border-border/60" : "border-accent/20 bg-accent/5"}
              `}
              >
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
                          ${wf.status === "error" ? "word-error" : ""}
                        `}
                      >
                        {wf.word}
                      </span>
                    ))}
                  </p>
                ) : (
                  <p className="text-text-primary text-base leading-relaxed">
                    {turn.text}
                  </p>
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

        {!isDone ? (
          <div className="fl-card p-5 border-primary/20 bg-primary/5 text-center">
            {isAiTurn ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-text-muted">
                  Your turn — tap to respond
                </p>
                <div className="relative w-14 h-14">
                  {isRecording && <span className="record-ring" />}
                  <button
                    onClick={handleRecord}
                    className={`
                      w-14 h-14 rounded-full flex items-center justify-center text-xl
                      transition-all duration-200 shadow-card
                      ${
                        isRecording
                          ? "bg-error text-white scale-110"
                          : "bg-primary/20 hover:bg-primary/30 text-primary"
                      }
                    `}
                    aria-label={
                      isRecording ? "Stop recording" : "Start recording"
                    }
                  >
                    {isRecording ? "⏹" : "🎙️"}
                  </button>
                </div>
                <p className="text-xs text-text-subtle">
                  {isRecording ? "Recording… tap to stop" : "Tap to speak"}
                </p>
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
            <Button
              onClick={onContinue}
              size="lg"
              className="w-full justify-center"
            >
              Continue to Writing →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 3: Writing mini-drill ────────────────────────────────────────────

function WritingStep({
  onContinue,
}: {
  onContinue: (result: WritingFeedback | null) => void;
}) {
  const prompt = WRITING_PROMPTS[0];
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [writingResult, setWritingResult] = useState<WritingFeedback | null>(
    null,
  );

  const wordCount = useMemo(
    () => text.trim().split(/\s+/).filter(Boolean).length,
    [text],
  );
  const sentences = useMemo(() => {
    const m = text.trim().match(/[^.!?]*[.!?]+/g);
    return m ? m.length : text.trim().length > 0 ? 1 : 0;
  }, [text]);
  const isReady =
    sentences >= prompt.minSentences && sentences <= prompt.maxSentences;

  async function handleSubmit() {
    setLoading(true);
    // API: POST /api/writing/evaluate — body: { promptId, text }
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/writing/evaluate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId: prompt.id, text }),
      },
    );
    const data: WritingFeedback = await res.json();
    setWritingResult(data);
    setLoading(false);
    setDone(true);
  }

  return (
    <div className="fl-container pb-10 animate-slide-up">
      <div className="max-w-xl mx-auto">
        <div className="fl-card p-5 mb-5 border-accent/20 bg-accent/5 flex items-start gap-4">
          <span className="text-3xl shrink-0">{prompt.emoji}</span>
          <div>
            <p className="font-display font-semibold text-text-primary text-sm mb-1">
              {prompt.title}
            </p>
            <p className="text-sm text-text-muted leading-relaxed">
              {prompt.instruction}
            </p>
            <p className="text-xs text-text-subtle mt-1">
              {prompt.minSentences}–{prompt.maxSentences} sentences
            </p>
          </div>
        </div>

        {!done ? (
          <>
            <div className="fl-card p-1 mb-3 focus-within:border-accent/50 focus-within:shadow-glow-accent transition-all duration-200">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your answer here…"
                rows={6}
                className="
                  w-full bg-transparent px-4 py-3 text-base text-text-primary
                  placeholder:text-text-subtle resize-none outline-none font-body leading-relaxed
                "
              />
              <div className="px-4 pb-3 pt-1 border-t border-border/40 flex justify-between">
                <span className="text-xs text-text-subtle">
                  {sentences}/{prompt.minSentences}–{prompt.maxSentences}{" "}
                  sentences · {wordCount} words
                </span>
                {isReady && (
                  <span className="text-xs text-correct animate-fade-in">
                    Ready ✓
                  </span>
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
          // ── done state ── show quick feedback + continue button
          <div className="animate-slide-up">
            <div className="fl-card p-5 mb-4 border-correct/20 bg-correct/5">
              <p className="text-xs font-semibold uppercase tracking-widest text-correct mb-3">
                Quick feedback
              </p>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-display font-bold text-4xl text-caution">
                  {writingResult?.overallScore ?? "—"}/5
                </span>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {writingResult
                      ? writingResult.overallScore >= 4
                        ? "Good"
                        : writingResult.overallScore >= 3
                          ? "Developing"
                          : "Needs work"
                      : ""}
                  </p>
                  <p className="text-xs text-text-muted">
                    {writingResult?.errors.length ?? 0} corrections found
                  </p>
                </div>
              </div>
              <ul className="flex flex-col gap-2">
                {(writingResult?.topInsights ?? []).map((insight, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-text-muted"
                  >
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
              onClick={() => onContinue(writingResult)}
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

function SummaryStep({
  onRestart,
  writingFeedback,
}: {
  onRestart: () => void;
  writingFeedback: WritingFeedback | null; // ← real writing data passed in
}) {
  // Real writing data; dummy speaking + streak until those integrations are done
  // TODO item 11: replace DUMMY_SPEAKING_RESULT with real speaking result from API
  // TODO item 16: replace streak/sessionsCompleted with GET /api/user/progress
  const speaking = DUMMY_SPEAKING_RESULT;
  const writing = writingFeedback ?? DUMMY_SESSION_SUMMARY.writingFeedback;
  const streak = DUMMY_SESSION_SUMMARY.streak;
  const sessions = DUMMY_SESSION_SUMMARY.sessionsCompleted;

  const topInsights = writingFeedback
    ? writingFeedback.topInsights
    : DUMMY_SESSION_SUMMARY.topInsights;

  const levelSuggestion =
    writing.overallScore >= 4
      ? "upgrade"
      : writing.overallScore >= 3
        ? "stay"
        : "encourage";

  const levelMessages = {
    stay: "You're building great habits — keep this level and master it.",
    upgrade: "You're ready for a challenge — consider moving up a level!",
    encourage: "Every session counts — you're making real progress.",
  };

  return (
    <div className="fl-container pb-14 animate-slide-up">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-pulse-slow">✨</div>
          <h2 className="font-display text-display-md font-bold text-text-primary mb-2">
            Session complete!
          </h2>
          <p className="text-sm text-text-muted">
            Here's what you achieved in today's 5-minute practice.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="fl-card p-5 text-center border-accent/20 bg-glow-accent">
            <div className="text-4xl mb-1">🔥</div>
            <div className="font-display font-bold text-3xl text-accent mb-0.5">
              {streak}
            </div>
            <div className="text-xs text-text-subtle">day streak</div>
          </div>
          <div className="fl-card p-5 text-center">
            <div className="text-4xl mb-1">📅</div>
            <div className="font-display font-bold text-3xl text-primary mb-0.5">
              {sessions}
            </div>
            <div className="text-xs text-text-subtle">sessions total</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
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
              <span className="text-xs text-text-subtle mb-0.5">
                tone score
              </span>
            </div>
            <ProgressBar
              value={(speaking.toneScore / 5) * 100}
              variant="primary"
              size="sm"
            />
            <p className="text-xs text-text-subtle mt-2">
              {speaking.wordsSpoken} words · {speaking.errorsFound} corrections
            </p>
          </div>

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
              <span className="text-xs text-text-subtle mb-0.5">
                overall score
              </span>
            </div>
            <ProgressBar
              value={(writing.overallScore / 5) * 100}
              variant="accent"
              size="sm"
            />
            <p className="text-xs text-text-subtle mt-2">
              {writing.errors.length} corrections found
            </p>
          </div>
        </div>

        <div className="fl-card p-5 mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-light mb-3">
            Today's top takeaways
          </p>
          <ul className="flex flex-col gap-2.5">
            {topInsights.map((insight, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-text-muted"
              >
                <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold">
                  {i + 1}
                </span>
                {insight}
              </li>
            ))}
          </ul>
        </div>

        <div className="fl-card p-4 mb-8 flex items-start gap-3 border-correct/20 bg-correct/5">
          <span className="text-xl mt-0.5">🎯</span>
          <div>
            <p className="text-sm font-medium text-text-primary mb-0.5">
              Level suggestion
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              {levelMessages[levelSuggestion]}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={onRestart}
            size="lg"
            className="w-full justify-center"
          >
            Start another session →
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <NavLink to="/speaking">
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-center"
              >
                🎙️ Full speaking drill
              </Button>
            </NavLink>
            <NavLink to="/writing">
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-center"
              >
                ✍️ Full writing drill
              </Button>
            </NavLink>
          </div>
          <Button
            variant="ghost"
            size="md"
            className="w-full justify-center text-text-subtle"
          >
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
  const [writingFeedback, setWritingFeedback] =
    useState<WritingFeedback | null>(null);

  const question = useMemo(
    () => WARMUP_QUESTIONS[Math.floor(Math.random() * WARMUP_QUESTIONS.length)],
    [],
  );

  function handleRestart() {
    setStep("warmup");
    setWritingFeedback(null);
  }

  return (
    <div className="min-h-full">
      <SessionStepper current={step} />
      <div className="border-t border-border/40 mb-2" />

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
        <WritingStep
          onContinue={(result) => {
            {
              /* ← captures real result */
            }
            setWritingFeedback(result);
            setStep("summary");
          }}
        />
      )}
      {step === "summary" && (
        <SummaryStep
          onRestart={handleRestart}
          writingFeedback={writingFeedback}
        />
      )}
    </div>
  );
}
