"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface EvidenceItem {
  text: string;
  relevance: "supporting" | "concerning" | "neutral";
  source: string;
}

const RELEVANCE_CONFIG = {
  supporting: {
    label: "داعم",
    border: "border-s-confidence-high",
  },
  concerning: {
    label: "مقلق",
    border: "border-s-confidence-low",
  },
  neutral: {
    label: "محايد",
    border: "border-s-muted-foreground",
  },
} as const;

interface EvidenceQuotesProps {
  evidence: EvidenceItem[];
}

export function EvidenceQuotes({ evidence }: EvidenceQuotesProps) {
  const [open, setOpen] = useState(false);
  if (evidence.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/40 bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-start text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors rounded-xl"
        aria-expanded={open}
      >
        <span>اقتباسات الدليل ({evidence.length})</span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <ul className="border-t border-border/40 px-5 py-3 space-y-3">
          {evidence.map((item, i) => {
            const config = RELEVANCE_CONFIG[item.relevance] ?? RELEVANCE_CONFIG.neutral;
            return (
              <li
                key={i}
                className={cn(
                  "border-s-2 ps-4 py-1",
                  config.border
                )}
              >
                <p className="text-sm text-foreground leading-relaxed">
                  &ldquo;{item.text}&rdquo;
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {config.label} — {item.source}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
