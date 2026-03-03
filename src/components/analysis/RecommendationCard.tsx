"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const RECOMMENDATION_CONFIG = {
  proceed: {
    label: "متابعة",
    color: "text-confidence-high",
    bg: "bg-confidence-high/10 border-confidence-high/25",
    icon: CheckCircle2,
  },
  review: {
    label: "مراجعة",
    color: "text-accent-400",
    bg: "bg-accent-500/10 border-accent-500/25",
    icon: AlertTriangle,
  },
  skip: {
    label: "تخطي",
    color: "text-confidence-low",
    bg: "bg-confidence-low/10 border-confidence-low/25",
    icon: XCircle,
  },
} as const;

interface RecommendationCardProps {
  recommendation: "proceed" | "review" | "skip";
  reasoning?: string;
  redFlags?: string[];
}

export function RecommendationCard({
  recommendation,
  reasoning,
  redFlags = [],
}: RecommendationCardProps) {
  const config = RECOMMENDATION_CONFIG[recommendation] ?? RECOMMENDATION_CONFIG.review;
  const Icon = config.icon;

  return (
    <div className={cn("rounded-xl border p-5", config.bg)}>
      <div className="flex items-center gap-3 mb-3">
        <Icon className={cn("h-5 w-5", config.color)} />
        <div>
          <span className="text-overline text-muted-foreground">التوصية</span>
          <p className={cn("text-lg font-bold", config.color)}>
            {config.label}
          </p>
        </div>
      </div>
      {reasoning && (
        <p className="text-sm text-foreground leading-relaxed">{reasoning}</p>
      )}
      {redFlags.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {redFlags.map((flag, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-confidence-low">
              <span className="mt-1.5 h-1 w-1 rounded-full bg-confidence-low shrink-0" />
              {flag}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
