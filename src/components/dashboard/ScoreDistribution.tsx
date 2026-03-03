"use client";

import { useLanguageStore } from "@/stores/language-store";
import { t, ts } from "@/lib/i18n";

const BUCKETS = [
  { label: "0–25", from: "from-destructive/80", to: "to-destructive" },
  { label: "26–50", from: "from-amber-500/80", to: "to-amber-500" },
  { label: "51–75", from: "from-accent-500/60", to: "to-accent-500/80" },
  { label: "76–100", from: "from-accent-400", to: "to-confidence-high" },
] as const;

const BAR_COLORS = [
  "bg-destructive",
  "bg-amber-500",
  "bg-accent-500/70",
  "bg-accent-500",
] as const;

interface ScoreDistributionProps {
  counts: [number, number, number, number];
}

export function ScoreDistribution({ counts }: ScoreDistributionProps) {
  const lang = useLanguageStore((s) => s.lang);
  const maxCount = Math.max(1, ...counts);
  const total = counts.reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-xl border border-border/40 bg-card gradient-border-top overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">
          {ts("scoreDistribution", lang)}
        </h2>
        {total > 0 && (
          <span className="text-xs text-muted-foreground font-data tabular-nums">
            {(() => { const fn = t("tendersCount", lang); return typeof fn === "function" ? fn(total) : `${total}`; })()}
          </span>
        )}
      </div>
      <div className="space-y-4 p-5">
        {BUCKETS.map((bucket, i) => {
          const count = counts[i];
          const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={bucket.label} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-overline text-muted-foreground">
                  {bucket.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {pct}%
                  </span>
                  <span className="font-semibold tabular-nums font-data text-foreground min-w-[1.5rem] text-end">
                    {count}
                  </span>
                </div>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted/30">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-out ${BAR_COLORS[i]}`}
                  style={{ width: `${width}%`, minWidth: count > 0 ? "8px" : "0px" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
