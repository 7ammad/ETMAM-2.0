"use client";

import { useState } from "react";
import { AIProviderConfig } from "./AIProviderConfig";
import { ScoringWeights } from "./ScoringWeights";
import { ProfileForm } from "./ProfileForm";

const TABS = [
  { id: "ai", label: "الذكاء الاصطناعي" },
  { id: "scoring", label: "أوزان التقييم" },
  { id: "profile", label: "الملف الشخصي" },
] as const;

export function SettingsTabs() {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("ai");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={
              active === tab.id
                ? "border-b-2 border-primary px-4 py-2 text-sm font-medium text-primary"
                : "px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        {active === "ai" && <AIProviderConfig />}
        {active === "scoring" && <ScoringWeights />}
        {active === "profile" && <ProfileForm />}
      </div>
    </div>
  );
}
