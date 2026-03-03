"use client";

import { cn } from "@/lib/utils";

interface CategoryScore {
  score: number;
  reasoning: string;
}

const CRITERIA_LABELS: Record<string, string> = {
  deliverable_categorization: "تصنيف المخرجات",
  competitive_feasibility: "الجدوى التنافسية",
  risk_assessment: "المخاطر",
  company_fit: "التوافق الاستراتيجي",
};

interface ScoreBreakdownProps {
  scores: Record<string, CategoryScore>;
}

function scoreBarColor(score: number): string {
  if (score >= 70) return "bg-confidence-high";
  if (score >= 40) return "bg-accent-500";
  return "bg-confidence-low";
}

export function ScoreBreakdown({ scores }: ScoreBreakdownProps) {
  const entries = Object.entries(scores);
  if (entries.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">تفصيل التقييم</h3>
      <div className="space-y-4">
        {entries.map(([key, { score, reasoning }]) => (
          <div
            key={key}
            className="rounded-xl border border-border/40 bg-card p-4"
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-sm font-medium text-foreground">
                {CRITERIA_LABELS[key] ?? key}
              </span>
              <span
                className={cn(
                  "text-sm font-bold font-data tabular-nums",
                  score >= 70
                    ? "text-confidence-high"
                    : score >= 40
                      ? "text-accent-400"
                      : "text-confidence-low"
                )}
              >
                {Math.round(score)}
              </span>
            </div>
            {/* Score bar */}
            <div className="h-1.5 w-full rounded-full bg-muted/50 mb-2">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500 ease-out",
                  scoreBarColor(score)
                )}
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              />
            </div>
            {reasoning && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {reasoning}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
