"use client";

const BUCKETS = [
  { label: "0–25", min: 0, max: 25 },
  { label: "26–50", min: 26, max: 50 },
  { label: "51–75", min: 51, max: 75 },
  { label: "76–100", min: 76, max: 100 },
] as const;

interface ScoreDistributionProps {
  /** Count per bucket: [0-25, 26-50, 51-75, 76-100] */
  counts: [number, number, number, number];
}

export function ScoreDistribution({ counts }: ScoreDistributionProps) {
  const maxCount = Math.max(1, ...counts);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          توزيع التقييم
        </h2>
      </div>
      <div className="space-y-3 p-4">
        {BUCKETS.map((bucket, i) => {
          const count = counts[i];
          const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={bucket.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{bucket.label}</span>
                <span className="font-medium text-foreground">{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
