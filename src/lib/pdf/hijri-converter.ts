/**
 * Approximate Hijri-to-Gregorian date conversion.
 * Uses the Kuwaiti algorithm — accuracy: +/- 1 day.
 */

function hijriToGregorian(day: number, month: number, year: number): Date {
  const jd =
    Math.floor((11 * year + 3) / 30) +
    354 * year +
    30 * month -
    Math.floor((month - 1) / 2) +
    day +
    1948440 -
    385;

  const z = jd;
  const a = Math.floor((z - 1867216.25) / 36524.25);
  const b = z + 1 + a - Math.floor(a / 4);
  const c = b + 1524;
  const d = Math.floor((c - 122.1) / 365.25);
  const e = Math.floor(365.25 * d);
  const f = Math.floor((c - e) / 30.6001);

  const gDay = c - e - Math.floor(30.6001 * f);
  const gMonth = f <= 13 ? f - 1 : f - 13;
  const gYear = gMonth <= 2 ? d - 4715 : d - 4716;

  return new Date(gYear, gMonth - 1, gDay);
}

/**
 * Parse a Hijri date string (DD/MM/YYYY) and convert to ISO YYYY-MM-DD.
 * Returns null if parsing fails or date is out of expected range.
 */
export function parseHijriDate(dateStr: string): string | null {
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;

  const [, d, m, y] = match;
  const day = parseInt(d, 10);
  const month = parseInt(m, 10);
  const year = parseInt(y, 10);

  if (
    year < 1400 ||
    year > 1500 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 30
  ) {
    return null;
  }

  const gDate = hijriToGregorian(day, month, year);
  return gDate.toISOString().split("T")[0];
}
