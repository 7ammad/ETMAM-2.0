"use client";

const RECOMMENDATION_LABELS: Record<string, string> = {
  proceed: "متابعة",
  review: "مراجعة",
  skip: "تخطي",
};

interface RecommendationCardProps {
  recommendation: "proceed" | "review" | "skip";
  reasoning?: string;
  redFlags?: string[];
}

export function RecommendationCard({
  recommendation,
  reasoning,
  redFlags = [],
}: RecommendationCardProps) {
  const label = RECOMMENDATION_LABELS[recommendation] ?? recommendation;

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-muted-foreground">
        التوصية
      </h3>
      <p
        className="mt-1 text-lg font-bold"
        style={{
          color:
            recommendation === "proceed"
              ? "var(--color-confidence-high)"
              : recommendation === "review"
                ? "var(--color-confidence-medium)"
                : "var(--color-confidence-low)",
        }}
      >
        {label}
      </p>
      {reasoning && (
        <p className="mt-2 text-sm text-foreground">{reasoning}</p>
      )}
      {redFlags.length > 0 && (
        <ul className="mt-3 list-inside list-disc text-sm text-destructive">
          {redFlags.map((flag, i) => (
            <li key={i}>{flag}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
