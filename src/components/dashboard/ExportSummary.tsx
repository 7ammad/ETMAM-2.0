"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { useLanguageStore } from "@/stores/language-store";
import { t, ts } from "@/lib/i18n";

interface ExportSummaryProps {
  pushedToOdoo: number;
}

export function ExportSummary({ pushedToOdoo }: ExportSummaryProps) {
  const lang = useLanguageStore((s) => s.lang);
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  const countMsg = t("pushedCount", lang);
  const countText =
    typeof countMsg === "function" ? countMsg(pushedToOdoo) : "";

  return (
    <div className="relative rounded-xl border border-accent-500/20 overflow-hidden bg-card">
      {/* Accent gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 via-transparent to-accent-500/3 pointer-events-none" />

      <div className="relative flex items-center justify-between border-b border-accent-500/10 px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">
          {ts("exportToOdoo", lang)}
        </h2>
        <Link
          href="/opportunities"
          className="flex items-center gap-1 text-xs font-medium text-accent-400 hover:text-accent-300 transition-colors"
        >
          {ts("viewTenders", lang)}
          <Arrow className="h-3 w-3" />
        </Link>
      </div>

      <div className="relative flex flex-col items-center gap-4 p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-500/10 border border-accent-500/20 glow-accent">
          <Send className="h-6 w-6 text-accent-400" />
        </div>

        {pushedToOdoo === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            {ts("noPushYet", lang)}
          </p>
        ) : (
          <div className="text-center">
            <p className="text-3xl font-bold font-data tabular-nums text-accent-400">
              {pushedToOdoo}
            </p>
            <p className="text-sm text-foreground mt-1">{countText}</p>
          </div>
        )}

        <Link
          href="/tenders"
          className="inline-flex items-center gap-2 rounded-lg bg-accent-500/10 border border-accent-500/20 px-4 py-2 text-xs font-medium text-accent-400 hover:bg-accent-500/20 transition-colors"
        >
          {ts("exportBulkHint", lang)}{" "}
          <span className="font-semibold">{ts("tendersList", lang)}</span>
          <Arrow className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
