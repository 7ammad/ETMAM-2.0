import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface ScoringWeights {
  relevance: number;
  budgetFit: number;
  timeline: number;
  competition: number;
  strategic: number;
}

interface SettingsStore {
  aiProvider: "gemini" | "groq";
  geminiModel: string;
  groqModel: string;

  scoringWeights: ScoringWeights;
  autoAnalyze: boolean;
  confidenceThreshold: number;

  crmEnabled: boolean;
  crmAutoCreate: boolean;

  locale: "en" | "ar";
  tableView: "table" | "card";

  setAIProvider: (provider: "gemini" | "groq") => void;
  setScoringWeights: (weights: Partial<ScoringWeights>) => void;
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
        aiProvider: "gemini",
        geminiModel: "gemini-2.5-flash",
        groqModel: "llama-3.3-70b-versatile",

        scoringWeights: {
          relevance: 30,
          budgetFit: 25,
          timeline: 20,
          competition: 15,
          strategic: 10,
        },
        autoAnalyze: false,
        confidenceThreshold: 50,

        crmEnabled: true,
        crmAutoCreate: false,

        locale: "ar",
        tableView: "table",

        setAIProvider: (provider) => set({ aiProvider: provider }),
        setScoringWeights: (weights) =>
          set((state) => ({
            scoringWeights: { ...state.scoringWeights, ...weights },
          })),
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
