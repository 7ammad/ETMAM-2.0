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
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
        value={averageScore != null ? averageScore.toFixed(1) : "—"}
        label={ts("avgScore", lang)}
        icon={TrendingUp}
      />
      <StatCard
        value={pushedToCrm}
        label={ts("pushedToCrm", lang)}
        icon={Send}
        variant="highlight"
      />
    </div>
  );
}
