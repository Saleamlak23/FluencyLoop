// src/pages/SpeakingPage.tsx

import { useState } from "react";
import { SCENARIOS, DUMMY_CONVERSATION, DUMMY_SPEAKING_RESULT } from "../lib/dummy-data";
import type { Scenario, ConversationTurn, SpeakingResult } from "../lib/types";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ProgressBar from "../components/ui/ProgressBar";

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
                ${wf.status === "error"   ? "word-error"   : ""}
              `}
              onMouseEnter={() => hasTip && setHoveredWord(i)}
              onMouseLeave={() => setHoveredWord(null)}
            >
              {wf.word}
            </span>

            {/* Tooltip */}
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

// ── Scenario picker ───────────────────────────────────────────────────────

function ScenarioPicker({
  onSelect,
}: {
  onSelect: (s: Scenario) => void;
}) {
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
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
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
  onRecord,
  onFinish,
}: {
  scenario: Scenario;
  turns: ConversationTurn[];
  currentTurnIndex: number;
  isRecording: boolean;
  onRecord: () => void;
  onFinish: () => void;
}) {
  const progress = Math.round((currentTurnIndex / (scenario.totalTurns * 2)) * 100);
  const visibleTurns = turns.slice(0, currentTurnIndex + 1);
  const lastTurn = visibleTurns[visibleTurns.length - 1];
  const isAiTurn = lastTurn?.role === "ai";
  const isDone = currentTurnIndex >= turns.length - 1;

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
              Turn {Math.ceil((currentTurnIndex + 1) / 2)} of {scenario.totalTurns}
            </p>
          </div>
        </div>
        <Badge variant="primary" dot>Live</Badge>
      </div>

      {/* Progress */}
      <ProgressBar
        value={progress}
        variant="primary"
        size="sm"
        className="mb-8"
      />

      {/* Conversation thread */}
      <div className="flex flex-col gap-4 mb-8">
        {visibleTurns.map((turn) => (
          <div
            key={turn.id}
            className={`flex gap-3 animate-slide-up ${
              turn.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            {/* Avatar */}
            <div className={`
              w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm
              ${turn.role === "ai"
                ? "bg-primary/20 text-primary"
                : "bg-accent/20 text-accent"}
            `}>
              {turn.role === "ai" ? "🤖" : "🙂"}
            </div>

            {/* Bubble */}
            <div className={`
              max-w-[78%] fl-card px-4 py-3
              ${turn.role === "ai"
                ? "border-border/60"
                : "border-accent/20 bg-accent/5"}
            `}>
              <TranscriptLine turn={turn} />

              {/* Hint (shown below AI turns) */}
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
          {isAiTurn ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-text-muted">Your turn — press to respond</p>

              {/* Record button */}
              <div className="relative w-16 h-16">
                {isRecording && <span className="record-ring" />}
                <button
                  onClick={onRecord}
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center text-2xl
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

              {/* Dummy shortcut for testing without mic */}
              <button
                onClick={onRecord}
                className="text-xs text-primary-light underline underline-offset-2 opacity-60 hover:opacity-100"
              >
                {/* API: POST /api/speaking/transcribe */}
                Skip (use dummy response)
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-text-muted">Waiting for AI response…</p>
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
          <Button onClick={onFinish} size="lg">
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
  const toneStars = Array.from({ length: 5 }, (_, i) => i < result.toneScore);

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
            suffix: "",
            color: "text-primary",
          },
          {
            label: "Errors found",
            value: result.errorsFound,
            suffix: "",
            color: "text-error",
          },
          {
            label: "Grammar errors",
            value: result.errorBreakdown.grammar,
            suffix: "",
            color: "text-caution",
          },
          {
            label: "Style suggestions",
            value: result.errorBreakdown.style,
            suffix: "",
            color: "text-accent",
          },
        ].map((stat) => (
          <div key={stat.label} className="fl-card p-4 text-center">
            <div className={`font-display font-bold text-3xl ${stat.color} mb-1`}>
              {stat.value}{stat.suffix}
            </div>
            <div className="text-xs text-text-subtle">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tone score */}
      <div className="fl-card p-5 mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary mb-0.5">Tone & politeness</p>
          <p className="text-xs text-text-muted">How natural and polite you sounded</p>
        </div>
        <div className="flex gap-1">
          {toneStars.map((filled, i) => (
            <span key={i} className={`text-lg ${filled ? "text-accent" : "text-border"}`}>
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Top insights */}
      <div className="fl-card p-5 mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-light mb-3">
          Top insights
        </p>
        <ul className="flex flex-col gap-2">
          {result.topInsights.map((insight, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
              <span className="text-primary mt-0.5 shrink-0">→</span>
              {insight}
            </li>
          ))}
        </ul>
      </div>

      {/* Corrections table */}
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
                <tr key={i} className="border-b border-border/40 last:border-0">
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

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onRestart} variant="primary" size="lg">
          Try another scenario →
        </Button>
        <Button variant="secondary" size="lg">
          {/* API: POST /api/session/save */}
          Save to my progress
        </Button>
      </div>
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────

type View = "picker" | "conversation" | "results";

export default function SpeakingPage() {
  const [view, setView]                   = useState<View>("picker");
  const [scenario, setScenario]           = useState<Scenario | null>(null);
  const [turnIndex, setTurnIndex]         = useState(0);
  const [isRecording, setIsRecording]     = useState(false);

  function handleSelectScenario(s: Scenario) {
    setScenario(s);
    setTurnIndex(0);
    setView("conversation");
  }

  function handleRecord() {
    if (!isRecording) {
      // Real: start MediaRecorder, stream audio
      // API: POST /api/speaking/transcribe — body: FormData { audio, scenarioId, turnIndex }
      setIsRecording(true);
      // Dummy: auto-stop after 1.5s and advance turn
      setTimeout(() => {
        setIsRecording(false);
        setTurnIndex((prev) => Math.min(prev + 1, DUMMY_CONVERSATION.length - 1));
      }, 1500);
    } else {
      setIsRecording(false);
      setTurnIndex((prev) => Math.min(prev + 1, DUMMY_CONVERSATION.length - 1));
    }
  }

  function handleFinish() {
    setView("results");
  }

  function handleRestart() {
    setScenario(null);
    setTurnIndex(0);
    setIsRecording(false);
    setView("picker");
  }

  if (view === "picker") {
    return <ScenarioPicker onSelect={handleSelectScenario} />;
  }

  if (view === "conversation" && scenario) {
    return (
      <ConversationView
        scenario={scenario}
        turns={DUMMY_CONVERSATION}
        currentTurnIndex={turnIndex}
        isRecording={isRecording}
        onRecord={handleRecord}
        onFinish={handleFinish}
      />
    );
  }

  if (view === "results") {
    return (
      <ResultsPanel
        result={DUMMY_SPEAKING_RESULT}
        onRestart={handleRestart}
      />
    );
  }

  return null;
}