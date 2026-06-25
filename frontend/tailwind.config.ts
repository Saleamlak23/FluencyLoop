// frontend/tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base
        background: "#0A0F1E",
        surface: "#111827",
        card: "#1F2937",
        border: "#374151",

        // Brand
        primary: {
          DEFAULT: "#6366F1",
          light: "#818CF8",
          dark: "#4F46E5",
        },
        accent: {
          DEFAULT: "#F59E0B",
          light: "#FCD34D",
          dark: "#D97706",
        },

        // Feedback colours (transcript word coding)
        correct: "#10B981",
        caution: "#FBBF24",
        error: "#F87171",

        // Text
        "text-primary": "#F9FAFB",
        "text-muted": "#9CA3AF",
        "text-subtle": "#6B7280",
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-lg": ["2.5rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "display-md": ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "display-sm": ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
      },
      borderRadius: {
        card: "1rem",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
        glow: "0 0 24px rgba(99,102,241,0.25)",
        "glow-accent": "0 0 24px rgba(245,158,11,0.25)",
      },
      animation: {
        "pulse-slow": "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;