"use client";

import Link from "next/link";
import { Upload } from "lucide-react";
import { useLanguageStore } from "@/stores/language-store";
import { t, ts } from "@/lib/i18n";

interface DashboardHeaderProps {
  userName?: string | null;
  empty?: boolean;
}

function getTimeGreeting(lang: "ar" | "en"): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return ts("goodMorning", lang);
  return ts("goodEvening", lang);
}

export function DashboardHeader({ userName, empty }: DashboardHeaderProps) {
  const lang = useLanguageStore((s) => s.lang);

  const greetingFn = t("greeting", lang);
  const greeting =
    typeof greetingFn === "function"
      ? greetingFn(userName ?? ts("user", lang))
      : ts("dashboard", lang);
  const timeGreeting = getTimeGreeting(lang);

  if (empty) {
    return (
      <main className="flex min-h-[50vh] flex-col items-center justify-center">
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-500/10 border border-accent-500/20 mb-6 glow-accent">
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
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card px-6 py-5">
      {/* Dot pattern overlay */}
      <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />
      {/* Gradient accent wash */}
      <div className="absolute -top-16 -end-16 h-48 w-48 rounded-full bg-accent-500/5 blur-3xl pointer-events-none" />

      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-accent-400">{timeGreeting}</span>
          <h1 className="text-2xl font-bold text-foreground tracking-tight mt-0.5">
            {greeting}
          </h1>
        </div>
        <Link
          href="/tenders"
          className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-400 transition-all glow-accent"
        >
          <Upload className="h-4 w-4" />
          {ts("uploadNew", lang)}
        </Link>
      </div>
    </div>
  );
}
