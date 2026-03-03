"use client";

import { useLanguageStore } from "@/stores/language-store";
import { ts } from "@/lib/i18n";

const BUCKETS = [
  { label: "0–25", color: "bg-destructive" },
  { label: "26–50", color: "bg-amber-500" },
  { label: "51–75", color: "bg-accent-500/70" },
  { label: "76–100", color: "bg-accent-500" },
] as const;

interface ScoreDistributionProps {
  counts: [number, number, number, number];
}

export function ScoreDistribution({ counts }: ScoreDistributionProps) {
  const lang = useLanguageStore((s) => s.lang);
  const maxCount = Math.max(1, ...counts);

  return (
    <div className="rounded-xl border border-border/40 bg-card">
      <div className="border-b border-border/40 px-5 py-4">
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
                <span className="text-overline text-muted-foreground">
                  {bucket.label}
                </span>
                <span className="font-semibold tabular-nums font-data text-foreground">
                  {count}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted/50">
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
