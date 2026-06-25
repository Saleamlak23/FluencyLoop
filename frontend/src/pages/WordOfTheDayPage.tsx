// src/pages/WordOfTheDayPage.tsx

import { useState, useCallback } from "react";
import { getTodaysWord } from "../lib/dummy-data";
import type { WordDefinition } from "../lib/types";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { WORDS_OF_THE_DAY } from "../lib/dummy-data";

// ── Helpers ───────────────────────────────────────────────────────────────

type POSVariant = "primary" | "accent" | "correct" | "caution" | "neutral";

const PART_OF_SPEECH_VARIANT: Record<WordDefinition["partOfSpeech"], POSVariant> = {
  adjective: "primary",
  verb:      "accent",
  noun:      "correct",
  adverb:    "caution",
  phrase:    "neutral",
};

function useSpeech() {
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance        = new SpeechSynthesisUtterance(text);
    utterance.lang         = "en-GB";
    utterance.rate         = 0.85;
    utterance.pitch        = 1;
    utterance.onstart      = () => setSpeaking(true);
    utterance.onend        = () => setSpeaking(false);
    utterance.onerror      = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  return { speak, speaking };
}

// ── Pronunciation button ──────────────────────────────────────────────────

function PronounceButton({
  word,
  speaking,
  onSpeak,
}: {
  word: string;
  speaking: boolean;
  onSpeak: () => void;
}) {
  return (
    <button
      onClick={onSpeak}
      className={`
        group flex items-center gap-2.5 px-4 py-2 rounded-pill border
        transition-all duration-200 text-sm font-medium
        ${speaking
          ? "bg-primary/20 border-primary/40 text-primary shadow-glow"
          : "bg-white/5 border-border text-text-muted hover:border-primary/40 hover:text-primary hover:bg-primary/10"
        }
      `}
      aria-label={`Hear pronunciation of ${word}`}
    >
      {/* Speaker icon */}
      <span className={`relative flex items-center justify-center w-5 h-5`}>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${speaking ? "scale-110" : "group-hover:scale-110"}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M9 9H6a1 1 0 00-1 1v4a1 1 0 001 1h3l4 4V5L9 9z"
          />
        </svg>
        {speaking && (
          <span className="absolute inset-0 rounded-full border border-primary/50 animate-ping" />
        )}
      </span>
      <span>{speaking ? "Playing…" : "Hear it"}</span>
    </button>
  );
}

// ── Definition card ───────────────────────────────────────────────────────

function DefinitionCard({ definition }: { definition: WordDefinition }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="fl-card p-5">
      {/* Part of speech + toggle */}
      <div className="flex items-center justify-between mb-3">
        <Badge variant={PART_OF_SPEECH_VARIANT[definition.partOfSpeech]}>
          {definition.partOfSpeech}
        </Badge>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-text-subtle hover:text-text-muted transition-colors text-xs"
        >
          {expanded ? "Hide examples" : "Show examples"}
        </button>
      </div>

      {/* Meaning */}
      <p className="text-text-primary text-base leading-relaxed mb-4">
        {definition.meaning}
      </p>

      {/* Examples */}
      {expanded && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-subtle">
            In context
          </p>
          {definition.examples.map((ex, i) => (
            <div
              key={i}
              className="border-l-2 border-primary/30 pl-4 py-0.5"
            >
              <p className="text-xs font-medium text-primary-light mb-1">
                {ex.context}
              </p>
              <p className="text-sm text-text-muted leading-relaxed italic">
                "{ex.sentence}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Hint system ───────────────────────────────────────────────────────────

function HintSection({ hints }: { hints: string[] }) {
  const [revealed, setRevealed] = useState(0);
  const [open, setOpen]         = useState(false);

  function revealNext() {
    setRevealed((v) => Math.min(v + 1, hints.length));
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <span className={`
          w-5 h-5 rounded-full border border-border flex items-center justify-center
          text-xs transition-all duration-200
          ${open ? "bg-accent/10 border-accent/40 text-accent" : ""}
        `}>
          💡
        </span>
        <span>{open ? "Hide hints" : "I'm stuck — show me a hint"}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-2 animate-fade-in">
          {/* Revealed hints */}
          {hints.slice(0, revealed).map((hint, i) => (
            <div
              key={i}
              className="fl-card px-4 py-3 border-accent/20 bg-accent/5 animate-slide-up"
            >
              <div className="flex items-start gap-2.5">
                <span className="
                  w-5 h-5 rounded-full bg-accent/20 text-accent text-xs
                  flex items-center justify-center shrink-0 mt-0.5 font-semibold
                ">
                  {i + 1}
                </span>
                <p className="text-sm text-text-muted leading-relaxed">{hint}</p>
              </div>
            </div>
          ))}

          {/* Reveal next / all revealed */}
          {revealed < hints.length ? (
            <button
              onClick={revealNext}
              className="
                text-xs text-accent underline underline-offset-2
                hover:text-accent-light transition-colors text-left pl-1
              "
            >
              {revealed === 0
                ? "Show first hint →"
                : "Still stuck? Show next hint →"}
            </button>
          ) : (
            <p className="text-xs text-text-subtle pl-1 italic">
              All hints revealed — you've got this!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Challenge section ─────────────────────────────────────────────────────

type ChallengeState = "idle" | "writing" | "submitted";

function ChallengeSection({
  instruction,
  hints,
  exampleAnswer,
  word,
}: {
  instruction: string;
  hints: string[];
  exampleAnswer: string;
  word: string;
}) {
  const [state, setState]           = useState<ChallengeState>("idle");
  const [userAnswer, setUserAnswer] = useState("");
  const [showExample, setShowExample] = useState(false);

  const wordCount   = userAnswer.trim().split(/\s+/).filter(Boolean).length;
  const containsWord = userAnswer.toLowerCase().includes(word.toLowerCase());
  const isReady     = wordCount >= 4 && containsWord;

  function handleSubmit() {
    if (!isReady) return;
    setState("submitted");
  }

  function handleReset() {
    setState("idle");
    setUserAnswer("");
    setShowExample(false);
  }

  return (
    <div className="fl-card p-6 border-primary/15 bg-glow-primary">

      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-lg shrink-0">
          🏆
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-light mb-1">
            Daily challenge
          </p>
          <p className="text-sm text-text-primary leading-relaxed font-medium">
            {instruction}
          </p>
        </div>
      </div>

      {state === "idle" && (
        <Button
          onClick={() => setState("writing")}
          variant="primary"
          size="md"
          rightIcon={<span>→</span>}
        >
          Start the challenge
        </Button>
      )}

      {state === "writing" && (
        <div className="animate-slide-up">
          {/* Textarea */}
          <div className="fl-card p-1 mb-2 focus-within:border-primary/50 focus-within:shadow-glow transition-all duration-200">
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder={`Write a sentence using "${word}" here…`}
              rows={3}
              autoFocus
              className="
                w-full bg-transparent px-4 py-3 text-base text-text-primary
                placeholder:text-text-subtle resize-none outline-none
                font-body leading-relaxed
              "
            />

            {/* Toolbar */}
            <div className="px-4 pb-3 pt-1 border-t border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-text-subtle">
                <span>{wordCount} words</span>
                {userAnswer.length > 0 && (
                  <>
                    <span className="w-px h-3 bg-border" />
                    {containsWord ? (
                      <span className="text-correct animate-fade-in">
                        ✓ Contains "{word}"
                      </span>
                    ) : (
                      <span className="text-caution">
                        Include the word "{word}"
                      </span>
                    )}
                  </>
                )}
              </div>
              {isReady && (
                <span className="text-xs text-correct animate-fade-in">
                  Ready ✓
                </span>
              )}
            </div>
          </div>

          {/* Validation message */}
          {userAnswer.length > 0 && !isReady && (
            <p className="text-xs text-text-subtle mb-3">
              {!containsWord
                ? `Make sure to use the word "${word}" in your sentence.`
                : "Write at least 4 words to submit."}
            </p>
          )}

          {/* Submit */}
          <div className="flex items-center gap-3 mt-3">
            <Button
              onClick={handleSubmit}
              disabled={!isReady}
              size="md"
              rightIcon={<span>→</span>}
            >
              Submit
            </Button>
            <button
              onClick={handleReset}
              className="text-xs text-text-subtle hover:text-text-muted underline underline-offset-2 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Hint system */}
          <HintSection hints={hints} />
        </div>
      )}

      {state === "submitted" && (
        <div className="animate-slide-up">
          {/* User's answer */}
          <div className="fl-card p-4 mb-4 border-correct/20 bg-correct/5">
            <p className="text-xs font-semibold uppercase tracking-widest text-correct mb-2">
              Your sentence
            </p>
            <p className="text-base text-text-primary leading-relaxed">
              {userAnswer.split(new RegExp(`(${word})`, "gi")).map((part, i) =>
                part.toLowerCase() === word.toLowerCase() ? (
                  <span key={i} className="text-primary font-semibold">
                    {part}
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
            </p>
          </div>

          {/* Encouragement */}
          <div className="flex items-start gap-3 mb-4 px-1">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-sm font-medium text-text-primary mb-0.5">
                Great effort!
              </p>
              <p className="text-xs text-text-muted leading-relaxed">
                You used <span className="text-primary font-medium">"{word}"</span> in
                your own sentence. That's how vocabulary actually sticks — through
                production, not just reading.
              </p>
            </div>
          </div>

          {/* Example answer toggle */}
          <div className="mb-5">
            <button
              onClick={() => setShowExample((v) => !v)}
              className="text-xs text-primary-light underline underline-offset-2 hover:text-primary transition-colors"
            >
              {showExample ? "Hide example answer" : "See an example answer"}
            </button>
            {showExample && (
              <div className="mt-3 fl-card px-4 py-3 border-border/60 animate-fade-in">
                <p className="text-xs font-semibold uppercase tracking-widest text-text-subtle mb-2">
                  Example answer
                </p>
                <p className="text-sm text-text-muted leading-relaxed italic">
                  "{exampleAnswer}"
                </p>
              </div>
            )}
          </div>

          {/* Try again */}
          <Button onClick={handleReset} variant="secondary" size="md">
            Write another sentence →
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────

export default function WordOfTheDayPage() {
  const word          = getTodaysWord();
  const { speak, speaking } = useSpeech();

  // Format today's date nicely
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
    year:    "numeric",
  });

  return (
    <div className="fl-container py-10 animate-fade-in">
      <div className="max-w-2xl mx-auto">

        {/* Date eyebrow */}
        <p className="text-xs font-semibold uppercase tracking-widest text-text-subtle mb-6">
          📅 {today}
        </p>

        {/* ── Word hero ── */}
        <div className="fl-card p-8 mb-6 border-primary/15 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-glow-primary pointer-events-none" />

          <div className="relative">
            {/* Label */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">✨</span>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-light">
                Word of the day
              </p>
            </div>

            {/* Word */}
            <h1 className="font-display font-bold text-display-xl text-text-primary mb-2 leading-none">
              {word.word}
            </h1>

            {/* Phonetic + pronounce button */}
            <div className="flex items-center gap-4 mb-5 flex-wrap">
              <span className="text-lg text-text-muted font-body tracking-wide">
                {word.phonetic}
              </span>
              <PronounceButton
                word={word.word}
                speaking={speaking}
                onSpeak={() => speak(word.word)}
              />
            </div>

            {/* Part-of-speech badges */}
            <div className="flex flex-wrap gap-2">
              {word.definitions.map((def, i) => (
                <Badge
                  key={i}
                  variant={PART_OF_SPEECH_VARIANT[def.partOfSpeech]}
                  dot
                >
                  {def.partOfSpeech}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* ── Definitions + examples ── */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-subtle mb-3">
            Meaning & usage
          </p>
          <div className="flex flex-col gap-4">
            {word.definitions.map((def, i) => (
              <DefinitionCard key={i} definition={def} />
            ))}
          </div>
        </div>

        {/* ── Pronunciation section ── */}
        <div className="fl-card p-5 mb-6 border-border/60">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-semibold text-text-primary mb-0.5">
                Practise saying it aloud
              </p>
              <p className="text-xs text-text-muted">
                Listen carefully, then say it yourself. Repeat 3 times.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <PronounceButton
                word={word.word}
                speaking={speaking}
                onSpeak={() => speak(word.word)}
              />
              <button
                onClick={() => speak(`${word.word}. ${word.definitions[0]?.meaning ?? ""}`)}
                className="
                  flex items-center gap-2 px-4 py-2 rounded-pill border border-border
                  text-sm font-medium text-text-muted
                  hover:border-primary/40 hover:text-primary hover:bg-primary/10
                  transition-all duration-200
                "
              >
                <svg
                  className="w-4 h-4"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                Word + meaning
              </button>
            </div>
          </div>
        </div>

        {/* ── Challenge ── */}
        <ChallengeSection
          instruction={word.challenge.instruction}
          hints={word.challenge.hints}
          exampleAnswer={word.challenge.exampleAnswer}
          word={word.word}
        />

        {/* ── Come back tomorrow ── */}
        <div className="mt-6 text-center">
          <p className="text-xs text-text-subtle">
            A new word unlocks every day at midnight ·{" "}
            <span className="text-primary-light">
              {WORDS_OF_THE_DAY.length} words in rotation
            </span>
          </p>
        </div>

      </div>
    </div>
  );
}

