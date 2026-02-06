"use client";

import Link from "next/link";
import { PIPELINE_STAGES } from "@/lib/constants";

interface PipelineSummaryProps {
  stageCounts: Record<string, number>;
}

export function PipelineSummary({ stageCounts }: PipelineSummaryProps) {
  const total = Object.values(stageCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">المسار</h2>
        <Link
          href="/pipeline"
          className="text-xs font-medium text-primary hover:underline"
        >
          فتح المسار ←
        </Link>
      </div>
      <div className="p-4">
        {total === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            لا توجد منافسات في المسار
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {PIPELINE_STAGES.map((stage) => {
              const count = stageCounts[stage.id] ?? 0;
              return (
                <div
                  key={stage.id}
                  className="rounded border border-border bg-muted/30 px-3 py-1.5"
                >
                  <span className="text-xs text-muted-foreground">
                    {stage.labelAr}:
                  </span>{" "}
                  <span className="text-sm font-medium text-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
