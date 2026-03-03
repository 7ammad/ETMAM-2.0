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
      <div className="flex flex-col justify-center">
        <p className="text-overline text-muted-foreground mb-2">{label}</p>
        <p className="text-display text-gradient-accent font-data tabular-nums">
          {value}
        </p>
        {trend != null && trend !== "" && (
          <p className="text-xs text-muted-foreground mt-1">{trend}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 transition-colors",
        variant === "highlight"
          ? "border-accent-500/20"
          : "border-border/40"
      )}
    >
      {variant === "highlight" && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-accent-500/40 to-transparent" />
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
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            variant === "highlight"
              ? "bg-accent-500/10 text-accent-400"
              : "bg-muted/50 text-muted-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
