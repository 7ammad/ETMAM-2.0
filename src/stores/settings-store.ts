import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { DEFAULT_SCORING_WEIGHTS } from "@/lib/constants";

interface ScoringWeights {
  relevance: number;
  budgetFit: number;
  timeline: number;
  competition: number;
  strategic: number;
}

interface SettingsStore {
  aiProvider: "deepseek" | "gemini" | "groq";
  deepseekModel: string;
  geminiModel: string;
  groqModel: string;

  scoringWeights: ScoringWeights;
  autoAnalyze: boolean;
  confidenceThreshold: number;

  evaluationMode: "ai" | "configurable";
  activeProfileId: string | null;

  crmEnabled: boolean;
  crmAutoCreate: boolean;

  locale: "en" | "ar";
  tableView: "table" | "card";

  setAIProvider: (provider: "deepseek" | "gemini" | "groq") => void;
  setScoringWeights: (weights: Partial<ScoringWeights>) => void;
  setEvaluationMode: (mode: "ai" | "configurable") => void;
  setActiveProfileId: (id: string | null) => void;
  setLocale: (locale: "en" | "ar") => void;
  setTableView: (view: "table" | "card") => void;
  setCRMEnabled: (enabled: boolean) => void;
  setCRMAutoCreate: (auto: boolean) => void;
  setAutoAnalyze: (auto: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set) => ({
        aiProvider: "deepseek",
        deepseekModel: "deepseek-chat",
        geminiModel: "gemini-2.5-flash",
        groqModel: "llama-3.3-70b-versatile",

        scoringWeights: {
          ...DEFAULT_SCORING_WEIGHTS,
        },
        autoAnalyze: false,
        confidenceThreshold: 50,

        evaluationMode: "ai",
        activeProfileId: null,

        crmEnabled: true,
        crmAutoCreate: false,

        locale: "ar",
        tableView: "table",

        setAIProvider: (provider) => set({ aiProvider: provider }),
        setScoringWeights: (weights) =>
          set((state) => ({
            scoringWeights: { ...state.scoringWeights, ...weights },
          })),
        setEvaluationMode: (mode) => set({ evaluationMode: mode }),
        setActiveProfileId: (id) => set({ activeProfileId: id }),
        setLocale: (locale) => set({ locale }),
        setTableView: (view) => set({ tableView: view }),
        setCRMEnabled: (enabled) => set({ crmEnabled: enabled }),
        setCRMAutoCreate: (auto) => set({ crmAutoCreate: auto }),
        setAutoAnalyze: (auto) => set({ autoAnalyze: auto }),
      }),
      { name: "etmam-settings" }
    ),
    { name: "settings-store" }
  )
);
