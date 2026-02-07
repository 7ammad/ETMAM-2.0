"use client";

interface StatCardProps {
  value: string | number;
  label: string;
  trend?: string;
  variant?: "default" | "highlight";
}

export function StatCard({
  value,
  label,
  trend,
  variant = "default",
}: StatCardProps) {
  return (
    <div
      className={
        variant === "highlight"
          ? "rounded-lg border-2 border-gold-500/50 bg-card p-4 shadow-sm"
          : "rounded-lg border border-border border-r-2 border-r-gold-500/30 bg-card p-4 shadow-sm"
      }
    >
      <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      {trend != null && trend !== "" && (
        <p className="mt-0.5 text-xs text-muted-foreground">{trend}</p>
      )}
    </div>
  );
}
