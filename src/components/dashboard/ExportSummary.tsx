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
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">
          {ts("exportToOdoo", lang)}
        </h2>
        <Link
          href="/tenders"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {ts("viewTenders", lang)}
          <Arrow className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex flex-col items-center gap-3 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Send className="h-5 w-5 text-primary" />
        </div>
        {pushedToOdoo === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            {ts("noPushYet", lang)}
          </p>
        ) : (
          <p className="text-center text-sm text-foreground">{countText}</p>
        )}
        <p className="text-center text-xs text-muted-foreground">
          {ts("exportBulkHint", lang)}{" "}
          <Link
            href="/tenders"
            className="font-medium text-primary hover:underline"
          >
            {ts("tendersList", lang)}
          </Link>
        </p>
      </div>
    </div>
  );
}
