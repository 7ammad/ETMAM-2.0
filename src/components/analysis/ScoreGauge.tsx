"use client";

interface ScoreGaugeProps {
  score: number;
  size?: number;
  label?: string;
}

function scoreColor(score: number): string {
  if (score >= 70) return "var(--color-confidence-high)";
  if (score >= 40) return "var(--color-accent-500)";
  return "var(--color-confidence-low)";
}

export function ScoreGauge({
  score,
  size = 180,
  label = "التقييم",
}: ScoreGaugeProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const strokeWidth = 12;
  const r = (size - strokeWidth) / 2 - 4;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (clamped / 100) * circumference;
  const color = scoreColor(clamped);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="rotate-[-90deg]"
          aria-hidden
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth={strokeWidth}
            opacity={0.3}
          />
          {/* Score arc — stroke-draw animation */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="animate-stroke-draw"
          />
        </svg>
        {/* Score number inside circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-4xl font-bold font-data tabular-nums"
            style={{ color }}
            aria-live="polite"
          >
            {clamped}
          </span>
        </div>
      </div>
      <span className="text-overline text-muted-foreground">{label}</span>
    </div>
  );
}
