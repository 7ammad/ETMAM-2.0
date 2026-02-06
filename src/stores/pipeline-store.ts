import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { PipelineStageId } from "@/lib/constants";

interface PipelineStore {
  stages: Record<PipelineStageId, string[]>;

  setStages: (stages: Record<PipelineStageId, string[]>) => void;
  moveTender: (tenderId: string, from: PipelineStageId, to: PipelineStageId) => void;
  addToStage: (tenderId: string, stage: PipelineStageId) => void;
}

export const usePipelineStore = create<PipelineStore>()(
  devtools(
    (set) => ({
      stages: {
        new: [],
        scored: [],
        approved: [],
        pushed: [],
        won: [],
        lost: [],
      },

      setStages: (stages) => set({ stages }),
      moveTender: (tenderId, from, to) =>
        set((state) => ({
          stages: {
            ...state.stages,
            [from]: state.stages[from].filter((id) => id !== tenderId),
            [to]: [...state.stages[to], tenderId],
          },
        })),
      addToStage: (tenderId, stage) =>
        set((state) => ({
          stages: {
            ...state.stages,
            [stage]: [...state.stages[stage], tenderId],
          },
        })),
    }),
    { name: "pipeline-store" }
  )
);
