"use client";

import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTenderStore, type Tender } from "@/stores/tender-store";

export function useTenders() {
  const { tenders, setTenders, addTenders, updateTender, removeTender, setLoading, setError } =
    useTenderStore();

  const fetchTenders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tenders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTenders((data as unknown as Tender[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tenders");
    } finally {
      setLoading(false);
    }
  }, [setTenders, setLoading, setError]);

  const deleteTender = useCallback(
    async (id: string) => {
      try {
        const supabase = createClient();
        const { error } = await supabase.from("tenders").delete().eq("id", id);
        if (error) throw error;
        removeTender(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete tender");
      }
    },
    [removeTender, setError]
  );

  return {
    tenders,
    fetchTenders,
    addTenders,
    updateTender,
    deleteTender,
  };
}
