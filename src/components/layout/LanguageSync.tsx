"use client";

import { useEffect } from "react";
import { useLanguageStore } from "@/stores/language-store";

/**
 * Syncs the Zustand language store with the <html> lang and dir attributes.
 * Rendered once in root layout.
 */
export function LanguageSync() {
  const lang = useLanguageStore((s) => s.lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  return null;
}
