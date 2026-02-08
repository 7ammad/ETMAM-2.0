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
        <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {ts("emptyTitle", lang)}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {ts("emptyDesc", lang)}
          </p>
          <Link
            href="/tenders"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Upload className="h-4 w-4" />
            {ts("uploadNew", lang)}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {ts("dashboard", lang)}
        </h1>
        <p className="text-sm text-muted-foreground">{greeting}</p>
      </div>
      <Link
        href="/tenders"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Upload className="h-4 w-4" />
        {ts("uploadNew", lang)}
      </Link>
    </div>
  );
}
