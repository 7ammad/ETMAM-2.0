/**
 * Global app state (tenders, rate cards, presets, odoo config).
 * Will be expanded in Phase 1.2+.
 */
import { create } from "zustand";

interface AppStore {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  hydrated: false,
  setHydrated: (v) => set({ hydrated: v }),
}));
