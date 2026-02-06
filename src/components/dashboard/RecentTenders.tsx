"use client";

import Link from "next/link";
import type { Tender } from "@/types/database";

function StatusBadge({ status, score }: { status: Tender["status"]; score: number | null }) {
  if (score != null) {
    if (score >= 75) return <span className="text-xs text-status-pushed">🟢 {score}</span>;
    if (score >= 50) return <span className="text-xs text-amber-500">🟡 {score}</span>;
    return <span className="text-xs text-destructive">🔴 {score}</span>;
  }
  const labels: Record<Tender["status"], string> = {
    new: "جديدة",
    evaluated: "مقيّمة",
    costed: "مُكلّفة",
    exported: "مُصدّرة",
  };
  return <span className="text-xs text-muted-foreground">{labels[status]}</span>;
}

interface RecentTendersProps {
  tenders: Pick<Tender, "id" | "tender_title" | "entity" | "evaluation_score" | "status">[];
}

export function RecentTenders({ tenders }: RecentTendersProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">آخر المنافسات</h2>
        <Link
          href="/tenders"
          className="text-xs font-medium text-primary hover:underline"
        >
          عرض الكل ←
        </Link>
      </div>
      <div className="divide-y divide-border">
        {tenders.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            لا توجد منافسات بعد
          </div>
        ) : (
          tenders.map((t) => (
            <Link
              key={t.id}
              href={`/tenders/${t.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {t.tender_title}
                </p>
                <p className="truncate text-xs text-muted-foreground">{t.entity}</p>
              </div>
              <StatusBadge status={t.status} score={t.evaluation_score} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
