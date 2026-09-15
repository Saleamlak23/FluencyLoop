// src/pages/SpeakingPage.tsx

import { useState, useRef } from "react";
import { SCENARIOS, DUMMY_CONVERSATION } from "../lib/dummy-data";
import type {
  Scenario,
  ConversationTurn,
  SpeakingResult,
} from "../lib/types";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ProgressBar from "../components/ui/ProgressBar";

// ── Audio recorder hook ────────────────────────────────────────────────────

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

// ── Word-level transcript renderer ────────────────────────────────────────

function TranscriptLine({ turn }: { turn: ConversationTurn }) {
  const [hoveredWord, setHoveredWord] = useState<number | null>(null);

  if (!turn.wordFeedback) {
    return <p className="text-text-primary leading-relaxed">{turn.text}</p>;
  }

  return (
    <div className="leading-loose">
      {turn.wordFeedback.map((wf, i) => {
        const isHovered = hoveredWord === i;
        const hasTip = wf.suggestion || wf.reason;

        return (
          <span key={i} className="relative inline-block mx-0.5">
            <span
              className={`
                cursor-default transition-colors duration-150
                ${wf.status === "correct" ? "word-correct" : ""}
                ${wf.status === "caution" ? "word-caution" : ""}
                ${wf.status === "error" ? "word-error" : ""}
              `}
              onMouseEnter={() => hasTip && setHoveredWord(i)}
              onMouseLeave={() => setHoveredWord(null)}
            >
              {wf.word}
            </span>

            {isHovered && hasTip && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 w-52 animate-fade-in">
                <span className="block bg-surface border border-border rounded-lg p-2.5 shadow-card text-left">
                  {wf.suggestion && (
                    <span className="block text-xs font-semibold text-text-primary mb-1">
                      → {wf.suggestion}
                    </span>
                  )}
                  {wf.reason && (
                    <span className="block text-xs text-text-muted leading-snug">
                      {wf.reason}
                    </span>
                  )}
                </span>
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function FeedbackLegend() {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-subtle">
      <span className="text-correct">Green: correct</span>
      <span className="text-caution">Yellow: improve</span>
      <span className="text-error">Red: incorrect</span>
    </div>
  );
}

function buildSuggestedResponse(
  feedback: ConversationTurn["wordFeedback"],
) {
  return (feedback ?? [])
    .map((word) => word.suggestion ?? word.word)
    .join(" ");
}

// ── Scenario picker ───────────────────────────────────────────────────────

function ScenarioPicker({ onSelect }: { onSelect: (s: Scenario) => void }) {
  return (
    <div className="fl-container py-10 animate-slide-up">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-light mb-1">
          Speaking drill
        </p>
        <h1 className="font-display text-display-md font-bold text-text-primary">
          Choose a scenario
        </h1>
        <p className="text-text-muted text-sm mt-2 max-w-md">
          Pick a real-life situation. The AI plays the other person — you speak
          naturally and get word-level feedback after each turn.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario)}
            className="fl-card p-5 text-left flex items-start gap-5 hover:border-primary/40 hover:shadow-glow transition-all duration-200 group"
          >
            <span className="text-4xl mt-0.5">{scenario.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-display font-semibold text-text-primary group-hover:text-primary transition-colors">
                  {scenario.title}
                </span>
                <Badge variant="neutral">{scenario.level}</Badge>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">
                {scenario.description}
              </p>
              <p className="text-xs text-text-subtle mt-2">
                {scenario.totalTurns} conversation turns
              </p>
            </div>
            <svg
              className="w-5 h-5 text-text-subtle group-hover:text-primary transition-colors shrink-0 mt-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Active conversation ───────────────────────────────────────────────────

function ConversationView({
  scenario,
  turns,
  currentTurnIndex,
  isRecording,
  attemptCount,
  correctedResponse,
  correctedTurnId,
  error,
  onRecord,
  onFinish,
}: {
  scenario: Scenario;
  turns: ConversationTurn[];
  currentTurnIndex: number;
  isRecording: boolean;
  attemptCount: number;
  correctedResponse: string | null;
  correctedTurnId: string | null;
  error: string | null;
  onRecord: () => void;
  onFinish: (result: SpeakingResult) => void;
}) {
  const progress = Math.round(
    (currentTurnIndex / (scenario.totalTurns * 2)) * 100,
  );
  const visibleTurns = turns.slice(0, currentTurnIndex + 1);
  const lastTurn = visibleTurns[visibleTurns.length - 1];
  const isAiTurn = lastTurn?.role === "ai";
  const isRetryTurn = lastTurn?.role === "user";
  const isDone = currentTurnIndex >= turns.length - 1;

  // Build result from accumulated turn data when done
  function buildResult(): SpeakingResult {
    const userTurns = turns.filter((t) => t.role === "user");
    const allFeedback = userTurns.flatMap((t) => t.wordFeedback ?? []);
    const errors = allFeedback.filter((w) => w.status === "error");
    const cautions = allFeedback.filter((w) => w.status === "caution");
    const wordsSpoken = userTurns.reduce(
      (acc, t) => acc + t.text.split(/\s+/).filter(Boolean).length,
      0,
    );

    return {
      scenarioId: scenario.id,
      turnsCompleted: scenario.totalTurns,
      totalTurns: scenario.totalTurns,
      wordsSpoken,
      errorsFound: errors.length + cautions.length,
      errorBreakdown: { grammar: errors.length, style: cautions.length },
      toneScore: 4, // TODO: replace with real API toneScore field
      topInsights: [], // TODO: replace with real API topInsights field
      corrections: [], // TODO: replace with real API corrections field
    };
  }

  return (
    <div className="fl-container py-8 animate-fade-in">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{scenario.emoji}</span>
          <div>
            <h2 className="font-display font-semibold text-text-primary text-sm">
              {scenario.title}
            </h2>
            <p className="text-xs text-text-subtle">
              Turn {Math.ceil((currentTurnIndex + 1) / 2)} of{" "}
              {scenario.totalTurns}
            </p>
          </div>
        </div>
        <Badge variant="primary" dot>
          Live
        </Badge>
      </div>

      <ProgressBar
        value={progress}
        variant="primary"
        size="sm"
        className="mb-8"
      />

      {error && (
        <div
          className="fixed inset-x-4 top-20 z-50 mx-auto flex max-w-xl items-center gap-3 rounded-lg border border-error/40 bg-surface px-4 py-3 text-sm text-error shadow-card animate-slide-up"
          role="alert"
          aria-live="assertive"
        >
          <span className="text-lg" aria-hidden="true">!</span>
          <p className="flex-1">{error}</p>
          <Button variant="secondary" size="sm" onClick={onRecord}>
            Try again
          </Button>
        </div>
      )}

      {/* Conversation thread */}
      <div className="flex flex-col gap-4 mb-8">
        {visibleTurns.map((turn) => (
          <div
            key={turn.id}
            className={`flex gap-3 animate-slide-up ${
              turn.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`
              w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm
              ${
                turn.role === "ai"
                  ? "bg-primary/20 text-primary"
                  : "bg-accent/20 text-accent"
              }
            `}
            >
              {turn.role === "ai" ? "🤖" : "🙂"}
            </div>

            <div
              className={`
              max-w-[78%] fl-card px-4 py-3
              ${
                turn.role === "ai"
                  ? "border-border/60"
                  : "border-accent/20 bg-accent/5"
              }
            `}
            >
              <TranscriptLine turn={turn} />
              {turn.role === "user" && turn.wordFeedback && (
                <>
                  <FeedbackLegend />
                  {turn.id === turns[currentTurnIndex]?.id && attemptCount > 0 && (
                    <p className="mt-3 border-t border-border/40 pt-2 text-xs text-text-muted">
                      {attemptCount === 1
                        ? "Hint: review the yellow and red words, then try the sentence again."
                        : `Hint: try saying “${buildSuggestedResponse(turn.wordFeedback)}”.`}
                    </p>
                  )}
                  {turn.id === correctedTurnId && correctedResponse && (
                    <p className="mt-3 border-t border-correct/30 pt-2 text-xs text-correct">
                      Correct response: “{correctedResponse}”
                    </p>
                  )}
                </>
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

      {/* Action area */}
      {!isDone ? (
        <div className="fl-card p-5 border-primary/20 bg-primary/5 text-center">
          {isAiTurn || isRetryTurn ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-text-muted">
                {isRetryTurn
                  ? `Some words need another try — attempt ${attemptCount + 1} of 3`
                  : "Your turn — press to respond"}
              </p>

              <div className="relative w-16 h-16">
                {isRecording && <span className="record-ring" />}
                <button
                  onClick={onRecord}
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center text-2xl
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
                {isRecording
                  ? "Recording… tap to stop"
                  : isRetryTurn
                    ? "Review the highlighted feedback, then try again"
                    : "Tap to speak"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-text-muted">
                Waiting for AI response…
              </p>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary/40 animate-pulse-slow"
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
            🎉 Scenario complete — great effort!
          </p>
          <Button onClick={() => onFinish(buildResult())} size="lg">
            See my feedback →
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Results panel ─────────────────────────────────────────────────────────

function ResultsPanel({
  result,
  onRestart,
}: {
  result: SpeakingResult;
  onRestart: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const toneStars = Array.from({ length: 5 }, (_, i) => i < result.toneScore);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/session/save`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ speakingResult: result }),
        },
      );
      if (!response.ok) {
        throw new Error("Could not save your session. Please try again.");
      }
      setSaved(true);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not save your session. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fl-container py-10 animate-slide-up">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-light mb-1">
          Session complete
        </p>
        <h2 className="font-display text-display-md font-bold text-text-primary">
          Your feedback
        </h2>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          {
            label: "Words spoken",
            value: result.wordsSpoken,
            color: "text-primary",
          },
          {
            label: "Errors found",
            value: result.errorsFound,
            color: "text-error",
          },
          {
            label: "Grammar errors",
            value: result.errorBreakdown.grammar,
            color: "text-caution",
          },
          {
            label: "Style suggestions",
            value: result.errorBreakdown.style,
            color: "text-accent",
          },
        ].map((stat) => (
          <div key={stat.label} className="fl-card p-4 text-center">
            <div
              className={`font-display font-bold text-3xl ${stat.color} mb-1`}
            >
              {stat.value}
            </div>
            <div className="text-xs text-text-subtle">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tone score */}
      <div className="fl-card p-5 mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary mb-0.5">
            Tone & politeness
          </p>
          <p className="text-xs text-text-muted">
            How natural and polite you sounded
          </p>
        </div>
        <div className="flex gap-1">
          {toneStars.map((filled, i) => (
            <span
              key={i}
              className={`text-lg ${filled ? "text-accent" : "text-border"}`}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Top insights */}
      {result.topInsights.length > 0 && (
        <div className="fl-card p-5 mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-light mb-3">
            Top insights
          </p>
          <ul className="flex flex-col gap-2">
            {result.topInsights.map((insight, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-text-muted"
              >
                <span className="text-primary mt-0.5 shrink-0">→</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Corrections table */}
      {result.corrections.length > 0 && (
        <div className="fl-card p-5 mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-light mb-4">
            Corrections
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left pb-2 text-xs text-text-subtle font-medium pr-4">
                    You said
                  </th>
                  <th className="text-left pb-2 text-xs text-text-subtle font-medium pr-4">
                    Better option
                  </th>
                  <th className="text-left pb-2 text-xs text-text-subtle font-medium">
                    Why
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.corrections.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="py-3 pr-4">
                      <span className="fl-pill bg-error/10 text-error border border-error/20 text-xs">
                        {row.original}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="fl-pill bg-correct/10 text-correct border border-correct/20 text-xs">
                        {row.better}
                      </span>
                    </td>
                    <td className="py-3 text-text-muted text-xs leading-snug">
                      {row.why}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onRestart} variant="primary" size="lg">
          Try another scenario →
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={handleSave}
          loading={saving}
          disabled={saved}
        >
          {/* API: POST /api/session/save */}
          {saved ? "✓ Saved!" : "Save to my progress"}
        </Button>
      </div>
      {saveError && (
        <p className="mt-3 text-sm text-error">{saveError}</p>
      )}
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────

type View = "picker" | "conversation" | "results";

export default function SpeakingPage() {
  const [view, setView] = useState<View>("picker");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [correctedResponse, setCorrectedResponse] = useState<string | null>(
    null,
  );
  const [correctedTurnId, setCorrectedTurnId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speakingResult, setSpeakingResult] = useState<SpeakingResult | null>(
    null,
  );

  const audioRecorder = useAudioRecorder();

  function handleSelectScenario(s: Scenario) {
    setError(null);
    setScenario(s);
    setTurns(DUMMY_CONVERSATION); // TODO: fetch scenario turns from API if needed
    setTurnIndex(0);
    setAttemptCount(0);
    setCorrectedResponse(null);
    setCorrectedTurnId(null);
    setView("conversation");
  }

  async function handleRecord() {
    if (!isRecording) {
      setError(null);
      try {
        await audioRecorder.start();
        setIsRecording(true);
      } catch {
        setError("Microphone access is required to record your answer.");
      }
    } else {
      setIsRecording(false);
      try {
        const blob = await audioRecorder.stop();
        const responseTurnIndex =
          turns[turnIndex]?.role === "user" ? turnIndex - 1 : turnIndex;
        const form = new FormData();
        form.append("audio", blob, "turn.webm");
        form.append("scenarioId", scenario!.id);
        form.append("turnIndex", String(responseTurnIndex));

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/speech/transcribe`,
          { method: "POST", body: form },
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail ?? "Speaking practice is unavailable.");
        }

        const feedback = Array.isArray(data.word_feedback)
          ? data.word_feedback
          : [];
        const isAllGreen =
          feedback.length > 0 &&
          feedback.every(
            (word: { status: string }) => word.status === "correct",
          );
        const nextAttempt = attemptCount + 1;

        setTurns((prev) =>
          prev.map((t, i) => {
            if (i === responseTurnIndex + 1) {
              return {
                ...t,
                text: data.transcript,
                wordFeedback: data.word_feedback,
              };
            }
            if (i === responseTurnIndex + 2 && data.ai_reply_text) {
              return { ...t, text: data.ai_reply_text };
            }
            return t;
          }),
        );

        if (!isAllGreen && nextAttempt < 3) {
          setAttemptCount(nextAttempt);
          setTurnIndex(responseTurnIndex + 1);
          return;
        }

        if (!isAllGreen) {
          setCorrectedResponse(buildSuggestedResponse(feedback));
          setCorrectedTurnId(turns[responseTurnIndex + 1]?.id ?? null);
        } else {
          setCorrectedResponse(null);
          setCorrectedTurnId(null);
        }
        setAttemptCount(0);
        setTurnIndex(Math.min(responseTurnIndex + 2, turns.length - 1));

        if (data.ai_reply_text) {
          window.speechSynthesis.cancel();
          const utt = new SpeechSynthesisUtterance(data.ai_reply_text);
          utt.lang = "en-GB";
          utt.rate = 0.9;
          window.speechSynthesis.speak(utt);
        }
      } catch (requestError) {
        console.error("Speaking transcription failed:", requestError);
        setError("We couldn't process your recording. Please try again.");
      }
    }
  }

  function handleFinish(result: SpeakingResult) {
    setSpeakingResult(result);
    setView("results");
  }

  function handleRestart() {
    setScenario(null);
    setTurns([]);
    setTurnIndex(0);
    setIsRecording(false);
    setAttemptCount(0);
    setCorrectedResponse(null);
    setCorrectedTurnId(null);
    setError(null);
    setSpeakingResult(null);
    setView("picker");
  }

  if (view === "picker") {
    return <ScenarioPicker onSelect={handleSelectScenario} />;
  }

  if (view === "conversation" && scenario) {
    return (
      <ConversationView
        scenario={scenario}
        turns={turns}
        currentTurnIndex={turnIndex}
        isRecording={isRecording}
        attemptCount={attemptCount}
        correctedResponse={correctedResponse}
        correctedTurnId={correctedTurnId}
        error={error}
        onRecord={handleRecord}
        onFinish={handleFinish}
      />
    );
  }

  if (view === "results" && speakingResult) {
    return <ResultsPanel result={speakingResult} onRestart={handleRestart} />;
  }

  return null;
}
