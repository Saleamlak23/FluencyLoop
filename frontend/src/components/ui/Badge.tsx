// src/components/ui/Badge.tsx

import type { ReactNode } from "react";

type BadgeVariant = "primary" | "accent" | "correct" | "caution" | "error" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-primary/10 text-primary-light border-primary/20",
  accent:  "bg-accent/10  text-accent       border-accent/20",
  correct: "bg-correct/10 text-correct       border-correct/20",
  caution: "bg-caution/10 text-caution       border-caution/20",
  error:   "bg-error/10   text-error         border-error/20",
  neutral: "bg-white/5    text-text-muted    border-border/60",
};

const dotStyles: Record<BadgeVariant, string> = {
  primary: "bg-primary",
  accent:  "bg-accent",
  correct: "bg-correct",
  caution: "bg-caution",
  error:   "bg-error",
  neutral: "bg-text-subtle",
};

export default function Badge({
  variant = "neutral",
  children,
  dot = false,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        fl-pill border text-xs font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[variant]}`} />
      )}
      {children}
    </span>
  );
}