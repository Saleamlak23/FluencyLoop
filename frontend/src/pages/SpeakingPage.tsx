// src/pages/SpeakingPage.tsx

import { useState, useRef } from "react";
import { SCENARIOS } from "../lib/content-data";
import type {
  Scenario,
  ConversationTurn,
  SpeakingResult,
  CorrectionRow,
  Level,
} from "../lib/types";
import { formatLevel } from "../lib/types";
import { recordSession } from "../lib/progressStorage";
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

function buildScenarioInitialTurns(scenario: Scenario): ConversationTurn[] {
  return [
    {
      id: "turn-1-ai",
      role: "ai",
      text:
        scenario.initialPrompt ||
        `Welcome to this ${scenario.title} simulation. To start, could you introduce the situation and share your initial perspective?`,
      hint:
        scenario.initialHint ||
        "Introduce yourself and state your thoughts clearly.",
    },
  ];
}

// ── Scenario picker ───────────────────────────────────────────────────────

function ScenarioPicker({
  customScenarios,
  onAddCustomScenario,
  onSelect,
}: {
  customScenarios: Scenario[];
  onAddCustomScenario: (s: Scenario) => void;
  onSelect: (s: Scenario) => void;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customRole, setCustomRole] = useState("Backend engineer");
  const [customContext, setCustomContext] = useState(
    "You are joining a sprint planning conversation about designing an API, choosing a database, testing an endpoint, and responding to a production incident. Discuss trade-offs clearly with a senior teammate.",
  );
  const [customLevel, setCustomLevel] = useState<Level>("everyday");
  const [customTurns, setCustomTurns] = useState(4);

  function createCustomScenario(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const role = customRole.trim();
    const context = customContext.trim();
    if (!role || !context) return;

    const newScenario: Scenario = {
      id: `custom-${Date.now()}-${role.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      emoji: "🧩",
      title: `${role} Simulation`,
      description: context,
      level: customLevel,
      totalTurns: customTurns,
      aiRole: `a senior colleague working with a ${role}`,
      aiContext: context,
      initialPrompt: `Hello! Thanks for joining today. Let's discuss ${role.toLowerCase()} priorities and ${context.slice(0, 90).toLowerCase()}... To kick things off, could you walk me through your perspective and how we should approach this?`,
      initialHint: `Introduce your role and summarize your primary goals and considerations.`,
    };

    onAddCustomScenario(newScenario);
    setCustomOpen(false);
  }

  const allScenarios = [...customScenarios, ...SCENARIOS];

  return (
    <div className="fl-container py-10 animate-slide-up">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
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
        <Button
          type="button"
          variant={customOpen ? "secondary" : "primary"}
          size="md"
          onClick={() => setCustomOpen((open) => !open)}
          className="self-start sm:self-auto shrink-0 shadow-sm"
        >
          {customOpen ? "✕ Close Form" : "+ Create Custom Scenario"}
        </Button>
      </div>

      {customOpen && (
        <form
          onSubmit={createCustomScenario}
          className="fl-card mb-6 border-primary/30 bg-primary/5 p-6 animate-slide-up shadow-card"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <h2 className="font-display text-base font-bold text-text-primary">
                Create Custom Speaking Scenario
              </h2>
            </div>
            <span className="text-xs text-text-muted">
              Appears first in your scenario list
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <label className="block text-sm font-medium text-text-primary">
              Your role
              <input
                value={customRole}
                onChange={(event) => setCustomRole(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-text-primary outline-none focus:border-primary transition-colors text-sm"
                placeholder="e.g. Backend engineer"
                required
              />
            </label>
            <label className="block text-sm font-medium text-text-primary">
              Level
              <select
                value={customLevel}
                onChange={(e) => setCustomLevel(e.target.value as Level)}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-text-primary outline-none focus:border-primary transition-colors text-sm"
              >
                <option value="everyday">
                  Everyday (Intermediate – Workplace & team collaboration)
                </option>
                <option value="foundation">
                  Foundation (Beginner – Direct, structured fundamentals)
                </option>
                <option value="free">
                  Advanced (Advanced – Complex discussions, trade-offs & nuances)
                </option>
              </select>
            </label>
          </div>

          <label className="mb-3 block text-sm font-medium text-text-primary">
            Situation & conversation context
            <textarea
              value={customContext}
              onChange={(event) => setCustomContext(event.target.value)}
              className="mt-1.5 w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-text-primary outline-none focus:border-primary transition-colors text-sm"
              rows={3}
              placeholder="Describe the conversation topic, role of the other person, and what you will discuss..."
              required
            />
          </label>
            <label className="block text-sm font-medium text-text-primary">
              Number of turns
              <input
                type="number"
                min={3}
                max={6}
                value={customTurns}
                onChange={(event) => setCustomTurns(Number(event.target.value))}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-text-primary outline-none focus:border-primary transition-colors text-sm"
                required
              />
            </label>

          <div className="mb-5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-text-muted">
            ⚡ Choose between 3 and 6 turns for this conversation.
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setCustomOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="md">
              Create and Add to List →
            </Button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-4">
        {allScenarios.map((scenario) => {
          const isCustom = scenario.id.startsWith("custom-");
          return (
            <button
              key={scenario.id}
              onClick={() => onSelect(scenario)}
              className={`fl-card p-5 text-left flex items-start gap-5 hover:border-primary/40 hover:shadow-glow transition-all duration-200 group ${
                isCustom ? "border-primary/40 bg-primary/[0.03]" : ""
              }`}
            >
              <span className="text-4xl mt-0.5">{scenario.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-display font-semibold text-text-primary group-hover:text-primary transition-colors">
                    {scenario.title}
                  </span>
                  {isCustom && <Badge variant="primary">Custom</Badge>}
                  <Badge variant="neutral">{formatLevel(scenario.level)}</Badge>
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
          );
        })}
      </div>
    </div>
  );
}

// ── Active conversation ───────────────────────────────────────────────────

interface StageFeedback {
  stage: 1 | 2 | 3;
  title: string;
  message: string;
  details?: CorrectionRow[];
  modelAnswer?: string;
}

function ConversationView({
  scenario,
  turns,
  isRecording,
  isProcessing,
  attemptCount,
  stageFeedback,
  error,
  onRecord,
  onFinish,
  onBack,
  sessionCorrections,
}: {
  scenario: Scenario;
  turns: ConversationTurn[];
  isRecording: boolean;
  isProcessing: boolean;
  attemptCount: number;
  stageFeedback: StageFeedback | null;
  error: string | null;
  onRecord: () => void;
  onFinish: (result: SpeakingResult) => void;
  onBack: () => void;
  sessionCorrections: CorrectionRow[];
}) {
  const userTurns = turns.filter((t) => t.role === "user");
  const lastTurn = turns[turns.length - 1];
  const isAiTurn = lastTurn?.role === "ai";
  const isRetryTurn = lastTurn?.role === "user" && attemptCount > 0;
  // Scenario completes when required user turns are reached AND the final AI response has been delivered
  const isDone = userTurns.length >= scenario.totalTurns && isAiTurn;

  const currentTurnNumber = Math.min(
    userTurns.length + (isAiTurn && !isDone ? 1 : 0),
    scenario.totalTurns,
  );
  const currentTurnIndex = Math.min(turns.length - 1, scenario.totalTurns * 2);
  const progress = Math.min(
    100,
    Math.round((currentTurnIndex / (scenario.totalTurns * 2)) * 100),
  );
  const lastAiTurn = [...turns]
    .reverse()
    .find((turn) => turn.role === "ai" && Boolean(turn.text?.trim()));

  // Build result from accumulated turn data when done
  function buildResult(): SpeakingResult {
    const wordsSpoken = userTurns.reduce(
      (acc, t) => acc + t.text.trim().split(/\s+/).filter(Boolean).length,
      0,
    );

    const grammarSet = new Set<string>();
    const styleSet = new Set<string>();
    for (const turn of userTurns) {
      if (!turn.wordFeedback) continue;

      for (const wf of turn.wordFeedback) {
        const key = `${turn.id}:${wf.word}:${wf.status}`;
        if (wf.status === "error") grammarSet.add(key);
        else if (wf.status === "caution") styleSet.add(key);
      }
    }

    const grammarCount = grammarSet.size;
    const styleCount = styleSet.size;
    const errorsFound = grammarCount + styleCount;
    const toneScore =
      errorsFound === 0 ? 5 : errorsFound <= 2 ? 4 : errorsFound <= 5 ? 3 : 2;

    const topInsights: string[] = [];
    if (errorsFound === 0) {
      topInsights.push(
        "Outstanding accuracy! Your spoken answers were grammatically sound and natural.",
      );
      topInsights.push(
        "You maintained strong professional vocabulary throughout the simulation.",
      );
    } else {
      if (grammarCount > 0) {
        topInsights.push(
          `Grammar focus: ${grammarCount} grammatical error${grammarCount > 1 ? "s" : ""} identified across your turns.`,
        );
      }
      if (styleCount > 0) {
        topInsights.push(
          `Phrasing style: ${styleCount} style suggestion${styleCount > 1 ? "s" : ""} to sound more natural.`,
        );
      }
      topInsights.push(
        `Completed all ${userTurns.length} simulation turns with ${wordsSpoken} total words spoken.`,
      );
    }

    const correctionsList: CorrectionRow[] =
      sessionCorrections.length > 0
        ? sessionCorrections
        : userTurns.flatMap((t) =>
            (t.wordFeedback ?? [])
              .filter((wf) => wf.status !== "correct" && wf.suggestion)
              .map((wf) => ({
                original: wf.word,
                better: wf.suggestion!,
                why: wf.reason || "Improvement suggested for natural phrasing.",
              })),
          );

    return {
      scenarioId: scenario.id,
      turnsCompleted: userTurns.length,
      totalTurns: scenario.totalTurns,
      wordsSpoken,
      errorsFound,
      errorBreakdown: { grammar: grammarCount, style: styleCount },
      toneScore,
      topInsights,
      corrections: correctionsList,
    };
  }

  return (
    <div className="fl-container py-8 animate-fade-in">
      {/* Top back & status bar */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface/80 px-3 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:border-primary/50 hover:text-text-primary shadow-xs"
        >
          <span className="text-sm">←</span>
          <span>Exit scenario</span>
        </button>
        <Badge variant="primary" dot>
          Live Simulation
        </Badge>
      </div>

      {/* Header row */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{scenario.emoji}</span>
          <div>
            <h2 className="font-display font-semibold text-text-primary text-base">
              {scenario.title}
            </h2>
            <p className="text-xs text-text-subtle">
              Turn {currentTurnNumber} of {scenario.totalTurns}
            </p>
          </div>
        </div>
        <Badge variant="neutral">{formatLevel(scenario.level)}</Badge>
      </div>

      <ProgressBar
        value={progress}
        variant="primary"
        size="sm"
        className="mb-8"
      />

      {lastAiTurn && !isDone && (
        <div className="fl-card mb-6 border border-primary/20 bg-primary/5 p-4 animate-slide-up">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-light">
            AI response
          </p>
          <p className="text-sm leading-relaxed text-text-primary">
            {lastAiTurn.text}
          </p>
        </div>
      )}

      {error && (
        <div
          className="fixed inset-x-4 top-20 z-50 mx-auto flex max-w-xl items-center gap-3 rounded-lg border border-error/40 bg-surface px-4 py-3 text-sm text-error shadow-card animate-slide-up"
          role="alert"
          aria-live="assertive"
        >
          <span className="text-lg" aria-hidden="true">
            !
          </span>
          <p className="flex-1">{error}</p>
          <Button variant="secondary" size="sm" onClick={onRecord}>
            Try again
          </Button>
        </div>
      )}

      {/* Staged Feedback Alert Banner */}
      {stageFeedback && !isDone && (
        <div
          className={`fl-card mb-6 p-4 animate-slide-up border ${
            stageFeedback.stage === 1
              ? "border-caution/50 bg-caution/10"
              : stageFeedback.stage === 2
                ? "border-accent/50 bg-accent/10"
                : "border-primary/50 bg-primary/10"
          }`}
        >
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
              {stageFeedback.title}
            </span>
            <Badge
              variant={stageFeedback.stage === 1 ? "caution" : "primary"}
            >
              {stageFeedback.stage === 3
                ? "Model Answer"
                : `Feedback ${stageFeedback.stage}`}
            </Badge>
          </div>
          <p className="text-sm text-text-primary leading-relaxed">
            {stageFeedback.message}
          </p>

          {stageFeedback.details && stageFeedback.details.length > 0 && (
            <div className="mt-3 flex flex-col gap-2 border-t border-border/30 pt-3">
              {stageFeedback.details.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-surface/80 p-2.5 text-xs shadow-xs"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-error">You said:</span>
                    <span className="line-through text-text-muted">
                      {item.original}
                    </span>
                    <span className="font-semibold text-correct">
                      → Better:
                    </span>
                    <span className="font-bold text-correct">
                      {item.better}
                    </span>
                  </div>
                  <p className="text-text-muted">{item.why}</p>
                </div>
              ))}
            </div>
          )}

          {stageFeedback.modelAnswer && (
            <div className="mt-2.5 rounded-lg border border-correct/40 bg-surface/80 p-2.5 text-xs text-correct">
              <span className="font-semibold">Model answer: </span>“
              {stageFeedback.modelAnswer}”
            </div>
          )}
        </div>
      )}

      {/* Conversation thread — all turns including AI responses are rendered */}
      <div className="mb-8 flex flex-col gap-4">
        {turns.map((turn) => (
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
              {turn.role === "user" && turn.corrected && (
                <Badge variant="primary">Corrected model answer</Badge>
              )}
              {turn.role === "user" && turn.wordFeedback && <FeedbackLegend />}
              {turn.role === "ai" && turn.hint && !isDone && (
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
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="text-sm font-medium text-text-primary">
                Analyzing your response & grammar…
              </p>
              <div className="flex gap-1.5 mt-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse-slow"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          ) : isAiTurn || isRetryTurn ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-text-muted">
                {isRetryTurn
                  ? `Feedback provided — try speaking again (attempt ${attemptCount + 1} of 3)`
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
                    ? "Review the feedback above, then tap to retry"
                    : "Tap to speak your response"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="text-sm text-text-muted">
                Waiting for AI response…
              </p>
              <div className="flex gap-1.5">
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
        <div className="fl-card p-6 border-primary/30 bg-primary/5 text-center animate-slide-up shadow-card">
          <p className="text-lg font-bold text-text-primary mb-1">
            🎉 Scenario complete — great effort!
          </p>
          <p className="text-xs text-text-muted mb-5">
            You completed all {scenario.totalTurns} turns. Ready to see your performance breakdown?
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
  const [customScenarios, setCustomScenarios] = useState<Scenario[]>([]);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [stageFeedback, setStageFeedback] = useState<StageFeedback | null>(null);
  const [sessionCorrections, setSessionCorrections] = useState<CorrectionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [speakingResult, setSpeakingResult] = useState<SpeakingResult | null>(null);

  const audioRecorder = useAudioRecorder();

  function handleSelectScenario(s: Scenario) {
    window.speechSynthesis.cancel();
    setError(null);
    setScenario(s);
    setTurns(buildScenarioInitialTurns(s));
    setAttemptCount(0);
    setStageFeedback(null);
    setSessionCorrections([]);
    setView("conversation");
  }

  function handleBack() {
    window.speechSynthesis.cancel();
    setView("picker");
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
      setIsProcessing(true);
      try {
        const blob = await audioRecorder.stop();
        const userTurnsCount = turns.filter((t) => t.role === "user").length;
        const currentTurnNumber = userTurnsCount + (attemptCount > 0 ? 0 : 1);
        const form = new FormData();
        form.append("audio", blob, "turn.webm");
        form.append("scenarioId", scenario!.id);
        form.append("turnIndex", String(currentTurnNumber - 1));
        if (scenario!.aiRole) form.append("scenarioRole", scenario!.aiRole);
        if (scenario!.aiContext) {
          form.append("scenarioContext", scenario!.aiContext);
        }

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

        // Collect corrections from response
        const extractedCorrections: CorrectionRow[] = [];
        if (Array.isArray(data.corrections)) {
          for (const c of data.corrections) {
            if (c.original && c.better) {
              extractedCorrections.push({
                original: c.original,
                better: c.better,
                why: c.why || "Suggested for natural phrasing.",
              });
            }
          }
        }
        if (extractedCorrections.length === 0) {
          for (const wf of feedback) {
            if (wf.status !== "correct" && wf.suggestion) {
              extractedCorrections.push({
                original: wf.word,
                better: wf.suggestion,
                why: wf.reason || "Improvement suggested.",
              });
            }
          }
        }

        const suggestedModel =
          buildSuggestedResponse(feedback) || data.transcript || "I understand. Let's continue.";
        const userTurnId = `turn-${currentTurnNumber}-user`;
        const generalFeedback =
          typeof data.general_feedback === "string" && data.general_feedback.trim()
            ? data.general_feedback.trim()
            : "There is a grammar or naturalness issue in your response. Review the highlighted words and try again.";
        const specificFeedback =
          Array.isArray(data.specific_feedback) && data.specific_feedback.length > 0
            ? data.specific_feedback
            : extractedCorrections;
        const modelAnswer =
          typeof data.model_answer === "string" && data.model_answer.trim()
            ? data.model_answer.trim()
            : suggestedModel;

        if (isAllGreen) {
          // Passed! "All green" condition met
          const userTurn: ConversationTurn = {
            id: userTurnId,
            role: "user",
            text: data.transcript,
            wordFeedback: feedback,
          };

          let nextTurns: ConversationTurn[];
          if (attemptCount > 0) {
            nextTurns = turns.map((t) => (t.id === userTurnId ? userTurn : t));
          } else {
            nextTurns = [...turns, userTurn];
          }

          if (extractedCorrections.length > 0) {
            setSessionCorrections((prev) => [...prev, ...extractedCorrections]);
          }

          const aiReplyText =
            (data.ai_reply_text || "Understood. Thank you for your response.").trim();
          const isFinal = currentTurnNumber >= scenario!.totalTurns;
          const nextAiTurn: ConversationTurn = {
            id: `turn-${currentTurnNumber + 1}-ai`,
            role: "ai",
            text: aiReplyText,
            hint: isFinal
              ? "Simulation complete. Review your feedback below."
              : "Respond naturally to continue the conversation.",
          };
          nextTurns.push(nextAiTurn);

          setTurns(nextTurns);
          setAttemptCount(0);
          setStageFeedback(null);

          // Audio speech synthesis
          window.speechSynthesis.cancel();
          const utt = new SpeechSynthesisUtterance(aiReplyText);
          utt.lang = "en-GB";
          utt.rate = 0.9;
          window.speechSynthesis.speak(utt);
        } else {
          // Not all green
          const nextAttempt = attemptCount + 1;

          if (extractedCorrections.length > 0) {
            setSessionCorrections((prev) => {
              const merged = [...prev];
              for (const c of extractedCorrections) {
                if (
                  !merged.some(
                    (m) =>
                      m.original.toLowerCase() === c.original.toLowerCase() &&
                      m.better.toLowerCase() === c.better.toLowerCase(),
                  )
                ) {
                  merged.push(c);
                }
              }
              return merged;
            });
          }

          if (nextAttempt === 1) {
            // Feedback 1: General feedback
            const userTurn: ConversationTurn = {
              id: userTurnId,
              role: "user",
              text: data.transcript,
              wordFeedback: feedback,
            };
            setTurns((prev) =>
              attemptCount > 0
                ? prev.map((t) => (t.id === userTurnId ? userTurn : t))
                : [...prev, userTurn],
            );
            setAttemptCount(1);
            setStageFeedback({
              stage: 1,
              title: "Attempt 1 of 3 · General Feedback",
              message: generalFeedback,
            });
          } else if (nextAttempt === 2) {
            // Feedback 2: Specific feedback
            const userTurn: ConversationTurn = {
              id: userTurnId,
              role: "user",
              text: data.transcript,
              wordFeedback: feedback,
            };
            setTurns((prev) =>
              prev.map((t) => (t.id === userTurnId ? userTurn : t)),
            );
            setAttemptCount(2);
            setStageFeedback({
              stage: 2,
              title: "Attempt 2 of 3 · Specific Feedback",
              message:
                typeof data.specific_feedback === "string" && data.specific_feedback.trim()
                  ? data.specific_feedback.trim()
                  : "Here is an explanation of the issue and how to improve it:",
              details:
                specificFeedback.length > 0
                  ? specificFeedback
                  : [
                      {
                        original: "Highlighted words",
                        better: suggestedModel,
                        why: "Grammar or vocabulary correction needed.",
                      },
                    ],
            });
          } else {
            // Next attempt >= 3: 3 failed attempts reached!
            // Move to correct answer so user does not get stuck
            const correctedTurn: ConversationTurn = {
              id: userTurnId,
              role: "user",
              text: suggestedModel,
              corrected: true,
              wordFeedback: suggestedModel
                .split(/\s+/)
                .map((w: string) => ({ word: w, status: "correct" as const })),
            };

            let nextTurns = turns.map((t) =>
              t.id === userTurnId ? correctedTurn : t,
            );
            if (!nextTurns.some((t) => t.id === userTurnId)) {
              nextTurns = [...turns, correctedTurn];
            }

            const aiReplyText =
              (data.ai_reply_text || modelAnswer || "Understood. Let's move forward.").trim();
            const isFinal = currentTurnNumber >= scenario!.totalTurns;
            const nextAiTurn: ConversationTurn = {
              id: `turn-${currentTurnNumber + 1}-ai`,
              role: "ai",
              text: aiReplyText,
              hint: isFinal
                ? "Simulation complete. Review your feedback below."
                : "Respond naturally to continue the conversation.",
            };
            nextTurns.push(nextAiTurn);

            setTurns(nextTurns);
            setAttemptCount(0);
            setStageFeedback({
              stage: 3,
              title: "Model Answer Applied",
              message:
                typeof data.model_answer === "string" && data.model_answer.trim()
                  ? `Attempt limit reached: ${data.model_answer.trim()}`
                  : "Attempt limit reached: we've replaced your answer with the model response so you can continue the conversation without getting stuck.",
              modelAnswer: modelAnswer,
            });

            window.speechSynthesis.cancel();
            const utt = new SpeechSynthesisUtterance(aiReplyText);
            utt.lang = "en-GB";
            utt.rate = 0.9;
            window.speechSynthesis.speak(utt);
          }
        }
      } catch (requestError) {
        console.error("Speaking transcription failed:", requestError);
        setError("We couldn't process your recording. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    }
  }

  function handleFinish(result: SpeakingResult) {
    recordSession();
    setSpeakingResult(result);
    setView("results");
  }

  function handleRestart() {
    window.speechSynthesis.cancel();
    setScenario(null);
    setTurns([]);
    setIsRecording(false);
    setIsProcessing(false);
    setAttemptCount(0);
    setStageFeedback(null);
    setSessionCorrections([]);
    setError(null);
    setSpeakingResult(null);
    setView("picker");
  }

  if (view === "picker") {
    return (
      <ScenarioPicker
        customScenarios={customScenarios}
        onAddCustomScenario={(newScenario) => {
          setCustomScenarios((prev) => [newScenario, ...prev]);
        }}
        onSelect={handleSelectScenario}
      />
    );
  }

  if (view === "conversation" && scenario) {
    return (
      <ConversationView
        scenario={scenario}
        turns={turns}
        isRecording={isRecording}
        isProcessing={isProcessing}
        attemptCount={attemptCount}
        stageFeedback={stageFeedback}
        error={error}
        onRecord={handleRecord}
        onFinish={handleFinish}
        onBack={handleBack}
        sessionCorrections={sessionCorrections}
      />
    );
  }

  if (view === "results" && speakingResult) {
    return <ResultsPanel result={speakingResult} onRestart={handleRestart} />;
  }

  return null;
}
