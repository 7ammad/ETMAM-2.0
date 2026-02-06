import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { TenderStatus } from "@/lib/constants";

export interface Tender {
  id: string;
  user_id: string;
  entity: string;
  tender_title: string;
  tender_number: string;
  deadline: string;
  estimated_value: number;
  description?: string;
  requirements: string[];
  line_items: { description: string; quantity?: number; unit?: string; confidence: number }[];
  source_type: "csv" | "excel" | "pdf" | "manual";
  source_file_name?: string;
  extraction_confidence?: number;
  extraction_warnings: string[];
  evaluation_score?: number;
  recommendation?: "proceed" | "review" | "skip";
  total_cost?: number;
  proposed_price?: number;
  status: TenderStatus;
  exported_at?: string;
  exported_to?: "excel" | "odoo";
  odoo_lead_id?: number;
  created_at: string;
  updated_at: string;
}

interface TenderFilters {
  status: TenderStatus | "all";
  scoreRange: [number, number];
  dateRange: [string, string] | null;
  search: string;
  sortBy: "created_at" | "deadline" | "evaluation_score" | "tender_title";
  sortOrder: "asc" | "desc";
}

interface TenderStore {
  tenders: Tender[];
  selectedIds: string[];
  filters: TenderFilters;
  pagination: { page: number; pageSize: number; total: number };
  loading: boolean;
  error: string | null;

  setTenders: (tenders: Tender[]) => void;
  addTenders: (tenders: Tender[]) => void;
  updateTender: (id: string, updates: Partial<Tender>) => void;
  removeTender: (id: string) => void;
  setFilters: (filters: Partial<TenderFilters>) => void;
  resetFilters: () => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelected: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setPage: (page: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const DEFAULT_FILTERS: TenderFilters = {
  status: "all",
  scoreRange: [0, 100],
  dateRange: null,
  search: "",
  sortBy: "created_at",
  sortOrder: "desc",
};

export const useTenderStore = create<TenderStore>()(
  devtools(
    (set) => ({
      tenders: [],
      selectedIds: [],
      filters: DEFAULT_FILTERS,
      pagination: { page: 1, pageSize: 20, total: 0 },
      loading: false,
      error: null,

      setTenders: (tenders) => set({ tenders }),
      addTenders: (newTenders) =>
        set((state) => ({ tenders: [...state.tenders, ...newTenders] })),
      updateTender: (id, updates) =>
        set((state) => ({
          tenders: state.tenders.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      removeTender: (id) =>
        set((state) => ({
          tenders: state.tenders.filter((t) => t.id !== id),
          selectedIds: state.selectedIds.filter((sid) => sid !== id),
        })),
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
          pagination: { ...state.pagination, page: 1 },
        })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
      setSelectedIds: (ids) => set({ selectedIds: ids }),
      toggleSelected: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((sid) => sid !== id)
            : [...state.selectedIds, id],
        })),
      selectAll: () =>
        set((state) => ({ selectedIds: state.tenders.map((t) => t.id) })),
      clearSelection: () => set({ selectedIds: [] }),
      setPage: (page) =>
        set((state) => ({ pagination: { ...state.pagination, page } })),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    { name: "tender-store" }
  )
);
