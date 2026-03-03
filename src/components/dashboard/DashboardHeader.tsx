"use client";

import Link from "next/link";
import { Upload } from "lucide-react";
import { useLanguageStore } from "@/stores/language-store";
import { t, ts } from "@/lib/i18n";

interface DashboardHeaderProps {
  userName?: string | null;
  empty?: boolean;
}

export function DashboardHeader({ userName, empty }: DashboardHeaderProps) {
  const lang = useLanguageStore((s) => s.lang);

  const greetingFn = t("greeting", lang);
  const greeting =
    typeof greetingFn === "function"
      ? greetingFn(userName ?? ts("user", lang))
      : ts("dashboard", lang);

  if (empty) {
    return (
      <main className="flex min-h-[50vh] flex-col items-center justify-center">
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-500/10 border border-accent-500/20 mb-6">
            <Upload className="h-7 w-7 text-accent-400" />
          </div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            {ts("emptyTitle", lang)}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {ts("emptyDesc", lang)}
          </p>
          <Link
            href="/tenders"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-400 transition-colors glow-accent"
          >
            <Upload className="h-4 w-4" />
            {ts("uploadNew", lang)}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <span className="text-overline text-muted-foreground">{greeting}</span>
        <h1 className="text-2xl font-bold text-foreground tracking-tight mt-1">
          {ts("dashboard", lang)}
        </h1>
      </div>
      <Link
        href="/tenders"
        className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-400 transition-colors"
      >
        <Upload className="h-4 w-4" />
        {ts("uploadNew", lang)}
      </Link>
    </div>
  );
}
