/**
 * RTL / Arabic support — direction only.
 * For number/date/currency formatting use @/lib/utils/format (single source of truth).
 */

export function getDirection(locale: string): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}
