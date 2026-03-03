"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Circle, AlertCircle } from "lucide-react";

export type StepStatus = "pending" | "running" | "done" | "error";

export interface PipelineStep {
  label: string;
  status: StepStatus;
  detail?: string;
}

interface PipelineStepperProps {
  steps: PipelineStep[];
  /** Show elapsed time for running step */
  showTimer?: boolean;
}

export function PipelineStepper({ steps, showTimer = true }: PipelineStepperProps) {
  const [elapsed, setElapsed] = useState(0);
  const runningIdx = steps.findIndex((s) => s.status === "running");

  useEffect(() => {
    if (runningIdx === -1) return;
    setElapsed(0);
    const interval = setInterval(() => setElapsed((e) => e + 100), 100);
    return () => clearInterval(interval);
  }, [runningIdx]);

  return (
    <div className="w-full space-y-3 py-2">
      {steps.map((step, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-300 ${
            step.status === "running"
              ? "border-accent-500/50 bg-accent-500/10"
              : step.status === "done"
                ? "border-emerald-500/30 bg-emerald-500/5"
                : step.status === "error"
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-border bg-card/50"
          }`}
        >
          {/* Icon */}
          <div className="flex-shrink-0">
            {step.status === "done" && (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            )}
            {step.status === "running" && (
              <Loader2 className="h-5 w-5 animate-spin text-accent-500" />
            )}
            {step.status === "error" && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            {step.status === "pending" && (
              <Circle className="h-5 w-5 text-muted-foreground/40" />
            )}
          </div>

          {/* Label */}
          <div className="flex-1 min-w-0">
            <span
              className={`text-sm font-medium ${
                step.status === "running"
                  ? "text-accent-500"
                  : step.status === "done"
                    ? "text-emerald-500"
                    : step.status === "error"
                      ? "text-red-500"
                      : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
            {step.detail && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {step.detail}
              </p>
            )}
          </div>

          {/* Timer / Status */}
          <div className="flex-shrink-0 text-xs tabular-nums text-muted-foreground">
            {step.status === "running" && showTimer && (
              <span>{(elapsed / 1000).toFixed(1)} ث</span>
            )}
            {step.status === "done" && step.detail && (
              <span className="text-emerald-500">{step.detail}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
