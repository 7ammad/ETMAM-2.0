"use client";

import { FileText, BarChart3, TrendingUp, Send } from "lucide-react";
import { StatCard } from "./StatCard";
import { useLanguageStore } from "@/stores/language-store";
import { ts } from "@/lib/i18n";

interface StatsRowProps {
  totalTenders: number;
  analyzedCount: number;
  averageScore: number | null;
  pushedToCrm: number;
}

export function StatsRow({
  totalTenders,
  analyzedCount,
  averageScore,
  pushedToCrm,
}: StatsRowProps) {
  const lang = useLanguageStore((s) => s.lang);
  const scoreNum = averageScore != null ? Math.round(averageScore) : 0;

  return (
    <div className="grid gap-5 grid-cols-1 sm:grid-cols-5">
      {/* Hero stat — score ring + number (2/5) */}
      <div className="col-span-1 sm:col-span-2 flex items-center gap-5 rounded-xl border border-accent-500/20 bg-card p-6 overflow-hidden relative">
        {/* Background glow */}
        <div className="absolute -top-10 -end-10 h-40 w-40 rounded-full bg-accent-500/5 blur-3xl" />

        {/* Score ring */}
        <div className="relative shrink-0">
          <svg width="80" height="80" viewBox="0 0 80 80" className="rotate-[-90deg]">
            {/* Track */}
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-muted/30"
            />
            {/* Progress */}
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="url(#scoreGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(scoreNum / 100) * 213.6} 213.6`}
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--color-accent-500)" />
                <stop offset="100%" stopColor="var(--color-accent-300)" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xl font-bold font-data tabular-nums text-foreground">
            {averageScore != null ? averageScore.toFixed(0) : "—"}
          </span>
        </div>

        <div className="relative">
          <p className="text-overline text-muted-foreground mb-1">{ts("avgScore", lang)}</p>
          <p className="text-3xl font-extrabold text-gradient-accent font-data tabular-nums leading-none">
            {averageScore != null ? averageScore.toFixed(1) : "—"}
          </p>
        </div>
      </div>

      {/* Secondary stats (3/5) */}
      <div className="col-span-1 sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          value={totalTenders}
          label={ts("totalTenders", lang)}
          icon={FileText}
        />
        <StatCard
          value={analyzedCount}
          label={ts("analyzed", lang)}
          icon={BarChart3}
        />
        <StatCard
          value={pushedToCrm}
          label={ts("pushedToCrm", lang)}
          icon={Send}
          variant="highlight"
        />
      </div>
    </div>
  );
}
