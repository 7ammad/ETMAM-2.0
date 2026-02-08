"use client";

import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  value: string | number;
  label: string;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "highlight";
}

export function StatCard({
  value,
  label,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md ${
        variant === "highlight"
          ? "border-primary/30"
          : "border-border"
      }`}
    >
      {variant === "highlight" && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-l from-transparent via-primary to-transparent" />
      )}

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {value}
          </p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {trend != null && trend !== "" && (
            <p className="text-xs text-muted-foreground">{trend}</p>
          )}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            variant === "highlight"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
