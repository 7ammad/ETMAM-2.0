"use client";

import type { Tender } from "@/types/database";
import type { PipelineStageId } from "@/lib/constants";
import { PipelineCard } from "./PipelineCard";

interface PipelineColumnProps {
  stageId: PipelineStageId;
  stageNameAr: string;
  tenders: Tender[];
  onMove: (tenderId: string, toStage: PipelineStageId) => void;
}

export function PipelineColumn({
  stageId,
  stageNameAr,
  tenders,
  onMove,
}: PipelineColumnProps) {
  return (
    <div className="flex w-52 shrink-0 flex-col rounded-lg border border-border bg-muted/30">
      <div className="border-b border-border px-3 py-2">
        <h3 className="text-sm font-semibold text-foreground">{stageNameAr}</h3>
        <span className="text-xs text-muted-foreground">{tenders.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {tenders.map((tender) => (
          <PipelineCard
            key={tender.id}
            tender={tender}
            currentStage={stageId}
            onMove={onMove}
          />
        ))}
      </div>
    </div>
  );
}
