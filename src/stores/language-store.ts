import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "@/lib/i18n";

interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      lang: "ar",
      setLang: (lang) => set({ lang }),
      toggle: () => set({ lang: get().lang === "ar" ? "en" : "ar" }),
    }),
    { name: "etmam-lang" },
  ),
);
