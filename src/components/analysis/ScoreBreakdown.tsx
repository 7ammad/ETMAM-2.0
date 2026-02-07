"use client";

interface CategoryScore {
  score: number;
  reasoning: string;
}

const CRITERIA_LABELS: Record<string, string> = {
  relevance: "التوافق التقني",
  budget_fit: "الملاءمة المالية",
  timeline: "الجدول الزمني",
  competition: "مستوى المنافسة",
  strategic: "القيمة الاستراتيجية",
};

interface ScoreBreakdownProps {
  scores: Record<string, CategoryScore>;
}

export function ScoreBreakdown({ scores }: ScoreBreakdownProps) {
  const entries = Object.entries(scores);
  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">تفصيل التقييم</h3>
      <ul className="space-y-3">
        {entries.map(([key, { score, reasoning }]) => (
          <li
            key={key}
            className="rounded-md border border-border bg-card p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                {CRITERIA_LABELS[key] ?? key}
              </span>
              <span
                className="text-sm font-semibold"
                style={{
                  color:
                    score >= 70
                      ? "var(--color-confidence-high)"
                      : score >= 40
                        ? "var(--color-confidence-medium)"
                        : "var(--color-confidence-low)",
                }}
              >
                {Math.round(score)}
              </span>
            </div>
            {reasoning && (
              <p className="mt-1 text-xs text-muted-foreground">{reasoning}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
