"use client";

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
}

interface AnalysisPanelProps {
  tenderId: string;
  evaluation: EvaluationData | null;
  error?: string;
  onError?: (message: string) => void;
}

export function AnalysisPanel({
  tenderId,
  evaluation,
  error,
  onError,
}: AnalysisPanelProps) {
  if (evaluation) {
    const crit = evaluation.criteria_scores ?? {};
    const scores = crit.scores ?? {};
    const evidence = crit.evidence ?? [];
    const reasoning = crit.recommendation_reasoning;
    const redFlags = crit.red_flags ?? [];

    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-foreground">نتيجة التحليل</h2>
        <div className="flex flex-wrap gap-8">
          <ScoreGauge score={evaluation.overall_score} />
          <div className="flex-1 space-y-4 min-w-0">
            <RecommendationCard
              recommendation={evaluation.auto_recommendation}
              reasoning={reasoning}
              redFlags={redFlags}
            />
          </div>
        </div>
        <ScoreBreakdown scores={scores} />
        <EvidenceQuotes evidence={evidence} />
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-md border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">
        تحليل المنافسة بالذكاء الاصطناعي
      </h2>
      <p className="text-sm text-muted-foreground">
        احصل على تقييم وآراء مبنية على معايير الملاءمة والميزانية والجدول الزمني والمنافسة والمحاذاة الاستراتيجية.
      </p>
      {error && (
        <div
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}
      <AnalyzeButton tenderId={tenderId} onError={onError} />
    </div>
  );
}
