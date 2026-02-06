"use client";

import { StatCard } from "./StatCard";

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
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard value={totalTenders} label="إجمالي المنافسات" />
      <StatCard value={analyzedCount} label="مقيّمة" />
      <StatCard
        value={averageScore != null ? averageScore.toFixed(1) : "—"}
        label="متوسط التقييم"
      />
      <StatCard value={pushedToCrm} label="مرسلة إلى CRM" variant="highlight" />
    </div>
  );
}
