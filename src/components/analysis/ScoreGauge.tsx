"use client";

interface ScoreGaugeProps {
  score: number;
  size?: number;
  label?: string;
}

function scoreColor(score: number): string {
  if (score >= 70) return "var(--color-confidence-high)";
  if (score >= 40) return "var(--color-confidence-medium)";
  return "var(--color-confidence-low)";
}

export function ScoreGauge({
  score,
  size = 120,
  label = "التقييم",
}: ScoreGaugeProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const r = (size - 12) / 2 - 4;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (clamped / 100) * circumference;
  const color = scoreColor(clamped);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        className="rotate-[-90deg]"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={strokeWidth}
        />
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
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="text-2xl font-bold text-foreground" aria-live="polite">
        {clamped}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
