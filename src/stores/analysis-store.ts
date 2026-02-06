import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { TenderAnalysis } from "@/types/ai";

interface AnalysisStore {
  analyses: Record<string, TenderAnalysis>;
  activeAnalysisId: string | null;
  queue: string[];
  processing: string | null;

  setAnalysis: (tenderId: string, analysis: TenderAnalysis) => void;
  removeAnalysis: (tenderId: string) => void;
  setActiveAnalysis: (tenderId: string | null) => void;
  addToQueue: (tenderIds: string[]) => void;
  removeFromQueue: (tenderId: string) => void;
  setProcessing: (tenderId: string | null) => void;
  getAnalysis: (tenderId: string) => TenderAnalysis | null;
}

export const useAnalysisStore = create<AnalysisStore>()(
  devtools(
    (set, get) => ({
      analyses: {},
      activeAnalysisId: null,
      queue: [],
      processing: null,

      setAnalysis: (tenderId, analysis) =>
        set((state) => ({
          analyses: { ...state.analyses, [tenderId]: analysis },
        })),
      removeAnalysis: (tenderId) =>
        set((state) => {
          const { [tenderId]: _, ...rest } = state.analyses;
          return { analyses: rest };
        }),
      setActiveAnalysis: (tenderId) => set({ activeAnalysisId: tenderId }),
      addToQueue: (tenderIds) =>
        set((state) => ({
          queue: [...new Set([...state.queue, ...tenderIds])],
        })),
      removeFromQueue: (tenderId) =>
        set((state) => ({
          queue: state.queue.filter((id) => id !== tenderId),
        })),
      setProcessing: (tenderId) => set({ processing: tenderId }),
      getAnalysis: (tenderId) => get().analyses[tenderId] ?? null,
    }),
    { name: "analysis-store" }
  )
);
