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

  return (
    <div className="grid gap-4 grid-cols-5">
      {/* Hero stat — 40% width (2/5) */}
      <div className="col-span-5 sm:col-span-2">
        <StatCard
          value={averageScore != null ? averageScore.toFixed(1) : "—"}
          label={ts("avgScore", lang)}
          icon={TrendingUp}
          variant="hero"
        />
      </div>

      {/* Secondary stats — 60% width (3/5) */}
      <div className="col-span-5 sm:col-span-3 grid grid-cols-3 gap-4">
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
