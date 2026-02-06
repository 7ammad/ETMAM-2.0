"use client";

import { useState } from "react";

interface EvidenceItem {
  text: string;
  relevance: "supporting" | "concerning" | "neutral";
  source: string;
}

const RELEVANCE_LABELS: Record<string, string> = {
  supporting: "داعم",
  concerning: "مقلق",
  neutral: "محايد",
};

interface EvidenceQuotesProps {
  evidence: EvidenceItem[];
}

export function EvidenceQuotes({ evidence }: EvidenceQuotesProps) {
  const [open, setOpen] = useState(false);
  if (evidence.length === 0) return null;

  return (
    <div className="rounded-md border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-start text-sm font-semibold text-foreground hover:bg-muted/50"
        aria-expanded={open}
      >
        <span>اقتباسات الدليل ({evidence.length})</span>
        <span className="text-muted-foreground">{open ? "▼" : "◀"}</span>
      </button>
      {open && (
        <ul className="border-t border-border px-4 py-3">
          {evidence.map((item, i) => (
            <li key={i} className="border-b border-border py-2 last:border-0">
              <p className="text-sm text-foreground">"{item.text}"</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {RELEVANCE_LABELS[item.relevance] ?? item.relevance} — {item.source}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
