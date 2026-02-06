import { cn, getScoreBgColor } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "text-xs px-2 py-0.5 min-w-[2rem]",
  md: "text-sm px-2.5 py-1 min-w-[2.5rem]",
  lg: "text-lg px-3 py-1.5 min-w-[3rem] font-bold",
};

function getScoreLabel(score: number): string {
  if (score >= 76) return "ممتاز";
  if (score >= 51) return "جيد";
  if (score >= 26) return "مقبول";
  return "ضعيف";
}

function ScoreBadge({
  score,
  label,
  size = "md",
  showLabel = false,
  className,
}: ScoreBadgeProps) {
  const displayLabel = label || getScoreLabel(score);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-medium",
        getScoreBgColor(score),
        sizeClasses[size],
        className
      )}
    >
      <span className="ltr-nums tabular-nums">{score}</span>
      {showLabel && (
        <span className="text-current/70 text-[0.8em]">{displayLabel}</span>
      )}
    </div>
  );
}

export { ScoreBadge, getScoreLabel };
export type { ScoreBadgeProps };
