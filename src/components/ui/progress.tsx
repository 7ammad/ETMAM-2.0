"use client";

import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  variant?: "default" | "success" | "warning" | "danger" | "gold";
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  label?: string;
  className?: string;
}

const variantColors = {
  default: "bg-navy-400",
  success: "bg-confidence-high",
  warning: "bg-confidence-medium",
  danger: "bg-confidence-low",
  gold: "bg-gold-500",
};

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

function Progress({
  value,
  max = 100,
  variant = "gold",
  size = "md",
  showValue,
  label,
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-sm text-navy-300">{label}</span>
          )}
          {showValue && (
            <span className="text-sm font-medium text-navy-200 ltr-nums">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-navy-800",
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variantColors[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export { Progress };
export type { ProgressProps };
