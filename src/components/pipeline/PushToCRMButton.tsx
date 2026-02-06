"use client";

import { useState, useTransition } from "react";
import { pushToCRM, type CRMExportPayload } from "@/app/actions/pipeline";
import { CRMFieldMapping } from "./CRMFieldMapping";

interface PushToCRMButtonProps {
  tenderId: string;
}

export function PushToCRMButton({ tenderId }: PushToCRMButtonProps) {
  const [result, setResult] = useState<{ payload?: CRMExportPayload; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePush() {
    setResult(null);
    startTransition(async () => {
      const res = await pushToCRM(tenderId);
      if (res.success) {
        setResult({ payload: res.payload });
      } else {
        setResult({ error: res.error });
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handlePush}
        disabled={isPending}
        className="w-full rounded border border-status-pushed bg-status-pushed/20 px-2 py-1.5 text-xs font-medium text-status-pushed hover:bg-status-pushed/30 disabled:opacity-50"
      >
        {isPending ? "جارٍ المحاكاة..." : "دفع إلى CRM (محاكاة)"}
      </button>
      {result?.error && (
        <p className="text-xs text-destructive">{result.error}</p>
      )}
      {result?.payload && (
        <div className="rounded border border-border bg-card p-2 text-xs">
          <p className="mb-2 font-semibold text-muted-foreground">
            بيانات جاهزة للتصدير:
          </p>
          <CRMFieldMapping payload={result.payload} />
        </div>
      )}
    </div>
  );
}
