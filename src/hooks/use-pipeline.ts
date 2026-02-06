"use client";

import { useCallback } from "react";
import { usePipelineStore } from "@/stores/pipeline-store";
import type { PipelineStageId } from "@/lib/constants";

export function usePipeline() {
  const { stages, setStages, moveTender, addToStage } = usePipelineStore();

  const moveToStage = useCallback(
    async (tenderId: string, from: PipelineStageId, to: PipelineStageId) => {
      moveTender(tenderId, from, to);
      try {
        await fetch("/api/pipeline/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tender_id: tenderId, stage: to }),
        });
      } catch {
        // Revert on failure
        moveTender(tenderId, to, from);
      }
    },
    [moveTender]
  );

  return {
    stages,
    setStages,
    moveToStage,
    addToStage,
  };
}
