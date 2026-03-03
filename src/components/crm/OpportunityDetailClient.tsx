"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Send, ExternalLink, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/stores/language-store";
import { ts } from "@/lib/i18n";
import { ScoreBadge } from "@/components/ui";
import { updateOpportunity, repushToOdoo } from "@/app/actions/crm";
import type { Opportunity } from "@/app/actions/crm";
import type { EvaluationRecommendation } from "@/types/database";

const REC_STYLES: Record<string, string> = {
  proceed: "bg-confidence-high/15 text-confidence-high border-confidence-high/25",
  review: "bg-confidence-medium/15 text-confidence-medium border-confidence-medium/25",
  skip: "bg-confidence-low/15 text-confidence-low border-confidence-low/25",
};

const REC_LABELS: Record<string, { ar: string; en: string }> = {
  proceed: { ar: "متابعة", en: "Proceed" },
  review: { ar: "مراجعة", en: "Review" },
  skip: { ar: "تخطي", en: "Skip" },
};

interface Props {
  opportunity: Opportunity;
  autoRecommendation: EvaluationRecommendation | null;
}

export function OpportunityDetailClient({ opportunity: opp, autoRecommendation }: Props) {
  const router = useRouter();
  const lang = useLanguageStore((s) => s.lang);
  const [isSaving, startSaving] = useTransition();
  const [isPushing, startPushing] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [entity, setEntity] = useState(opp.entity);
  const [title, setTitle] = useState(opp.tender_title);
  const [value, setValue] = useState(opp.estimated_value?.toString() ?? "");
  const [deadline, setDeadline] = useState(opp.deadline);
  const [notes, setNotes] = useState(opp.description ?? "");

  const rec = autoRecommendation ?? opp.recommendation;

  function handleSave() {
    setError(null);
    startSaving(async () => {
      const r = await updateOpportunity(opp.id, {
        entity,
        tender_title: title,
        estimated_value: value ? Number(value) : undefined,
        deadline: deadline || undefined,
        description: notes || undefined,
      });
      if (!r.success) setError(r.error);
      else router.refresh();
    });
  }

  function handleSaveAndPush() {
    setError(null);
    startPushing(async () => {
      const r1 = await updateOpportunity(opp.id, {
        entity,
        tender_title: title,
        estimated_value: value ? Number(value) : undefined,
        deadline: deadline || undefined,
        description: notes || undefined,
      });
      if (!r1.success) { setError(r1.error); return; }
      const r2 = await repushToOdoo(opp.id);
      if (!r2.success) setError(r2.error);
      else router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3" dir="rtl">
      {/* Main — editable fields (2/3 width) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Back link */}
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          {ts("opportunities", lang)}
        </Link>

        {/* Edit card */}
        <div className="rounded-xl border border-border/40 bg-card p-6 space-y-5">
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            {ts("opportunityDetails", lang)}
          </h1>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{ts("opportunityName", lang)}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>

          {/* Entity */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{ts("partner", lang)}</label>
            <input
              type="text"
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>

          {/* Value + Deadline row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{ts("expectedValue", lang)}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                dir="ltr"
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground font-data tabular-nums focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{ts("deadline", lang)}</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                dir="ltr"
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground font-data focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{ts("notes", lang)}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {isSaving ? ts("saving", lang) : ts("save", lang)}
            </button>
            <button
              type="button"
              onClick={handleSaveAndPush}
              disabled={isPushing}
              className="rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-400 transition-colors glow-accent disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isPushing ? ts("pushing", lang) : ts("saveAndPush", lang)}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar — read-only info (1/3 width) */}
      <div className="space-y-4">
        {/* Score card */}
        {opp.evaluation_score != null && (
          <div className="rounded-xl border border-border/40 bg-card p-5 text-center">
            <p className="text-overline text-muted-foreground mb-3">{ts("probability", lang)}</p>
            <div className="flex justify-center mb-2">
              <ScoreBadge score={opp.evaluation_score} size="lg" />
            </div>
          </div>
        )}

        {/* Recommendation */}
        {rec && (
          <div className={cn(
            "rounded-xl border p-5 text-center",
            REC_STYLES[rec] ?? "border-border/40 bg-card"
          )}>
            <p className="text-overline mb-2">{ts("evaluation", lang)}</p>
            <p className="text-lg font-bold">
              {REC_LABELS[rec]?.[lang] ?? rec}
            </p>
          </div>
        )}

        {/* Odoo info */}
        <div className="rounded-xl border border-border/40 bg-card p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{ts("odooId", lang)}</span>
            <span className="font-data text-foreground">{opp.odoo_lead_id != null ? `#${opp.odoo_lead_id}` : "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{ts("pushDate", lang)}</span>
            <span className="text-foreground">
              {opp.pushed_to_odoo_at
                ? new Date(opp.pushed_to_odoo_at).toLocaleDateString("ar-SA")
                : "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{ts("tenderNumber", lang)}</span>
            <span className="font-data text-foreground">{opp.tender_number}</span>
          </div>
        </div>

        {/* Link to source tender */}
        <Link
          href={`/tenders/${opp.id}`}
          className="flex items-center gap-2 rounded-xl border border-border/40 bg-card p-4 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
        >
          <FileText className="h-4 w-4 text-accent-400" />
          {ts("sourceTender", lang)}
          <ExternalLink className="h-3.5 w-3.5 ms-auto text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
