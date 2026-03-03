"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  getAllTenderIds,
  exportTendersToExcel,
  pushQualifiedTendersToOdoo,
} from "@/app/actions/export";
import { FileDown, Send } from "lucide-react";
import { useLanguageStore } from "@/stores/language-store";
import { ts, t } from "@/lib/i18n";

/**
 * Phase 2.3: Export All (Excel) and Push All Qualified (Odoo) CTAs.
 * Use on Dashboard and/or Tenders list page.
 */
export function BatchExportActions() {
  const lang = useLanguageStore((s) => s.lang);
  const [exporting, setExporting] = useState(false);
  const [pushing, setPushing] = useState(false);

  async function handleExportAll() {
    setExporting(true);
    try {
      const idsResult = await getAllTenderIds();
      if (!idsResult.success) {
        toast.error(idsResult.error);
        return;
      }
      if (idsResult.ids.length === 0) {
        toast.info(ts("noTendersToExport", lang));
        return;
      }
      const result = await exportTendersToExcel(idsResult.ids);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const bin = atob(result.base64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const blob = new Blob([arr], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      const downloadedFn = t("downloaded", lang);
      const msg = typeof downloadedFn === "function" ? downloadedFn(result.filename) : result.filename;
      toast.success(msg as string);
    } finally {
      setExporting(false);
    }
  }

  async function handlePushQualified() {
    setPushing(true);
    try {
      const result = await pushQualifiedTendersToOdoo();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (result.successCount === 0 && result.failedCount === 0) {
        toast.info(ts("noQualifiedTenders", lang));
        return;
      }
      const resultFn = t("pushedToOdooResult", lang);
      const msg = typeof resultFn === "function"
        ? resultFn(result.successCount, result.failedCount)
        : `${result.successCount}`;
      if (result.failedCount > 0) {
        const errors = result.results.filter((r) => !r.success);
        toast.error(`${msg}. ${errors[0]?.error ?? ""}`);
      } else {
        toast.success(msg as string);
      }
    } finally {
      setPushing(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportAll}
        disabled={exporting}
        isLoading={exporting}
      >
        <FileDown className="h-4 w-4 me-1" />
        {ts("exportAllExcel", lang)}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePushQualified}
        disabled={pushing}
        isLoading={pushing}
      >
        <Send className="h-4 w-4 me-1" />
        {ts("pushQualifiedToOdoo", lang)}
      </Button>
    </div>
  );
}
