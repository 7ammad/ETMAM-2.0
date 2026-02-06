"use client";

import Link from "next/link";
import type { Tender } from "@/types/database";
import type { PipelineStageId } from "@/lib/constants";
import { PIPELINE_STAGES } from "@/lib/constants";
import { PushToCRMButton } from "./PushToCRMButton";

interface PipelineCardProps {
  tender: Tender;
  currentStage: PipelineStageId;
  onMove: (tenderId: string, toStage: PipelineStageId) => void;
}

export function PipelineCard({
  tender,
  currentStage,
  onMove,
}: PipelineCardProps) {
  const otherStages = PIPELINE_STAGES.filter((s) => s.id !== currentStage);

  return (
    <div className="rounded-md border border-border bg-card p-3 shadow-sm">
      <Link
        href={`/tenders/${tender.id}`}
        className="block text-sm font-medium text-foreground hover:underline"
      >
        {tender.tender_title}
      </Link>
      <p className="mt-0.5 text-xs text-muted-foreground">{tender.tender_number}</p>
      {tender.evaluation_score != null && (
        <p className="mt-1 text-xs text-foreground">
          التقييم: {tender.evaluation_score}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-1">
        {otherStages.slice(0, 3).map((stage) => (
          <button
            key={stage.id}
            type="button"
            onClick={() => onMove(tender.id, stage.id)}
            className="rounded border border-border bg-muted px-2 py-1 text-xs text-foreground hover:bg-muted/80"
          >
            {stage.labelAr}
          </button>
        ))}
      </div>
      {currentStage === "approved" && (
        <div className="mt-2">
          <PushToCRMButton tenderId={tender.id} />
        </div>
      )}
    </div>
  );
}
