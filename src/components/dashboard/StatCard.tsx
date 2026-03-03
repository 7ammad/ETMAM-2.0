"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  value: string | number;
  label: string;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "highlight" | "hero";
}

export function StatCard({
  value,
  label,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  if (variant === "hero") {
    return (
      <div className="relative flex flex-col justify-center rounded-xl border border-accent-500/20 bg-card p-6 overflow-hidden">
        {/* Accent glow behind the number */}
        <div className="absolute -top-8 -end-8 h-32 w-32 rounded-full bg-accent-500/5 blur-2xl" />
        <p className="text-overline text-muted-foreground mb-2 relative">{label}</p>
        <div className="flex items-end gap-3 relative">
          <p className="text-5xl font-extrabold text-gradient-accent font-data tabular-nums leading-none">
            {value}
          </p>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-500/10 border border-accent-500/20 mb-1">
            <Icon className="h-5 w-5 text-accent-400" />
          </div>
        </div>
        {trend != null && trend !== "" && (
          <p className="text-xs text-muted-foreground mt-2 relative">{trend}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-card p-5 transition-all duration-200 hover-lift overflow-hidden",
        variant === "highlight"
          ? "border-accent-500/20 shadow-[0_0_15px_-3px] shadow-accent-500/10"
          : "border-border/40"
      )}
    >
      {/* Accent left border stripe */}
      {variant === "highlight" && (
        <div className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-accent-500" />
      )}

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-2xl font-bold tabular-nums font-data text-foreground">
            {value}
          </p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {trend != null && trend !== "" && (
            <p className="text-xs text-muted-foreground">{trend}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
            variant === "highlight"
              ? "bg-accent-500/10 text-accent-400 border border-accent-500/20"
              : "bg-muted/50 text-muted-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
