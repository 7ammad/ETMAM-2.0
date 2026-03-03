"use client";

import { useLanguageStore } from "@/stores/language-store";
import { ts } from "@/lib/i18n";
import type { TransKey } from "@/lib/i18n";

interface Props {
  i18nKey: TransKey;
  as?: "h1" | "h2" | "h3";
  className?: string;
}

export function LocalizedHeading({ i18nKey, as: Tag = "h1", className }: Props) {
  const lang = useLanguageStore((s) => s.lang);
  return <Tag className={className}>{ts(i18nKey, lang)}</Tag>;
}
