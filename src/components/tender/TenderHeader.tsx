"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface TenderHeaderProps {
  tenderId: string;
  title: string;
  entity: string;
  score: number | null;
  deadline: string;
  status: string;
}

function scoreColorClass(score: number): string {
  if (score >= 70) return "text-confidence-high";
  if (score >= 40) return "text-accent-400";
  return "text-confidence-low";
}

export function TenderHeader({
  tenderId,
  title,
  entity,
  score,
  deadline,
  status,
}: TenderHeaderProps) {
  const pathname = usePathname();

  const deadlineDays = useMemo(() => {
    const d = new Date(deadline);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  }, [deadline]);

  const tabs = [
    { label: "نظرة عامة", href: `/tenders/${tenderId}` },
    { label: "التحليل", href: `/tenders/${tenderId}/analysis` },
  ];

  return (
    <div>
      {/* Title row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="text-overline text-muted-foreground">{entity}</span>
          <h1 className="text-2xl font-bold text-foreground tracking-tight mt-1">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Score badge */}
          {score != null && (
            <div className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5",
              score >= 70
                ? "border-confidence-high/25 bg-confidence-high/10"
                : score >= 40
                  ? "border-accent-500/25 bg-accent-500/10"
                  : "border-confidence-low/25 bg-confidence-low/10"
            )}>
              <span className={cn("text-lg font-bold font-data tabular-nums", scoreColorClass(score))}>
                {Math.round(score)}
              </span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          )}

          {/* Deadline countdown */}
          <div className={cn(
            "rounded-lg border px-3 py-1.5 text-sm",
            deadlineDays < 0
              ? "border-confidence-low/25 bg-confidence-low/10 text-confidence-low"
              : deadlineDays < 7
                ? "border-confidence-low/25 bg-confidence-low/10 text-confidence-low"
                : deadlineDays < 30
                  ? "border-accent-500/25 bg-accent-500/10 text-accent-400"
                  : "border-border/40 bg-card text-muted-foreground"
          )}>
            <span className="font-data tabular-nums">
              {deadlineDays < 0 ? "منتهي" : `${deadlineDays} يوم`}
            </span>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <nav className="mt-6 flex gap-0 border-b border-border/40" aria-label="تفاصيل المنافسة">
        {tabs.map((tab) => {
          const isActive =
            tab.href === `/tenders/${tenderId}`
              ? pathname === tab.href || pathname === `/tenders/${tenderId}/`
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "text-accent-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent-500" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
