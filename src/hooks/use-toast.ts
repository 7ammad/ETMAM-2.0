"use client";

import { useCallback } from "react";
import { useUIStore } from "@/stores/ui-store";
import type { ToastType } from "@/types/ui";

export function useToast() {
  const { toasts, addToast, removeToast } = useUIStore();

  const toast = useCallback(
    (type: ToastType, title: string, description?: string) => {
      addToast({ type, title, description, duration: 5000 });
    },
    [addToast]
  );

  const success = useCallback(
    (title: string, description?: string) => toast("success", title, description),
    [toast]
  );

  const error = useCallback(
    (title: string, description?: string) => toast("error", title, description),
    [toast]
  );

  const warning = useCallback(
    (title: string, description?: string) => toast("warning", title, description),
    [toast]
  );

  const info = useCallback(
    (title: string, description?: string) => toast("info", title, description),
    [toast]
  );

  return { toasts, removeToast, toast, success, error, warning, info };
}
