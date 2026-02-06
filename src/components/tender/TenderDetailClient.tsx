"use client";

import { useState } from "react";
import type { Tender } from "@/types/database";
import type { Evaluation } from "@/types/database";
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel";

interface TenderDetailClientProps {
  tenderId: string;
  tender: Tender;
  evaluation: Evaluation | null;
}

export function TenderDetailClient({
  tenderId,
  tender,
  evaluation,
}: TenderDetailClientProps) {
  const [error, setError] = useState<string | undefined>();

  const evaluationData =
    evaluation != null
      ? {
          overall_score: evaluation.overall_score,
          auto_recommendation: evaluation.auto_recommendation,
          criteria_scores: (evaluation.criteria_scores ?? {}) as Record<
            string,
            unknown
          >,
          updated_at: evaluation.updated_at,
        }
      : null;

  return (
    <div className="space-y-8">
      <div className="rounded-md border border-border bg-card p-6">
        <h1 className="text-xl font-bold text-foreground">
          {tender.tender_title}
        </h1>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">الجهة</dt>
            <dd className="font-medium text-foreground">{tender.entity}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">رقم المنافسة</dt>
            <dd className="font-medium text-foreground">{tender.tender_number}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">الموعد النهائي</dt>
            <dd className="font-medium text-foreground">
              {new Date(tender.deadline).toLocaleDateString("ar-SA")}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">القيمة التقديرية</dt>
            <dd className="font-medium text-foreground" dir="ltr">
              {Number(tender.estimated_value).toLocaleString("ar-SA")}
            </dd>
          </div>
        </dl>
        {tender.description && (
          <div className="mt-4">
            <dt className="text-muted-foreground">الوصف</dt>
            <dd className="mt-1 text-foreground">{tender.description}</dd>
          </div>
        )}
      </div>

      <AnalysisPanel
        tenderId={tenderId}
        evaluation={evaluationData}
        error={error}
        onError={setError}
      />
    </div>
  );
}
