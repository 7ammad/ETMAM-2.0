"use client";

import { useTransition } from "react";
import type { Tender } from "@/types/database";
import type { PipelineStage } from "@/types/database";
import type { PipelineEntry } from "@/types/database";
import type { PipelineStageId } from "@/lib/constants";
import { PIPELINE_STAGES } from "@/lib/constants";
import { moveToPipeline } from "@/app/actions/pipeline";
import { PipelineColumn } from "./PipelineColumn";

interface PipelineBoardProps {
  stages: PipelineStage[];
  entries: PipelineEntry[];
  tenders: Tender[];
}

function groupTendersByStage(
  tenders: Tender[],
  entries: PipelineEntry[],
  stageIds: string[]
): Map<string, Tender[]> {
  const tenderMap = new Map(tenders.map((t) => [t.id, t]));
  const byStage = new Map<string, Tender[]>();
  for (const id of stageIds) {
    byStage.set(id, []);
  }
  for (const e of entries) {
    const t = tenderMap.get(e.tender_id);
    if (t && byStage.has(e.stage_id)) {
      byStage.get(e.stage_id)!.push(t);
    }
  }
  return byStage;
}

export function PipelineBoard({
  stages,
  entries,
  tenders,
}: PipelineBoardProps) {
  const [isPending, startTransition] = useTransition();
  const stageIds = PIPELINE_STAGES.map((s) => s.id);
  const byStage = groupTendersByStage(tenders, entries, stageIds);

  function handleMove(tenderId: string, toStage: PipelineStageId) {
    startTransition(async () => {
      await moveToPipeline(tenderId, toStage);
      window.location.reload();
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const stageTenders = byStage.get(stage.id) ?? [];
        const nameAr =
          stages.find((s) => s.id === stage.id)?.name_ar ?? stage.labelAr;
        return (
          <PipelineColumn
            key={stage.id}
            stageId={stage.id}
            stageNameAr={nameAr}
            tenders={stageTenders}
            onMove={handleMove}
          />
        );
      })}
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <span className="text-sm text-foreground">جارٍ النقل...</span>
        </div>
      )}
    </div>
  );
}
