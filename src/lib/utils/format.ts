/**
 * Number, date, and currency formatting utilities.
 * Used for display in tables and cards.
 */

export function formatNumber(num: number, locale: string = "ar-SA"): string {
  return new Intl.NumberFormat(locale).format(num);
}

export function formatCurrency(
  amount: number,
  locale: string = "ar-SA"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string, locale: string = "ar-SA"): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatShortDate(
  dateStr: string,
  locale: string = "ar-SA"
): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function daysRemaining(deadline: string): number {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Arabic compact suffixes (م = million, ألف = thousand). Numbers stay LTR per FRONTEND. */
const COMPACT_AR = { M: "م", K: "ألف" } as const;
const COMPACT_EN = { M: "M", K: "K" } as const;

export function formatCompactNumber(
  num: number,
  locale: string = "ar-SA"
): string {
  const useArabic = locale.startsWith("ar");
  const suffixes = useArabic ? COMPACT_AR : COMPACT_EN;
  if (num >= 1_000_000) {
    const value = (num / 1_000_000).toFixed(1);
    return `${value} ${suffixes.M}`;
  }
  if (num >= 1_000) {
    const value = (num / 1_000).toFixed(0);
    return `${value} ${suffixes.K}`;
  }
  return formatNumber(num, locale);
}
