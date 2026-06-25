// src/pages/LandingPage.tsx

import { NavLink } from "react-router-dom";
import { SCENARIOS, WRITING_PROMPTS } from "../lib/dummy-data";

export default function LandingPage() {
  return (
    <div className="bg-background text-text-primary">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-glow-primary pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="fl-container relative pt-24 pb-20 text-center">

          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 fl-pill bg-primary/10 text-primary-light border border-primary/20 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-slow" />
            <span>AI-powered English tutor — always available</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-display-xl font-bold text-text-primary mb-5 max-w-3xl mx-auto">
            Speak English with{" "}
            <span className="text-gradient-primary">real confidence</span>
            <br />not just grammar rules
          </h1>

          {/* Sub-headline */}
          <p className="text-lg text-text-muted max-w-xl mx-auto mb-10 leading-relaxed">
            FluentLoop gives you a patient AI tutor that listens, corrects, and
            explains — so every 5-minute practice session feels like a real
            conversation, not a textbook exercise.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <NavLink
              to="/practice"
              className="px-6 py-3 rounded-pill bg-primary text-white font-semibold text-sm shadow-glow hover:bg-primary-dark hover:shadow-glow transition-all duration-200"
            >
              Start your free session →
            </NavLink>
            <NavLink
              to="/speaking"
              className="px-6 py-3 rounded-pill bg-white/5 border border-border text-text-muted hover:text-text-primary hover:bg-white/8 text-sm font-medium transition-all duration-200"
            >
              Try a speaking drill
            </NavLink>
          </div>

          {/* Social proof */}
          <p className="mt-6 text-xs text-text-subtle">
            No sign-up needed · Works in your browser · Free for pilot users
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="fl-container py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-light mb-2">
            The method
          </p>
          <h2 className="font-display text-display-md font-bold text-text-primary">
            Present → Practice → Produce
          </h2>
          <p className="text-text-muted mt-3 max-w-md mx-auto text-sm leading-relaxed">
            Every session follows the same three-stage loop used by the world's
            best language teachers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              stage: "01",
              emoji: "📖",
              title: "Present",
              color: "text-primary",
              bg: "bg-primary/10 border-primary/20",
              description:
                "The AI introduces vocabulary, a scenario, or a phrase — then models correct, natural usage so you know exactly what good sounds like.",
            },
            {
              stage: "02",
              emoji: "🎙️",
              title: "Practice",
              color: "text-accent",
              bg: "bg-accent/10 border-accent/20",
              description:
                "Guided drills with word-level feedback after every turn. Each mistake is corrected in context — not just flagged and forgotten.",
            },
            {
              stage: "03",
              emoji: "✨",
              title: "Produce",
              color: "text-correct",
              bg: "bg-correct/10 border-correct/20",
              description:
                "Free speaking or writing with light scaffolding. The AI evaluates your output, rewrites it naturally, and surfaces your top patterns.",
            },
          ].map((step) => (
            <div
              key={step.stage}
              className={`fl-card p-6 border ${step.bg} animate-slide-up`}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{step.emoji}</span>
                <span className={`font-display font-bold text-2xl ${step.color} opacity-30`}>
                  {step.stage}
                </span>
              </div>
              <h3 className={`font-display font-bold text-lg mb-2 ${step.color}`}>
                {step.title}
              </h3>
              <p className="text-text-muted text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature: Transcript feedback preview ── */}
      <section className="fl-container py-16">
        <div className="fl-card p-8 md:p-10 border border-primary/10 bg-glow-primary">
          <div className="grid md:grid-cols-2 gap-10 items-center">

            {/* Left — copy */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-light mb-2">
                Speaking feedback
              </p>
              <h2 className="font-display text-display-sm font-bold text-text-primary mb-4">
                See exactly which words to fix — and why
              </h2>
              <p className="text-text-muted text-sm leading-relaxed mb-6">
                After every speaking turn, your transcript appears word by word
                with colour-coded feedback. No vague scores — just clear,
                actionable corrections in plain English.
              </p>
              <div className="flex flex-col gap-2 text-sm">
                {[
                  { color: "bg-correct", label: "Correct — natural and accurate" },
                  { color: "bg-caution", label: "Caution — understood but unnatural" },
                  { color: "bg-error",   label: "Error — mispronounced or wrong form" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-text-muted">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — live transcript mock */}
            <div className="fl-card p-5 bg-surface border-border/60">
              <p className="text-xs text-text-subtle mb-3 font-medium">Your transcript</p>
              <p className="text-base font-body leading-loose">
                <span className="word-correct">I</span>
                <span className="word-caution">want</span>
                <span className="word-correct">one</span>
                <span className="word-error">café</span>
                <span className="word-correct">latte,</span>
                <span className="word-correct">please</span>
                <span className="word-correct">—</span>
                <span className="word-correct">and</span>
                <span className="word-correct">can</span>
                <span className="word-correct">you</span>
                <span className="word-correct">make</span>
                <span className="word-correct">it</span>
                <span className="word-correct">with</span>
                <span className="word-caution">less</span>
                <span className="word-correct">sugar?</span>
              </p>
              <div className="mt-4 pt-4 border-t border-border/60 flex flex-col gap-2">
                {[
                  { word: "want", note: 'Try "I\'d like" — sounds more polite' },
                  { word: "café latte", note: 'Just say "latte" in everyday English' },
                  { word: "less sugar", note: '"Not too much sugar" sounds more natural' },
                ].map((item) => (
                  <div key={item.word} className="flex items-start gap-2 text-xs">
                    <span className="fl-pill bg-error/10 text-error border border-error/20 shrink-0">
                      {item.word}
                    </span>
                    <span className="text-text-muted pt-0.5">{item.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Scenarios + Prompts preview ── */}
      <section className="fl-container py-16">
        <div className="grid md:grid-cols-2 gap-8">

          {/* Speaking scenarios */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-light mb-2">
              Speaking scenarios
            </p>
            <h3 className="font-display font-bold text-display-sm text-text-primary mb-5">
              Real situations. Real language.
            </h3>
            <div className="flex flex-col gap-3">
              {SCENARIOS.map((scenario) => (
                <NavLink
                  to="/speaking"
                  key={scenario.id}
                  className="fl-card p-4 flex items-center gap-4 hover:border-primary/40 hover:shadow-glow transition-all duration-200 group"
                >
                  <span className="text-2xl">{scenario.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-text-primary group-hover:text-primary transition-colors">
                      {scenario.title}
                    </div>
                    <div className="text-xs text-text-subtle mt-0.5 truncate">
                      {scenario.description}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-text-subtle group-hover:text-primary transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Writing prompts */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">
              Writing prompts
            </p>
            <h3 className="font-display font-bold text-display-sm text-text-primary mb-5">
              Write. Get corrected. Improve.
            </h3>
            <div className="flex flex-col gap-3">
              {WRITING_PROMPTS.map((prompt) => (
                <NavLink
                  to="/writing"
                  key={prompt.id}
                  className="fl-card p-4 flex items-center gap-4 hover:border-accent/40 hover:shadow-glow-accent transition-all duration-200 group"
                >
                  <span className="text-2xl">{prompt.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-text-primary group-hover:text-accent transition-colors">
                      {prompt.title}
                    </div>
                    <div className="text-xs text-text-subtle mt-0.5 truncate">
                      {prompt.instruction}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-text-subtle group-hover:text-accent transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="fl-container py-20">
        <div className="fl-card p-10 md:p-14 text-center border border-primary/15 bg-glow-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-glow-primary pointer-events-none" />
          <div className="relative">
            <h2 className="font-display text-display-md font-bold text-text-primary mb-4">
              Your first session takes{" "}
              <span className="text-gradient-accent">5 minutes</span>
            </h2>
            <p className="text-text-muted max-w-md mx-auto mb-8 text-sm leading-relaxed">
              No account required. Just pick a scenario, start speaking, and see
              your feedback in real time. It's that simple.
            </p>
            <NavLink
              to="/practice"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-pill bg-primary text-white font-semibold shadow-glow hover:bg-primary-dark hover:shadow-glow transition-all duration-200"
            >
              <span>⚡</span>
              <span>Start Daily Practice</span>
            </NavLink>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/60 py-8">
        <div className="fl-container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌀</span>
            <span className="font-display font-bold text-sm text-text-muted">FluentLoop</span>
            <span className="text-text-subtle text-xs">MVP v0.1</span>
          </div>
          <p className="text-xs text-text-subtle">
            Built for pilot users · Feedback welcome
          </p>
        </div>
      </footer>

    </div>
  );
}