"use client";

import { useTransition } from "react";
import { analyzeTender } from "@/app/actions/analyze";
import { useSettingsStore } from "@/stores/settings-store";

interface AnalyzeButtonProps {
  tenderId: string;
  onError?: (message: string) => void;
}

export function AnalyzeButton({ tenderId, onError }: AnalyzeButtonProps) {
  const [isPending, startTransition] = useTransition();
  const scoringWeights = useSettingsStore((s) => s.scoringWeights);

  function handleAnalyze() {
    startTransition(async () => {
      const result = await analyzeTender(tenderId, {
        ...scoringWeights,
      } as Record<string, number>);
      if (result.success) {
        window.location.reload();
      } else {
        onError?.(result.error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleAnalyze}
      disabled={isPending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-gold-600 disabled:opacity-50"
    >
      {isPending ? "جارٍ التحليل..." : "تحليل بالذكاء الاصطناعي"}
    </button>
  );
}
