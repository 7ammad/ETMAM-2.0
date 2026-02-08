"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Tender } from "@/types/database";
import { useLanguageStore } from "@/stores/language-store";
import { ts } from "@/lib/i18n";

function StatusBadge({
  status,
  score,
  lang,
}: {
  status: Tender["status"];
  score: number | null;
  lang: "ar" | "en";
}) {
  if (score != null) {
    const color =
      score >= 75
        ? "bg-confidence-high/10 text-confidence-high"
        : score >= 50
          ? "bg-amber-500/10 text-amber-500"
          : "bg-destructive/10 text-destructive";
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
        {score}
      </span>
    );
  }
  const labels: Record<Tender["status"], string> = {
    new: ts("statusNew", lang),
    evaluated: ts("statusEvaluated", lang),
    costed: ts("statusCosted", lang),
    exported: ts("statusExported", lang),
  };
  return (
    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
      {labels[status]}
    </span>
  );
}

interface RecentTendersProps {
  tenders: Pick<
    Tender,
    "id" | "tender_title" | "entity" | "evaluation_score" | "status"
  >[];
}

export function RecentTenders({ tenders }: RecentTendersProps) {
  const lang = useLanguageStore((s) => s.lang);
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">
          {ts("recentTenders", lang)}
        </h2>
        <Link
          href="/tenders"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {ts("viewAll", lang)}
          <Arrow className="h-3 w-3" />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {tenders.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            {ts("noTendersYet", lang)}
          </div>
        ) : (
          tenders.map((t) => (
            <Link
              key={t.id}
              href={`/tenders/${t.id}`}
              className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {t.tender_title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {t.entity}
                </p>
              </div>
              <StatusBadge
                status={t.status}
                score={t.evaluation_score}
                lang={lang}
              />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
