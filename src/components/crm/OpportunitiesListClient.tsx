"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/stores/language-store";
import { ts, t } from "@/lib/i18n";
import { ScoreBadge } from "@/components/ui";
import { OpportunityStatsRow } from "./OpportunityStatsRow";
import { batchRepush } from "@/app/actions/crm";
import type { Opportunity, OpportunityStats } from "@/app/actions/crm";
import type { EvaluationRecommendation } from "@/types/database";

const REC_STYLES: Record<string, string> = {
  proceed: "bg-confidence-high/15 text-confidence-high",
  review: "bg-confidence-medium/15 text-confidence-medium",
  skip: "bg-confidence-low/15 text-confidence-low",
};

const REC_LABELS: Record<string, { ar: string; en: string }> = {
  proceed: { ar: "متابعة", en: "Proceed" },
  review: { ar: "مراجعة", en: "Review" },
  skip: { ar: "تخطي", en: "Skip" },
};

interface Props {
  opportunities: Opportunity[];
  stats: OpportunityStats;
}

export function OpportunitiesListClient({ opportunities, stats }: Props) {
  const router = useRouter();
  const lang = useLanguageStore((s) => s.lang);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>("evaluation_score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isPending, startTransition] = useTransition();

  const sorted = useMemo(() => {
    return [...opportunities].sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortBy];
      const bVal = (b as unknown as Record<string, unknown>)[sortBy];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [opportunities, sortBy, sortOrder]);

  function handleSort(col: string) {
    if (sortBy === col) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortOrder("asc"); }
  }

  function toggleAll() {
    if (selected.size === sorted.length) setSelected(new Set());
    else setSelected(new Set(sorted.map((o) => o.id)));
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  function handleBatchRepush() {
    const ids = Array.from(selected);
    startTransition(async () => {
      await batchRepush(ids);
      setSelected(new Set());
      router.refresh();
    });
  }

  const selectedFn = t("selected", lang);
  const selectedText = typeof selectedFn === "function" ? selectedFn(selected.size) : `${selected.size}`;

  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-500/10 border border-accent-500/20">
          <RefreshCw className="h-7 w-7 text-accent-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{ts("noOpportunities", lang)}</h3>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">{ts("noOpportunitiesDesc", lang)}</p>
      </div>
    );
  }

  function SortHeader({ col, label }: { col: string; label: string }) {
    return (
      <th
        className="cursor-pointer px-4 py-3 text-start text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/80 select-none"
        onClick={() => handleSort(col)}
      >
        {label} {sortBy === col && (sortOrder === "asc" ? "↑" : "↓")}
      </th>
    );
  }

  function RecBadge({ rec }: { rec: EvaluationRecommendation | string | null }) {
    if (!rec) return <span className="text-muted-foreground">—</span>;
    const style = REC_STYLES[rec] ?? "bg-muted text-muted-foreground";
    const label = REC_LABELS[rec]?.[lang] ?? rec;
    return (
      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", style)}>
        {label}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <OpportunityStatsRow stats={stats} />

      {/* Batch action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-accent-500/30 bg-accent-500/5 px-4 py-3">
          <span className="text-sm font-medium text-foreground">{selectedText}</span>
          <button
            type="button"
            onClick={handleBatchRepush}
            disabled={isPending}
            className="rounded-md bg-accent-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-400 transition-colors disabled:opacity-50"
          >
            {isPending ? ts("pushing", lang) : ts("repushSelected", lang)}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={selected.size === sorted.length && sorted.length > 0}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-border accent-accent-500"
                />
              </th>
              <SortHeader col="tender_title" label={ts("opportunityName", lang)} />
              <SortHeader col="entity" label={ts("partner", lang)} />
              <SortHeader col="estimated_value" label={ts("expectedValue", lang)} />
              <SortHeader col="evaluation_score" label={ts("probability", lang)} />
              <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground">
                {ts("evaluation", lang)}
              </th>
              <SortHeader col="pushed_to_odoo_at" label={ts("pushDate", lang)} />
              <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground">
                {ts("odooId", lang)}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((opp) => (
              <tr
                key={opp.id}
                className="cursor-pointer border-t border-border transition-colors hover:bg-muted/50"
                onClick={() => router.push(`/opportunities/${opp.id}`)}
              >
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(opp.id)}
                    onChange={() => toggleOne(opp.id)}
                    className="h-4 w-4 rounded border-border accent-accent-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground truncate max-w-[200px]">
                    {opp.tender_title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 font-data">
                    {opp.tender_number}
                  </div>
                </td>
                <td className="px-4 py-3 text-foreground">{opp.entity}</td>
                <td className="px-4 py-3 font-data tabular-nums" dir="ltr">
                  {opp.estimated_value != null
                    ? Number(opp.estimated_value).toLocaleString("ar-SA")
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  {opp.evaluation_score != null ? (
                    <ScoreBadge score={opp.evaluation_score} size="sm" />
                  ) : "—"}
                </td>
                <td className="px-4 py-3">
                  <RecBadge rec={opp.auto_recommendation ?? opp.recommendation} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {opp.pushed_to_odoo_at
                    ? new Date(opp.pushed_to_odoo_at).toLocaleDateString("ar-SA")
                    : "—"}
                </td>
                <td className="px-4 py-3 font-data text-xs text-muted-foreground">
                  {opp.odoo_lead_id != null ? `#${opp.odoo_lead_id}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
