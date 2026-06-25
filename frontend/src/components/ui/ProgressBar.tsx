// src/components/ui/ProgressBar.tsx

interface ProgressBarProps {
  value: number;        // 0–100
  max?: number;
  label?: string;
  showPercent?: boolean;
  variant?: "primary" | "accent" | "correct";
  size?: "sm" | "md";
  animated?: boolean;
  className?: string;
}

const trackColors: Record<string, string> = {
  primary: "bg-primary",
  accent:  "bg-accent",
  correct: "bg-correct",
};

const sizeStyles = {
  sm: "h-1",
  md: "h-2",
};

export default function ProgressBar({
  value,
  max = 100,
  label,
  showPercent = false,
  variant = "primary",
  size = "md",
  animated = false,
  className = "",
}: ProgressBarProps) {
  const percent = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {/* Label row */}
      {(label || showPercent) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-xs text-text-muted font-medium">{label}</span>
          )}
          {showPercent && (
            <span className="text-xs text-text-subtle tabular-nums">
              {percent}%
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div className={`w-full bg-border/60 rounded-pill overflow-hidden ${sizeStyles[size]}`}>
        <div
          className={`
            h-full rounded-pill transition-all duration-500 ease-out
            ${trackColors[variant]}
            ${animated ? "animate-pulse-slow" : ""}
          `}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}