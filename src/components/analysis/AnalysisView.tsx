"use client";

import { useState } from "react";
import { ScoreGauge } from "./ScoreGauge";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { EvidenceQuotes } from "./EvidenceQuotes";
import { RecommendationCard } from "./RecommendationCard";
import { AnalyzeButton } from "./AnalyzeButton";

interface CriteriaScoresPayload {
  scores?: Record<
    string,
    { score: number; reasoning: string }
  >;
  evidence?: Array<{
    text: string;
    relevance: "supporting" | "concerning" | "neutral";
    source: string;
  }>;
  recommendation_reasoning?: string;
  red_flags?: string[];
  key_dates?: string[];
}

interface EvaluationData {
  overall_score: number;
  auto_recommendation: "proceed" | "review" | "skip";
  criteria_scores: CriteriaScoresPayload;
  updated_at?: string;
}

interface AnalysisViewProps {
  tenderId: string;
  evaluation: EvaluationData | null;
}

export function AnalysisView({ tenderId, evaluation }: AnalysisViewProps) {
  const [error, setError] = useState<string | undefined>();

  if (evaluation) {
    const crit = evaluation.criteria_scores ?? {};
    const scores = crit.scores ?? {};
    const evidence = crit.evidence ?? [];
    const reasoning = crit.recommendation_reasoning;
    const redFlags = crit.red_flags ?? [];

    return (
      <div className="space-y-8">
        {/* Header row with re-analyze */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">
              نتيجة التحليل
            </h2>
            {evaluation.updated_at && (
              <p className="text-xs text-muted-foreground mt-1">
                آخر تحليل:{" "}
                {new Date(evaluation.updated_at).toLocaleDateString("ar-SA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
          <AnalyzeButton
            tenderId={tenderId}
            onError={setError}
            label="إعادة التحليل"
            pendingLabel="جارٍ إعادة التحليل..."
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg bg-confidence-low/10 border border-confidence-low/25 p-3 text-sm text-confidence-low"
          >
            {error}
          </div>
        )}

        {/* Score gauge — hero position, centered */}
        <div className="flex justify-center py-4">
          <ScoreGauge score={evaluation.overall_score} size={180} />
        </div>

        {/* Recommendation — full width */}
        <RecommendationCard
          recommendation={evaluation.auto_recommendation}
          reasoning={reasoning}
          redFlags={redFlags}
        />

        {/* Score breakdown */}
        <ScoreBreakdown scores={scores} />

        {/* Evidence */}
        <EvidenceQuotes evidence={evidence} />

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground border-t border-border/40 pt-4">
          تنويه: هذا التحليل تم إنشاؤه بواسطة الذكاء الاصطناعي وهو استرشادي
          فقط. يُرجى التحقق من النتائج قبل اتخاذ أي قرار.
        </p>
      </div>
    );
  }

  // No evaluation yet — show CTA
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-500/10 border border-accent-500/20 mb-6">
        <svg className="h-7 w-7 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-foreground tracking-tight">
        تحليل المنافسة بالذكاء الاصطناعي
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mt-2 leading-relaxed">
        احصل على تقييم شامل مبني على معايير الملاءمة والميزانية والجدول
        الزمني والمنافسة والمحاذاة الاستراتيجية.
      </p>
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-confidence-low/10 border border-confidence-low/25 p-3 text-sm text-confidence-low mt-4"
        >
          {error}
        </div>
      )}
      <div className="mt-6">
        <AnalyzeButton tenderId={tenderId} onError={setError} />
      </div>
    </div>
  );
}
