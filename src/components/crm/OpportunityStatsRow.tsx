"use client";

import { Target, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { useLanguageStore } from "@/stores/language-store";
import { ts } from "@/lib/i18n";
import type { OpportunityStats } from "@/app/actions/crm";

interface OpportunityStatsRowProps {
  stats: OpportunityStats;
}

export function OpportunityStatsRow({ stats }: OpportunityStatsRowProps) {
  const lang = useLanguageStore((s) => s.lang);

  return (
    <div className="grid gap-4 grid-cols-5">
      {/* Hero stat — total value */}
      <div className="col-span-5 sm:col-span-2">
        <StatCard
          value={stats.totalValue > 0 ? stats.totalValue.toLocaleString("ar-SA") : "—"}
          label={ts("totalValue", lang)}
          icon={DollarSign}
          variant="hero"
          trend={lang === "ar" ? "ر.س" : "SAR"}
        />
      </div>

      {/* Secondary stats */}
      <div className="col-span-5 sm:col-span-3 grid grid-cols-3 gap-4">
        <StatCard
          value={stats.total}
          label={ts("totalOpportunities", lang)}
          icon={Target}
        />
        <StatCard
          value={stats.avgScore > 0 ? stats.avgScore.toFixed(1) : "—"}
          label={ts("avgScore", lang)}
          icon={TrendingUp}
        />
        <StatCard
          value={stats.thisMonth}
          label={ts("thisMonth", lang)}
          icon={Calendar}
          variant="highlight"
        />
      </div>
    </div>
  );
}
