import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with deduplication */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number with Arabic locale */
export function formatNumber(value: number, locale = "ar-SA"): string {
  return new Intl.NumberFormat(locale).format(value);
}

/** Format currency in SAR */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Get score color class based on value */
export function getScoreColor(score: number): string {
  if (score >= 76) return "text-confidence-high";
  if (score >= 51) return "text-gold-500";
  if (score >= 26) return "text-confidence-medium";
  return "text-confidence-low";
}

/** Get score background color class */
export function getScoreBgColor(score: number): string {
  if (score >= 76) return "bg-confidence-high/10 text-confidence-high";
  if (score >= 51) return "bg-gold-500/10 text-gold-500";
  if (score >= 26) return "bg-confidence-medium/10 text-confidence-medium";
  return "bg-confidence-low/10 text-confidence-low";
}
