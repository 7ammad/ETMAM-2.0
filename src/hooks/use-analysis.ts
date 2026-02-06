"use client";

import { useCallback } from "react";
import { useAnalysisStore } from "@/stores/analysis-store";
import type { TenderAnalysis } from "@/types/ai";

export function useAnalysis() {
  const {
    analyses,
    activeAnalysisId,
    processing,
    queue,
    setAnalysis,
    setActiveAnalysis,
    setProcessing,
    addToQueue,
    removeFromQueue,
    getAnalysis,
  } = useAnalysisStore();

  const analyzeTender = useCallback(
    async (tenderId: string) => {
      setProcessing(tenderId);
      try {
        const res = await fetch("/api/ai/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tender_id: tenderId }),
        });

        if (!res.ok) {
          throw new Error("Analysis failed");
        }

        const data = await res.json();
        setAnalysis(tenderId, data.analysis as TenderAnalysis);
        removeFromQueue(tenderId);
      } catch {
        // Error handled by caller
      } finally {
        setProcessing(null);
      }
    },
    [setAnalysis, setProcessing, removeFromQueue]
  );

  return {
    analyses,
    activeAnalysisId,
    processing,
    queue,
    analyzeTender,
    setActiveAnalysis,
    addToQueue,
    getAnalysis,
  };
}
