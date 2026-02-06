import { CONFIDENCE_THRESHOLDS } from "@/lib/constants";

interface ConfidenceIndicatorProps {
  score: number | undefined | null;
  size?: "sm" | "md";
}

export function ConfidenceIndicator({
  score: rawScore,
  size = "sm",
}: ConfidenceIndicatorProps) {
  const score =
    typeof rawScore === "number" && !Number.isNaN(rawScore) ? rawScore : 0;
  const label =
    score >= CONFIDENCE_THRESHOLDS.high
      ? "عالي"
      : score >= CONFIDENCE_THRESHOLDS.medium
        ? "متوسط"
        : "منخفض";

  const colorClass =
    score >= CONFIDENCE_THRESHOLDS.high
      ? "bg-emerald-100 text-emerald-700"
      : score >= CONFIDENCE_THRESHOLDS.medium
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  const sizeClass = size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${colorClass} ${sizeClass}`}
      title={`ثقة الاستخراج: ${score}%`}
    >
      {score}%
      <span className="sr-only">({label})</span>
    </span>
  );
}
