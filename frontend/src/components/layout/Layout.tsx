// src/components/layout/Layout.tsx

import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────────────

interface NavItem {
  path: string;
  label: string;
  emoji: string;
  description: string;
}

interface UserProgress {
  streak: number;
  sessions_completed: number;
  level: "foundation" | "everyday" | "free";
}

// ── Nav items ─────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  {
    path: "/practice",
    label: "Daily Practice",
    emoji: "⚡",
    description: "5-min session",
  },
  {
    path: "/speaking",
    label: "Speaking",
    emoji: "🎙️",
    description: "Role-play scenarios",
  },
  {
    path: "/writing",
    label: "Writing",
    emoji: "✍️",
    description: "Grammar & style",
  },
  {
    path: "/word-of-the-day",
    label: "Word of the Day",
    emoji: "📖",
    description: "Daily vocabulary",
  },
];

// ── Progress hook ─────────────────────────────────────────────────────────
// Fetches streak + sessions from the backend once on mount.
// Falls back to zeros gracefully if the API is not yet live.

function useUserProgress(): UserProgress {
  const [progress, setProgress] = useState<UserProgress>({
    streak:             0,
    sessions_completed: 0,
    level:              "everyday",
  });

  useEffect(() => {
    // API: GET /api/user/progress
    // Response: { streak: number, sessions_completed: number, level: string }
    fetch(`${import.meta.env.VITE_API_URL}/api/user/progress`)
      .then((r) => {
        if (!r.ok) throw new Error("Progress fetch failed");
        return r.json();
      })
      .then((data: UserProgress) => setProgress(data))
      .catch(() => {
        // API not yet live — silently keep default zeros
        // Remove this catch block once backend is integrated
      });
  }, []);

  return progress;
}

// ── Layout ────────────────────────────────────────────────────────────────

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location  = useLocation();
  const isLanding = location.pathname === "/";
  const progress  = useUserProgress();   // ← real streak + sessions from API

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Top Header ── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="fl-container h-14 flex items-center justify-between">

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-sm shadow-glow group-hover:shadow-glow-accent transition-shadow duration-300">
              🌀
            </div>
            <span className="font-display font-bold text-text-primary text-lg tracking-tight">
              Fluent<span className="text-gradient-primary">Loop</span>
            </span>
          </NavLink>

          {/* Desktop nav */}
          {!isLanding && (
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? "bg-primary/15 text-primary"
                      : "text-text-muted hover:text-text-primary hover:bg-white/5"
                    }`
                  }
                >
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">

            {/* Streak badge — real data from API */}
            {!isLanding && (
              <div className="hidden sm:flex items-center gap-1.5 fl-pill bg-accent/10 text-accent">
                <span>🔥</span>
                {/* REAL: progress.streak from GET /api/user/progress */}
                <span>
                  {progress.streak > 0
                    ? `${progress.streak}-day streak`
                    : "Start your streak!"}
                </span>
              </div>
            )}

            {/* Mobile menu toggle */}
            {!isLanding && (
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="md:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            )}

            {/* CTA (landing only) */}
            {isLanding && (
              <NavLink
                to="/practice"
                className="fl-pill bg-primary text-white hover:bg-primary-dark transition-colors shadow-glow"
              >
                Start practising →
              </NavLink>
            )}
          </div>
        </div>

        {/* ── Mobile dropdown menu ── */}
        {!isLanding && mobileMenuOpen && (
          <div className="md:hidden border-t border-border/60 bg-surface animate-fade-in">
            <nav className="fl-container py-3 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200
                    ${isActive
                      ? "bg-primary/15 text-primary"
                      : "text-text-muted hover:text-text-primary hover:bg-white/5"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.emoji}</span>
                    <div>
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs text-text-subtle">{item.description}</div>
                    </div>
                  </div>
                  <svg className="w-4 h-4 opacity-40" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </NavLink>
              ))}

              {/* Streak in mobile menu — real data */}
              <div className="mt-2 pt-3 border-t border-border/60 flex items-center gap-2 px-3 text-sm text-text-muted">
                <span>🔥</span>
                {/* REAL: progress.streak from GET /api/user/progress */}
                <span>
                  {progress.streak > 0
                    ? `${progress.streak}-day streak — keep it going!`
                    : "Complete a session to start your streak!"}
                </span>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ── Main content + sidebar ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar (desktop only) */}
        {!isLanding && (
          <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border/60 bg-surface/50 pt-6 pb-8 px-3 gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                  ${isActive
                    ? "bg-primary/15 text-primary shadow-glow"
                    : "text-text-muted hover:text-text-primary hover:bg-white/5"
                  }`
                }
              >
                <span className="text-lg">{item.emoji}</span>
                <div>
                  <div className="text-sm font-medium leading-tight">{item.label}</div>
                  <div className="text-xs text-text-subtle group-hover:text-text-muted transition-colors">
                    {item.description}
                  </div>
                </div>
              </NavLink>
            ))}

            {/* Bottom progress snapshot — real data */}
            <div className="mt-auto pt-4 border-t border-border/60 px-3">
              <div className="text-xs text-text-subtle mb-2 font-medium uppercase tracking-wider">
                This week
              </div>

              {/* REAL: progress.streak from GET /api/user/progress */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">🔥</span>
                <span className="text-sm text-text-muted">
                  {progress.streak > 0
                    ? `${progress.streak}-day streak`
                    : "No streak yet"}
                </span>
              </div>

              {/* REAL: progress.sessions_completed from GET /api/user/progress */}
              <div className="flex items-center gap-2">
                <span className="text-sm">✅</span>
                <span className="text-sm text-text-muted">
                  {progress.sessions_completed > 0
                    ? `${progress.sessions_completed} sessions done`
                    : "No sessions yet"}
                </span>
              </div>
            </div>
          </aside>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}