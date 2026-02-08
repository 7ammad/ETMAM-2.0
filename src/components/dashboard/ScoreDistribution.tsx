"use client";

import { useLanguageStore } from "@/stores/language-store";
import { ts } from "@/lib/i18n";

const BUCKETS = [
  { label: "0–25", color: "bg-destructive" },
  { label: "26–50", color: "bg-amber-500" },
  { label: "51–75", color: "bg-sky-500" },
  { label: "76–100", color: "bg-confidence-high" },
] as const;

interface ScoreDistributionProps {
  counts: [number, number, number, number];
}

export function ScoreDistribution({ counts }: ScoreDistributionProps) {
  const lang = useLanguageStore((s) => s.lang);
  const maxCount = Math.max(1, ...counts);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">
          {ts("scoreDistribution", lang)}
        </h2>
      </div>
      <div className="space-y-4 p-5">
        {BUCKETS.map((bucket, i) => {
          const count = counts[i];
          const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={bucket.label} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-muted-foreground">
                  {bucket.label}
                </span>
                <span className="font-semibold tabular-nums text-foreground">
                  {count}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ease-out ${bucket.color}`}
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
