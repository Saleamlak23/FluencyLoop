// src/pages/WritingPage.tsx

import { useState, useMemo } from "react";
import { WRITING_PROMPTS, DUMMY_WRITING_FEEDBACK } from "../lib/dummy-data";
import type { WritingPrompt, WritingFeedback, InlineError } from "../lib/types";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ProgressBar from "../components/ui/ProgressBar";

// ── Helpers ───────────────────────────────────────────────────────────────

function countSentences(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const matches = trimmed.match(/[^.!?]*[.!?]+/g);
  return matches ? matches.length : 1;
}

function scoreColor(score: number): string {
  if (score >= 4) return "text-correct";
  if (score >= 3) return "text-caution";
  return "text-error";
}

function scoreLabel(score: number): string {
  if (score >= 5) return "Excellent";
  if (score >= 4) return "Good";
  if (score >= 3) return "Developing";
  return "Needs work";
}

type ErrorTypeMeta = {
  label: string;
  variant: "error" | "caution" | "primary" | "accent";
};

const ERROR_TYPE_META: Record<InlineError["type"], ErrorTypeMeta> = {
  grammar:    { label: "Grammar",    variant: "error"   },
  spelling:   { label: "Spelling",   variant: "error"   },
  style:      { label: "Style",      variant: "caution" },
  vocabulary: { label: "Vocabulary", variant: "accent"  },
};

// ── Inline-highlighted rewritten text ────────────────────────────────────

function HighlightedText({
  text,
  errors,
  activeError,
  onHover,
}: {
  text: string;
  errors: InlineError[];
  activeError: number | null;
  onHover: (i: number | null) => void;
}) {
  // Split original text into segments: normal | error
  const segments: { text: string; errorIndex: number | null }[] = [];
  let remaining = text;
  let cursor = 0;

  errors.forEach((err, i) => {
    const idx = remaining.indexOf(err.original);
    if (idx === -1) return;
    if (idx > 0) segments.push({ text: remaining.slice(0, idx), errorIndex: null });
    segments.push({ text: err.original, errorIndex: i });
    remaining = remaining.slice(idx + err.original.length);
  });

  if (remaining) segments.push({ text: remaining, errorIndex: null });

  return (
    <p className="text-base text-text-primary leading-loose font-body">
      {segments.map((seg, i) => {
        if (seg.errorIndex === null) {
          return <span key={i}>{seg.text}</span>;
        }
        const err = errors[seg.errorIndex];
        const isActive = activeError === seg.errorIndex;
        const meta = ERROR_TYPE_META[err.type];

        return (
          <span
            key={i}
            className={`
              relative cursor-pointer rounded px-0.5 transition-all duration-150
              ${err.type === "grammar" || err.type === "spelling"
                ? "border-b-2 border-error/70 hover:bg-error/10"
                : "border-b-2 border-caution/70 hover:bg-caution/10"}
              ${isActive ? (err.type === "grammar" || err.type === "spelling" ? "bg-error/10" : "bg-caution/10") : ""}
            `}
            onMouseEnter={() => onHover(seg.errorIndex)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onHover(isActive ? null : seg.errorIndex)}
          >
            {seg.text}
          </span>
        );
      })}
    </p>
  );
}

// ── Prompt picker ─────────────────────────────────────────────────────────

function PromptPicker({ onSelect }: { onSelect: (p: WritingPrompt) => void }) {
  return (
    <div className="fl-container py-10 animate-slide-up">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-1">
          Writing drill
        </p>
        <h1 className="font-display text-display-md font-bold text-text-primary">
          Choose a prompt
        </h1>
        <p className="text-text-muted text-sm mt-2 max-w-md">
          Write a few sentences, then the AI checks your grammar, vocabulary,
          and style — and shows you a natural rewrite.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {WRITING_PROMPTS.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => onSelect(prompt)}
            className="fl-card p-5 text-left flex items-start gap-5 hover:border-accent/40 hover:shadow-glow-accent transition-all duration-200 group"
          >
            <span className="text-4xl mt-0.5">{prompt.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-display font-semibold text-text-primary group-hover:text-accent transition-colors">
                  {prompt.title}
                </span>
                <Badge variant="neutral">{prompt.level}</Badge>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">
                {prompt.instruction}
              </p>
              <p className="text-xs text-text-subtle mt-2">
                {prompt.minSentences}–{prompt.maxSentences} sentences
              </p>
            </div>
            <svg
              className="w-5 h-5 text-text-subtle group-hover:text-accent transition-colors shrink-0 mt-1"
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

// ── Writing editor ────────────────────────────────────────────────────────

function WritingEditor({
  prompt,
  onSubmit,
  loading,
}: {
  prompt: WritingPrompt;
  onSubmit: (text: string) => void;
  loading: boolean;
}) {
  const [text, setText] = useState("");

  const sentences   = useMemo(() => countSentences(text), [text]);
  const wordCount   = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);
  const isUnder     = sentences < prompt.minSentences;
  const isOver      = sentences > prompt.maxSentences;
  const isReady     = !isUnder && !isOver && text.trim().length > 0;
  const progress    = Math.min(100, Math.round((sentences / prompt.maxSentences) * 100));

  return (
    <div className="fl-container py-10 animate-slide-up">

      {/* Prompt card */}
      <div className="fl-card p-5 mb-6 border-accent/20 bg-accent/5 flex items-start gap-4">
        <span className="text-3xl shrink-0">{prompt.emoji}</span>
        <div>
          <p className="font-display font-semibold text-text-primary mb-1">
            {prompt.title}
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            {prompt.instruction}
          </p>
        </div>
      </div>

      {/* Textarea */}
      <div className="fl-card p-1 mb-4 focus-within:border-accent/50 focus-within:shadow-glow-accent transition-all duration-200">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start writing here…"
          rows={7}
          className="
            w-full bg-transparent px-4 py-3 text-base text-text-primary
            placeholder:text-text-subtle resize-none outline-none
            font-body leading-relaxed
          "
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-border/40">
          <div className="flex items-center gap-3 text-xs text-text-subtle">
            <span>
              <span className={sentences > 0 ? "text-text-muted" : ""}>{sentences}</span>
              /{prompt.minSentences}–{prompt.maxSentences} sentences
            </span>
            <span className="w-px h-3 bg-border" />
            <span>{wordCount} words</span>
          </div>

          {/* Sentence progress */}
          <div className="w-24">
            <ProgressBar
              value={progress}
              variant={isOver ? "correct" : isReady ? "correct" : "accent"}
              size="sm"
              animated={false}
            />
          </div>
        </div>
      </div>

      {/* Validation hint */}
      {text.trim().length > 0 && (
        <p className={`text-xs mb-5 ${
          isOver  ? "text-error"   :
          isReady ? "text-correct" :
                    "text-text-subtle"
        }`}>
          {isOver
            ? `Too long — aim for ${prompt.maxSentences} sentences or fewer.`
            : isReady
            ? "Looks good — ready to submit!"
            : `Write at least ${prompt.minSentences} sentences to continue.`}
        </p>
      )}

      {/* Submit */}
      <Button
        onClick={() => onSubmit(text)}
        disabled={!isReady}
        loading={loading}
        size="lg"
        rightIcon={<span>→</span>}
      >
        {/* API: POST /api/writing/evaluate — body: { promptId, text } */}
        Check my writing
      </Button>
    </div>
  );
}

// ── Feedback panel ────────────────────────────────────────────────────────

function FeedbackPanel({
  feedback,
  prompt,
  onRestart,
}: {
  feedback: WritingFeedback;
  prompt: WritingPrompt;
  onRestart: () => void;
}) {
  const [activeError, setActiveError] = useState<number | null>(null);
  const [tab, setTab] = useState<"original" | "rewritten">("original");

  const active = activeError !== null ? feedback.errors[activeError] : null;

  const errorsByType = feedback.errors.reduce(
    (acc, err) => {
      acc[err.type] = (acc[err.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="fl-container py-10 animate-slide-up">

      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-1">
          Writing feedback
        </p>
        <h2 className="font-display text-display-md font-bold text-text-primary">
          Here's your review
        </h2>
      </div>

      {/* Score + type breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="fl-card p-4 text-center col-span-2 sm:col-span-1">
          <div className={`font-display font-bold text-4xl mb-1 ${scoreColor(feedback.overallScore)}`}>
            {feedback.overallScore}/5
          </div>
          <div className="text-xs text-text-subtle">{scoreLabel(feedback.overallScore)}</div>
        </div>

        {(Object.entries(errorsByType) as [InlineError["type"], number][]).map(([type, count]) => {
            const meta = ERROR_TYPE_META[type];
            return (
                <div key={type} className="fl-card p-4 text-center">
                <div className={`font-display font-bold text-3xl mb-1 text-${
                    meta.variant === "error" ? "error" :
                    meta.variant === "caution" ? "caution" : "accent"
                }`}>
                {count}
              </div>
              <div className="text-xs text-text-subtle">{meta.label}</div>
            </div>
          );
        })}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-surface rounded-lg mb-4 w-fit">
        {(["original", "rewritten"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`
              px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200
              ${tab === t
                ? "bg-card text-text-primary shadow-card"
                : "text-text-muted hover:text-text-primary"}
            `}
          >
            {t === "original" ? "Your writing" : "Natural rewrite"}
          </button>
        ))}
      </div>

      {/* Text panel */}
      <div className="fl-card p-6 mb-4 min-h-[160px]">
        {tab === "original" ? (
          <>
            <p className="text-xs text-text-subtle mb-3 font-medium">
              Hover or tap underlined words to see the correction
            </p>
            <HighlightedText
              text={feedback.originalText}
              errors={feedback.errors}
              activeError={activeError}
              onHover={setActiveError}
            />
          </>
        ) : (
          <>
            <p className="text-xs text-text-subtle mb-3 font-medium">
              How a native speaker might write this
            </p>
            <p className="text-base text-correct leading-loose font-body">
              {feedback.rewrittenText}
            </p>
          </>
        )}
      </div>

      {/* Active error callout */}
      {active && tab === "original" && (
        <div className="fl-card p-4 mb-4 border-l-2 border-error animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant={ERROR_TYPE_META[active.type].variant}>
                  {ERROR_TYPE_META[active.type].label}
                </Badge>
                <span className="text-xs text-text-subtle">
                  <span className="line-through text-error mr-2">{active.original}</span>
                  <span className="text-correct">→ {active.corrected}</span>
                </span>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">
                {active.explanation}
              </p>
            </div>
            <button
              onClick={() => setActiveError(null)}
              className="text-text-subtle hover:text-text-muted transition-colors shrink-0 mt-0.5"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* All corrections list */}
      <div className="fl-card p-5 mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">
          All corrections
        </p>
        <div className="flex flex-col gap-3">
          {feedback.errors.map((err, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveError(i);
                setTab("original");
              }}
              className="flex items-start gap-3 text-left group"
            >
              <Badge variant={ERROR_TYPE_META[err.type].variant} className="mt-0.5 shrink-0">
                {ERROR_TYPE_META[err.type].label}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-xs text-error line-through">{err.original}</span>
                  <span className="text-xs text-text-subtle">→</span>
                  <span className="text-xs text-correct font-medium">{err.corrected}</span>
                </div>
                <p className="text-xs text-text-muted leading-snug">{err.explanation}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Top insights */}
      <div className="fl-card p-5 mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-light mb-3">
          Key takeaways
        </p>
        <ul className="flex flex-col gap-2">
          {feedback.topInsights.map((insight, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
              <span className="text-accent mt-0.5 shrink-0">→</span>
              {insight}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onRestart} size="lg">
          Try another prompt →
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

type View = "picker" | "editor" | "feedback";

export default function WritingPage() {
  const [view, setView]         = useState<View>("picker");
  const [prompt, setPrompt]     = useState<WritingPrompt | null>(null);
  const [loading, setLoading]   = useState(false);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);

  function handleSelectPrompt(p: WritingPrompt) {
    setPrompt(p);
    setView("editor");
  }

  function handleSubmit(text: string) {
    setLoading(true);
    // Real: POST /api/writing/evaluate — body: { promptId: prompt.id, text }
    // Response: WritingFeedback
    setTimeout(() => {
      setFeedback(DUMMY_WRITING_FEEDBACK);
      setLoading(false);
      setView("feedback");
    }, 1800);
  }

  function handleRestart() {
    setPrompt(null);
    setFeedback(null);
    setView("picker");
  }

  if (view === "picker") {
    return <PromptPicker onSelect={handleSelectPrompt} />;
  }

  if (view === "editor" && prompt) {
    return (
      <WritingEditor
        prompt={prompt}
        onSubmit={handleSubmit}
        loading={loading}
      />
    );
  }

  if (view === "feedback" && feedback && prompt) {
    return (
      <FeedbackPanel
        feedback={feedback}
        prompt={prompt}
        onRestart={handleRestart}
      />
    );
  }

  return null;
}